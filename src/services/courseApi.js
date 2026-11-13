import { apiRequest } from "./apiClient";

const statusLabels = {
  1: "Sắp diễn ra",
  2: "Đang diễn ra",
  3: "Đã kết thúc",
  4: "Đã hủy",
};
const statusValues = {
  "Sắp diễn ra": 1,
  "Đang diễn ra": 2,
  "Đã kết thúc": 3,
  "Đã hủy": 4,
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
  const participantIds = (course.staffMembers ?? course.courseParticipants ?? [])
    .map((item) => item.staffMemberId ?? item.id)
    .filter(Boolean);
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
    participantIds,
    progress: Object.fromEntries(participantIds.map((id) => [id, "Chưa bắt đầu"])),
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
  if (creating) {
    course.participantIds.forEach((id) => form.append("StaffMemberIds", id));
  } else {
    form.set("Status", String(statusValues[course.status] ?? 1));
  }
  return form;
}

export const courseApi = {
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
