import React from "react";
import {
  GraduationCap,
  Clock3,
  Search,
  Filter,
  Plus,
  BookOpen,
  CalendarDays,
  UserRound,
  ChevronRight,
  Pencil,
  Trash2,
} from "lucide-react";
import { Stat, Status, Empty } from "../components/common/UI";
import CourseDetail from "../components/modals/CourseDetail";

export default function CoursesPage({
  courses,
  subjects,
  query,
  setQuery,
  filter,
  setFilter,
  openCourse,
  removeCourse,
  setSelectedCourse,
  selectedCourse,
}) {
  return (
    <section>
      <div className="page-heading">
        <div>
          <div className="eyebrow">ĐÀO TẠO / KẾ HOẠCH</div>
          <h1>Quản lý khóa học</h1>
          <p>
            Quản lý lịch đào tạo, môn học và trạng thái khóa học.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => openCourse()}>
          <Plus size={17} /> Tạo khóa học
        </button>
      </div>
      <div className="stats-row compact">
        <Stat
          label="Tổng khóa học"
          value={courses.length}
          note="Tất cả khóa đào tạo"
          icon={GraduationCap}
          tone="blue"
        />
        <Stat
          label="Đang diễn ra"
          value={courses.filter((c) => c.status === "Đang diễn ra").length}
          note="Đang tổ chức"
          icon={Clock3}
          tone="orange"
        />
        <Stat
          label="Đã kết thúc"
          value={courses.filter((c) => c.status === "Đã kết thúc").length}
          note="Khóa học hoàn tất"
          icon={BookOpen}
          tone="purple"
        />
      </div>
      <div className="panel">
        <div className="panel-toolbar">
          <div className="search-box">
            <Search size={17} />
            <input
              value={query}
              onChange={setQuery}
              placeholder="Tìm theo tên hoặc mã khóa học..."
            />
          </div>
          <div className="toolbar-right">
            <div className="select-wrap">
              <Filter size={15} />
              <select value={filter} onChange={setFilter}>
                <option>Tất cả</option>
                <option>Đang diễn ra</option>
                <option>Sắp diễn ra</option>
                <option>Đã kết thúc</option>
              </select>
            </div>
            <span className="result-count">
              {
                courses.filter(
                  (c) =>
                    (c.name + c.code)
                      .toLowerCase()
                      .includes(query.toLowerCase()) &&
                    (filter === "Tất cả" || c.status === filter),
                ).length
              }{" "}
              khóa học
            </span>
          </div>
        </div>
        <div className="course-list">
          {courses
            .filter(
              (c) =>
                (c.name + c.code).toLowerCase().includes(query.toLowerCase()) &&
                (filter === "Tất cả" || c.status === filter),
            )
            .map((c) => {
              const subject = subjects.find((s) => s.id === c.subjectId);
              return (
                <article className="course-row" key={c.id}>
                  <div className="course-emblem">
                    <GraduationCap size={23} />
                  </div>
                  <div className="course-main">
                    <div className="course-title-line">
                      <h3>{c.name}</h3>
                      <Status value={c.status} />
                    </div>
                    <div className="course-meta">
                      <span>
                        <BookOpen size={14} />
                        {subject?.name || "Chưa gán môn học"}
                      </span>
                      <span>
                        <CalendarDays size={14} />
                        {c.start} – {c.end}
                      </span>
                      <span>
                        <UserRound size={14} />
                        {c.code}
                      </span>
                    </div>
                  </div>
                  <div className="course-side">
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => setSelectedCourse(c.id)}
                    >
                      Chi tiết <ChevronRight size={15} />
                    </button>
                    <div className="row-actions">
                      <button title="Sửa" onClick={() => openCourse(c)}>
                        <Pencil size={15} />
                      </button>
                      <button title="Xóa" onClick={() => removeCourse(c.id)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
        </div>
        {courses.length === 0 && (
          <Empty
            title="Chưa có khóa học"
            text="Tạo khóa học để quản lý học viên và kết quả đào tạo."
          />
        )}
      </div>
      {selectedCourse && (
        <CourseDetail
          course={courses.find((c) => c.id === selectedCourse)}
          subjects={subjects}
          onClose={() => setSelectedCourse(null)}
        />
      )}
    </section>
  );
}
