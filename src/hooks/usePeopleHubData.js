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

export default function usePeopleHubData(notify) {
  const [subjects, setSubjects] = useState(() =>
    readStore("ph-subjects", initialSubjects),
  );
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    subjectApi
      .list(controller.signal)
      .then((records) => {
        setSubjects(records);
        persist("ph-subjects", records);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          notify(subjectError(error, "Không tải được danh sách môn học."));
        }
      });
    return () => controller.abort();
  }, []);

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
          notify(courseError(error, "Không tải được danh sách khóa học."));
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
      notify("Môn học đang được sử dụng trong khóa học");
      return;
    }
    if (!confirm("Xóa môn học này?")) return;
    subjectApi
      .remove(id)
      .then(() => {
        saveSubjects(subjects.filter((s) => s.id !== id));
        notify("Đã xóa môn học");
      })
      .catch((error) =>
        notify(subjectError(error, "Không xóa được môn học. Vui lòng thử lại.")),
      );
  };
  const removeCourse = (id) => {
    if (!confirm("Xóa khóa học này?")) return;
    courseApi
      .remove(id)
      .then(() => {
        saveCourses(courses.filter((c) => c.id !== id));
        notify("Đã xóa khóa học");
      })
      .catch((error) =>
        notify(courseError(error, "Không xóa được khóa học. Vui lòng thử lại.")),
      );
  };

  return {
    subjects,
    courses,
    saveRecord,
    removeSubject,
    removeCourse,
  };
}
