import { apiRequest } from "./apiClient";

const units = { 1: "Ngày", 2: "Tháng", 3: "Năm" };
const unitValues = { Ngày: 1, Tháng: 2, Năm: 3 };

const subjectRequest = (endpoint, options = {}) =>
  apiRequest(endpoint, {
    ...options,
    baseUrl: "/api",
    requiresSession: true,
    csrf: Boolean(options.method && options.method !== "GET"),
  });

function fromApi(subject) {
  return {
    id: subject.id,
    code: subject.subjectCode,
    name: subject.name,
    description: subject.description ?? "",
    duration: subject.cycleValue,
    cycleUnit: units[subject.subjectCycleUnit] ?? "Ngày",
    category: subject.operationStatus === 2 ? "Đã khóa" : "Đang hoạt động",
  };
}

function toRequestBody(subject) {
  return {
    subjectCode: subject.code.trim(),
    name: subject.name.trim(),
    description: subject.description?.trim() || null,
    cycleValue: Number(subject.duration),
    subjectCycleUnit: unitValues[subject.cycleUnit] ?? 1,
    operationStatus: subject.category === "Đã khóa" ? 2 : 1,
  };
}

export const subjectApi = {
  async search(page = 1, pageSize = 8, keyword = "", signal) {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (keyword.trim()) params.set("Search.Keyword", keyword.trim());
    const { data } = await subjectRequest(`/Subjects?${params.toString()}`, { signal });
    return { ...data, pageItems: data.pageItems.map(fromApi) };
  },

  async list(signal) {
    const subjects = [];
    let page = 1;
    let hasNext;
    do {
      const { data } = await subjectRequest(
        `/Subjects?page=${page}&pageSize=100`,
        { signal },
      );
      subjects.push(...data.pageItems.map(fromApi));
      hasNext = data.pageInfo.hasNext;
      page += 1;
    } while (hasNext);
    return subjects;
  },

  async save(subject) {
    const { data } = await subjectRequest(
      subject.id ? `/Subjects/${subject.id}` : "/Subjects",
      {
        method: subject.id ? "PUT" : "POST",
        body: JSON.stringify(toRequestBody(subject)),
      },
    );
    return { ...subject, id: data };
  },

  remove(id) {
    return subjectRequest("/Subjects", {
      method: "DELETE",
      body: JSON.stringify({ ids: [id] }),
    });
  },
};

export function subjectError(error, fallback) {
  if (error.status === 400) return "Thông tin môn học chưa hợp lệ. Vui lòng kiểm tra lại.";
  if (error.status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  if (error.status === 403) return "Bạn không có quyền thực hiện thao tác này.";
  if (error.status === 404) return "Môn học không còn tồn tại.";
  if (error.status === 409) return "Mã môn học đã được sử dụng.";
  return fallback;
}
