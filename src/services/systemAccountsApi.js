import { apiRequest } from "./apiClient";

function request(path = "", options = {}) {
  return apiRequest(`/SystemAccounts${path}`, {
    baseUrl: "/api",
    requiresSession: true,
    csrf: Boolean(options.method),
    ...options,
  });
}

export function systemAccountError(error, fallback) {
  if (error.message === "SystemAccount.RootProtected") return "Tài khoản admin gốc được bảo vệ.";
  if (error.message === "SystemAccount.SelfDeleteForbidden") return "Bạn không thể tự xóa tài khoản của mình.";
  if (error.message === "SystemAccount.InvalidPassword") return "Mật khẩu không được chỉ chứa khoảng trắng hoặc dài quá 72 byte.";
  if (error.message === "SystemAccount.CredentialsRequired") return "Tên đăng nhập cần ít nhất 6 ký tự và mật khẩu là bắt buộc.";
  if (error.status === 400) return "Thông tin tài khoản chưa hợp lệ. Vui lòng kiểm tra lại.";
  if (error.status === 403) return "Bạn không có quyền thực hiện thao tác này.";
  if (error.status === 404) return "Tài khoản không còn trong danh sách.";
  if (error.status === 409) return "Tên đăng nhập đã được sử dụng.";
  return fallback;
}

export const systemAccountsApi = {
  async list(page, signal) {
    const { data } = await request(`?page=${page}`, { signal });
    return data;
  },

  async save(account, values) {
    const { data } = await request(account ? `/${account.id}` : "", {
      method: account ? "PUT" : "POST",
      body: JSON.stringify(values),
    });
    return data;
  },

  remove: (id) => request(`/${id}`, { method: "DELETE" }),
};
