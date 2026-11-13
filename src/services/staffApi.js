import { apiRequest } from "./apiClient";

const statusLabels = { 1: "Đang làm việc", 2: "Tạm nghỉ" };

const staffRequest = (endpoint, options = {}) =>
  apiRequest(endpoint, {
    ...options,
    requiresSession: true,
    csrf: Boolean(options.method && options.method !== "GET"),
  });

function toEmployee(member) {
  const joinedOn = member.joinedOn?.slice(0, 10) ?? "";

  return {
    ...member,
    email: member.email ?? "",
    phone: member.phone ?? "",
    department: member.department ?? "",
    role: member.jobTitle ?? "",
    status: statusLabels[member.status],
    joinedOn,
    joinedOnTimestamp: member.joinedOn,
    joined: joinedOn.split("-").reverse().join("/"),
  };
}

export function staffError(error, fallback) {
  switch (error.status) {
    case 400:
      return "Thông tin nhân viên chưa hợp lệ. Vui lòng kiểm tra lại các trường đã nhập.";
    case 401:
      return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    case 403:
      return "Bạn không có quyền thực hiện thao tác này.";
    case 404:
      return "Hồ sơ này đã bị xóa hoặc không còn tồn tại.";
    case 409:
      return "Mã nhân viên đã được sử dụng.";
    default:
      return fallback;
  }
}

export const staffApi = {
  async search(page = 1, pageSize = 8, keyword = "", signal) {
    const search = keyword.trim()
      ? `&Search.Keyword=${encodeURIComponent(keyword.trim())}`
      : "";
    const { data } = await staffRequest(
      `/Staff?page=${page}&pageSize=${pageSize}${search}`,
      { signal },
    );
    return {
      ...data,
      pageItems: data.pageItems.map(toEmployee),
    };
  },

  async list(signal) {
    const employees = [];
    let page = 1;
    let hasNext;
    do {
      const data = await this.search(page, 100, "", signal);
      employees.push(...data.pageItems);
      hasNext = data.pageInfo.hasNext;
      page += 1;
    } while (hasNext);
    return employees;
  },

  async detail(id) {
    const { data } = await staffRequest(`/Staff/${id}`);
    return toEmployee(data);
  },

  async save(form, signal) {
    const joinedOn =
      form.joinedOn === form.joinedOnTimestamp?.slice(0, 10)
        ? form.joinedOnTimestamp
        : form.joinedOn
          ? `${form.joinedOn}T00:00:00Z`
          : null;

    const { data } = await staffRequest(
      form.id ? `/Staff/${form.id}` : "/Staff",
      {
        method: form.id ? "PUT" : "POST",
        signal,
        body: JSON.stringify({
          code: form.code.trim(),
          name: form.name.trim(),
          email: form.email?.trim() || null,
          phone: form.phone?.trim() || null,
          department: form.department?.trim() || null,
          jobTitle: form.role?.trim() || null,
          joinedOn,
          status: form.status === statusLabels[2] ? 2 : 1,
        }),
      },
    );
    return toEmployee(data);
  },

  remove(id) {
    return staffRequest(`/Staff/${id}`, { method: "DELETE" });
  },
};
