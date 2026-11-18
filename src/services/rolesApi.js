import { apiRequest } from "./apiClient";

function request(path = "", options = {}) {
  return apiRequest(`/Roles${path}`, {
    baseUrl: "/api",
    requiresSession: true,
    csrf: Boolean(options.method),
    ...options,
  });
}

export function roleError(error, fallback) {
  if (error.status === 403) return "Bạn không có quyền thực hiện thao tác này.";
  if (error.status === 404) return "Vai trò không còn trong danh sách.";
  if (error.message && !error.message.startsWith("API Error:")) return error.message;
  return fallback;
}

export const rolesApi = {
  async search(page = 1, pageSize = 8, keyword = "", signal) {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (keyword.trim()) params.set("keyword", keyword.trim());
    const { data } = await request(`?${params}`, { signal });
    return data;
  },

  async permissions(signal) {
    const { data } = await request("/Permissions", { signal });
    return data;
  },

  async options(signal) {
    const { data } = await request("/Options", { signal });
    return data;
  },

  async detail(id) {
    const { data } = await request(`/${id}`);
    return data;
  },

  async save(role, values) {
    const { data } = await request(role ? `/${role.id}` : "", {
      method: role ? "PUT" : "POST",
      body: JSON.stringify(values),
    });
    return data;
  },

  remove(id) {
    return request(`/${id}`, { method: "DELETE" });
  },
};
