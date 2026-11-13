import { apiRequest } from "./apiClient";

const statusLabels = {
  1: "Chưa bắt đầu",
  2: "Đang diễn ra",
  3: "Đã hoàn thành",
  4: "Đã hủy",
};

const courseRequest = (endpoint, options = {}) =>
  apiRequest(endpoint, {
    ...options,
    baseUrl: "/api",
    requiresSession: true,
    csrf: Boolean(options.method && options.method !== "GET"),
  });

function dateInput(value) {
  return value ? value.slice(0, 10) : "";
}

function fromApi(course) {
  return {
    id: course.id,
    code: course.courseCode,
    name: course.name,
    description: course.description ?? "",
    subjectId: course.subject?.id ?? "",
    subjectName: course.subject?.name ?? "",
    start: dateInput(course.startDate),
    end: dateInput(course.endDate),
    instructor: "",
    status: statusLabels[course.status] ?? "Đang diễn ra",
  };
}

function toFormData(course, creating) {
  const form = new FormData();
  form.set("CourseCode", course.code.trim());
  form.set("Name", course.name.trim());
  form.set("Description", course.description?.trim() ?? "");
  form.set("StartDate", `${course.start}T00:00:00Z`);
  form.set("EndDate", `${course.end}T00:00:00Z`);
  form.set("SubjectId", course.subjectId);
  (course.participantIds ?? []).forEach((id) =>
    form.append("StaffMemberIds", id),
  );
  if (!creating) {
    form.set("ReplaceStaffMemberList", "true");
  }
  return form;
}

export const courseApi = {
  async search(page = 1, pageSize = 5, keyword = "", status = "", signal) {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (keyword.trim()) params.set("Search.Keyword", keyword.trim());
    if (status) params.set("Status", String(status));
    const { data } = await courseRequest(`/Courses?${params}`, { signal });
    return {
      ...data,
      pageItems: data.pageItems.map(fromApi),
    };
  },

  async list(signal) {
    const courses = [];
    let page = 1;
    let hasNext;
    do {
      const { data } = await courseRequest(
        `/Courses?page=${page}&pageSize=100`,
        { signal },
      );
      courses.push(...data.pageItems.map(fromApi));
      hasNext = data.pageInfo.hasNext;
      page += 1;
    } while (hasNext);
    return courses;
  },

  async detail(id) {
    const { data } = await courseRequest(`/Courses/${id}`);
    return fromApi(data);
  },

  async save(course) {
    const creating = !course.id;
    const { data } = await courseRequest(
      creating ? "/Courses" : `/Courses/${course.id}`,
      {
        method: creating ? "POST" : "PUT",
        body: toFormData(course, creating),
      },
    );
    return courseApi.detail(data);
  },

  remove(id) {
    return courseRequest("/Courses", {
      method: "DELETE",
      body: JSON.stringify({ ids: [id] }),
    });
  },
};

export function courseError(error, fallback) {
  if (error.status === 400) return "Thông tin khóa học chưa hợp lệ. Vui lòng kiểm tra lại.";
  if (error.status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  if (error.status === 403) return "Bạn không có quyền thực hiện thao tác này.";
  if (error.status === 404) return "Khóa học hoặc môn học không còn tồn tại.";
  if (error.status === 409) return "Mã khóa học đã được sử dụng.";
  return fallback;
}
