import { apiRequest } from "./apiClient";

const trainingRequest = (endpoint, options = {}) =>
  apiRequest(endpoint, {
    ...options,
    baseUrl: "/api",
    requiresSession: true,
    csrf: Boolean(options.method && options.method !== "GET"),
  });

async function trainingFileRequest(endpoint) {
  const { body, headers } = await trainingRequest(endpoint, {
    responseType: "blob",
    includeHeaders: true,
  });
  const disposition = headers.get("Content-Disposition") ?? "";
  const encodedName = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
  const plainName = /filename="?([^";]+)"?/i.exec(disposition)?.[1];
  return {
    blob: body,
    fileName: encodedName ? decodeURIComponent(encodedName) : plainName || "Bang_quan_ly_dao_tao.xlsx",
  };
}

export const trainingMatrixApi = {
  async statistics(signal) {
    const { data } = await trainingRequest("/TrainingRecords/Statistics", { signal });
    return data;
  },

  exportMatrix() {
    return trainingFileRequest("/TrainingRecords/Export");
  },

  exportExpired(subjectId = "") {
    const query = subjectId ? `?${new URLSearchParams({ subjectId })}` : "";
    return trainingFileRequest(`/TrainingRecords/Export/Expired${query}`);
  },

  async previewImportWorkbook(data) {
    const { data: result } = await trainingRequest("/TrainingRecords/Import/Preview", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return result;
  },

  async importWorkbook(data) {
    const { data: result } = await trainingRequest("/TrainingRecords/Import", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return result;
  },

  async notifications(page = 1, pageSize = 5, signal) {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    const { data } = await trainingRequest(`/TrainingRecords/Notifications?${params}`, { signal });
    return data;
  },

  markNotificationRead(id) {
    return trainingRequest(`/TrainingRecords/Notifications/${id}/Read`, { method: "PUT" });
  },

  markAllNotificationsRead() {
    return trainingRequest("/TrainingRecords/Notifications/ReadAll", { method: "PUT" });
  },

  async search(page = 1, pageSize = 8, keyword = "", filters = {}, signal) {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (keyword.trim()) params.set("Search.Keyword", keyword.trim());
    if (filters.subjectId) params.set("SubjectId", filters.subjectId);
    const trainingStatuses = {
      valid: "Valid",
      expired: "Expired",
      expiring: "ExpiringSoon",
      "expires-today": "ExpiresToday",
    };
    if (trainingStatuses[filters.trainingStatus]) params.set("TrainingStatus", trainingStatuses[filters.trainingStatus]);
    const { data } = await trainingRequest(`/TrainingRecords?${params}`, { signal });
    return data;
  },

  saveDate(staffMemberId, subjectId, trainingDate) {
    return trainingRequest(`/TrainingRecords/${staffMemberId}/${subjectId}`, {
      method: "PUT",
      body: JSON.stringify({ trainingDate: trainingDate ? `${trainingDate}T00:00:00Z` : null }),
    });
  },
};

export function trainingMatrixError(error, fallback) {
  if (error.status === 400) return "Thông tin hồ sơ đào tạo chưa hợp lệ.";
  if (error.status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  if (error.status === 403) return "Bạn không có quyền quản lý hồ sơ đào tạo.";
  if (error.status === 404) return "Không tìm thấy nhân viên hoặc môn học.";
  return fallback;
}
