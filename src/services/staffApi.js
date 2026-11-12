import { apiRequest } from './apiClient';

const statusLabels = { 1: 'Đang làm việc', 2: 'Tạm nghỉ' };

function toEmployee(member) {
  const joinedOn = member.joinedOn?.slice(0, 10) ?? '';

  return {
    ...member,
    email: member.email ?? '',
    phone: member.phone ?? '',
    department: member.department ?? '',
    role: member.jobTitle ?? '',
    status: statusLabels[member.status],
    joinedOn,
    joinedOnTimestamp: member.joinedOn,
    joined: joinedOn.split('-').reverse().join('/'),
  };
}

export function staffError(error, fallback) {
  switch (error.status) {
    case 400:
      return 'Thông tin nhân viên chưa hợp lệ. Vui lòng kiểm tra lại các trường đã nhập.';
    case 401:
    case 403:
      return 'Bạn cần đăng nhập để quản lý nhân viên trong môi trường này.';
    case 404:
      return 'Hồ sơ này đã bị xóa hoặc không còn tồn tại.';
    case 409:
      return 'Mã nhân viên đã được sử dụng.';
    default:
      return fallback;
  }
}

export const staffApi = {
  async list(signal) {
    const employees = [];
    let page = 1;
    let hasNext;
    do {
      const { data } = await apiRequest(`/Staff?page=${page}&pageSize=100`, { signal });
      employees.push(...data.pageItems.map(toEmployee));
      hasNext = data.pageInfo.hasNext;
      page += 1;
    } while (hasNext);
    return employees;
  },

  async detail(id) {
    const { data } = await apiRequest(`/Staff/${id}`);
    return toEmployee(data);
  },

  async save(form) {
    const joinedOn = form.joinedOn === form.joinedOnTimestamp?.slice(0, 10)
      ? form.joinedOnTimestamp
      : form.joinedOn ? `${form.joinedOn}T00:00:00Z` : null;

    const { data } = await apiRequest(form.id ? `/Staff/${form.id}` : '/Staff', {
      method: form.id ? 'PUT' : 'POST',
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
    });
    return toEmployee(data);
  },

  remove(id) {
    return apiRequest(`/Staff/${id}`, { method: 'DELETE' });
  },
};
