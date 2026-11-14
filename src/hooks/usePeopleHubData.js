import { useEffect, useState } from "react";
import { initialSubjects } from "../data/initialData";
import { persist, readStore } from "../utils/helpers";
import { subjectApi, subjectError } from "../services/subjectApi";
import { courseApi, courseError } from "../services/courseApi";

function upsert(records, record) {
  return records.some((item) => item.id === record.id)
    ? records.map((item) => (item.id === record.id ? record : item))
    : [record, ...records];
}

export default function usePeopleHubData(notify, confirmDelete) {
  const [subjects, setSubjects] = useState(() => {
    const cachedSubjects = readStore("ph-subjects", initialSubjects);
    return Array.isArray(cachedSubjects)
      ? cachedSubjects.filter((subject) => subject && typeof subject === "object")
      : initialSubjects;
  });
  const [courses, setCourses] = useState([]);
  const [subjectsRevision, setSubjectsRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    subjectApi
      .list(controller.signal)
      .then((records) => {
        if (controller.signal.aborted) return;
        setSubjects(records);
        persist("ph-subjects", records);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          notify(subjectError(error, "Không tải được danh sách môn học."), "error");
        }
      });
    return () => controller.abort();
  }, [subjectsRevision]);

  useEffect(() => {
    const controller = new AbortController();
    courseApi
      .list(controller.signal)
      .then((records) => {
        setCourses(records);
        persist("ph-courses", records);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          notify(courseError(error, "Không tải được danh sách khóa học."), "error");
        }
      });
    return () => controller.abort();
  }, []);

  const saveSubjects = (records) => {
    setSubjects(records);
    persist("ph-subjects", records);
  };
  const saveCourses = (records) => {
    setCourses(records);
    persist("ph-courses", records);
  };

  const saveRecord = async (type, record) => {
    if (type === "subject") {
      const saved = await subjectApi.save(record);
      saveSubjects(upsert(subjects, saved));
    }
    if (type === "course") {
      const saved = await courseApi.save(record);
      saveCourses(upsert(courses, saved));
    }
  };

  const removeSubject = (id) => {
    if (courses.some((c) => c.subjectId === id)) {
      notify("Môn học đang được sử dụng trong khóa học", "error");
      return;
    }
    subjectApi
      .remove(id)
      .then(() => {
        saveSubjects(subjects.filter((s) => s.id !== id));
        notify("Đã xóa môn học");
      })
      .catch((error) =>
        notify(subjectError(error, "Không xóa được môn học. Vui lòng thử lại."), "error"),
      );
  };
  const removeCourse = async (id) => {
    const confirmed = await confirmDelete({
      title: "Xóa khóa học",
      message: "Bạn có chắc muốn xóa khóa học này? Thao tác này không thể hoàn tác.",
    });
    if (!confirmed) return;
    courseApi
      .remove(id)
      .then(() => {
        saveCourses(courses.filter((c) => c.id !== id));
        notify("Đã xóa khóa học");
      })
      .catch((error) =>
        notify(courseError(error, "Không xóa được khóa học. Vui lòng thử lại."), "error"),
      );
  };

  return {
    subjects,
    refreshSubjects: () => setSubjectsRevision((value) => value + 1),
    courses,
    saveRecord,
    removeSubject,
    removeCourse,
  };
}
