import { apiRequest } from "./apiClient";

const trainingRequest = (endpoint, options = {}) =>
  apiRequest(endpoint, {
    ...options,
    baseUrl: "/api",
    requiresSession: true,
    csrf: Boolean(options.method && options.method !== "GET"),
  });

export const trainingMatrixApi = {
  async search(page = 1, pageSize = 8, keyword = "", filters = {}, signal) {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (keyword.trim()) params.set("Search.Keyword", keyword.trim());
    if (filters.onlyExpired) params.set("OnlyExpired", "true");
    if (filters.subjectId) params.set("SubjectId", filters.subjectId);
    if (filters.status) params.set("TrainingStatus", String(filters.status));
    const { data } = await trainingRequest(`/TrainingRecords?${params}`, { signal });
    return data;
  },

  async searchAllExpired(subjectId = "") {
    const pageSize = 100;
    const filters = { onlyExpired: true, subjectId };
    const firstPage = await this.search(1, pageSize, "", filters);
    const employees = [...firstPage.pageItems];
    for (let page = 2; page <= firstPage.pageInfo.totalPages; page += 1) {
      const result = await this.search(page, pageSize, "", filters);
      employees.push(...result.pageItems);
    }
    return employees;
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
