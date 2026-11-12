import { useState } from "react";
import {
  initialEmployees,
  initialSubjects,
  initialCourses,
} from "../data/initialData";
import { persist, readStore } from "../utils/helpers";

function upsert(records, record) {
  return records.some((item) => item.id === record.id)
    ? records.map((item) => (item.id === record.id ? record : item))
    : [record, ...records];
}

export default function usePeopleHubData(notify) {
  const [employees, setEmployees] = useState(() =>
    readStore("ph-employees", initialEmployees),
  );
  const [subjects, setSubjects] = useState(() =>
    readStore("ph-subjects", initialSubjects),
  );
  const [courses, setCourses] = useState(() =>
    readStore("ph-courses", initialCourses),
  );

  const saveEmployees = (records) => {
    setEmployees(records);
    persist("ph-employees", records);
  };
  const saveSubjects = (records) => {
    setSubjects(records);
    persist("ph-subjects", records);
  };
  const saveCourses = (records) => {
    setCourses(records);
    persist("ph-courses", records);
  };

  const saveRecord = (type, record) => {
    if (type === "employee") saveEmployees(upsert(employees, record));
    if (type === "subject") saveSubjects(upsert(subjects, record));
    if (type === "course") saveCourses(upsert(courses, record));
  };

  const removeEmployee = (id) => {
    if (!confirm("Bạn có chắc muốn xóa nhân viên này?")) return;
    saveEmployees(employees.filter((e) => e.id !== id));
    saveCourses(
      courses.map((c) => ({
        ...c,
        participantIds: c.participantIds.filter((x) => x !== id),
        progress: Object.fromEntries(
          Object.entries(c.progress).filter(([k]) => Number(k) !== id),
        ),
      })),
    );
    notify("Đã xóa nhân viên");
  };
  const removeSubject = (id) => {
    if (courses.some((c) => c.subjectId === id)) {
      notify("Môn học đang được sử dụng trong khóa học");
      return;
    }
    if (!confirm("Xóa môn học này?")) return;
    saveSubjects(subjects.filter((s) => s.id !== id));
    notify("Đã xóa môn học");
  };
  const removeCourse = (id) => {
    if (!confirm("Xóa khóa học này?")) return;
    saveCourses(courses.filter((c) => c.id !== id));
    notify("Đã xóa khóa học");
  };

  const updateCourseProgress = (courseId, employeeId, status) => {
    saveCourses(
      courses.map((course) =>
        course.id === courseId
          ? {
              ...course,
              progress: { ...course.progress, [employeeId]: status },
            }
          : course,
      ),
    );
    notify("Đã cập nhật trạng thái học viên");
  };

  return {
    employees,
    subjects,
    courses,
    saveRecord,
    removeEmployee,
    removeSubject,
    removeCourse,
    updateCourseProgress,
  };
}
