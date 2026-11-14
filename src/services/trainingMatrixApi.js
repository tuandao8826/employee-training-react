import { apiRequest } from "./apiClient";

const trainingRequest = (endpoint, options = {}) =>
  apiRequest(endpoint, {
    ...options,
    baseUrl: "/api",
    requiresSession: true,
    csrf: Boolean(options.method && options.method !== "GET"),
  });

export const trainingMatrixApi = {
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

  async search(page = 1, pageSize = 8, keyword = "", filters = {}, signal) {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (keyword.trim()) params.set("Search.Keyword", keyword.trim());
    if (filters.onlyExpired) params.set("OnlyExpired", "true");
    if (filters.subjectId) params.set("SubjectId", filters.subjectId);
    const { data } = await trainingRequest(`/TrainingRecords?${params}`, { signal });
    return data;
  },

  async searchAll(keyword = "", filters = {}, signal) {
    const pageSize = 100;
    const firstPage = await this.search(1, pageSize, keyword, filters, signal);
    const employees = [...firstPage.pageItems];
    for (let page = 2; page <= firstPage.pageInfo.totalPages; page += 1) {
      const result = await this.search(page, pageSize, keyword, filters, signal);
      employees.push(...result.pageItems);
    }
    return employees;
  },

  searchAllExpired(subjectId = "") {
    return this.searchAll("", { onlyExpired: true, subjectId });
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
