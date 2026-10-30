import React from "react";
import {
  GraduationCap,
  Clock3,
  Users,
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
import { Stat, Status, Empty } from "../../components/common/UI";
import { avatarTone, initials } from "../../utils/helpers";
import CourseDetail from "../../components/modals/CourseDetail";

export default function CoursesPage({
  courses,
  employees,
  subjects,
  query,
  setQuery,
  filter,
  setFilter,
  openCourse,
  removeCourse,
  setSelectedCourse,
  selectedCourse,
  saveCourses,
  notify,
}) {
  const allParticipants = courses.reduce(
    (count, course) => count + course.participantIds.length,
    0,
  );
  return (
    <section>
      <div className="page-heading">
        <div>
          <div className="eyebrow">ĐÀO TẠO / KẾ HOẠCH</div>
          <h1>Quản lý khóa học</h1>
          <p>
            Theo dõi lịch đào tạo, danh sách học viên và tiến độ hoàn thành.
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
          label="Lượt tham dự"
          value={allParticipants}
          note="Tổng lượt đăng ký"
          icon={Users}
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
              const done = Object.values(c.progress).filter(
                (s) => s === "Hoàn thành",
              ).length;
              const total = c.participantIds.length;
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
                        {c.instructor}
                      </span>
                    </div>
                    <div className="course-progress">
                      <div className="progress-track">
                        <span
                          style={{
                            width: `${total ? (done / total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <small>
                        {done}/{total} học viên hoàn thành
                      </small>
                    </div>
                  </div>
                  <div className="course-side">
                    <div className="participant-stack">
                      {c.participantIds.slice(0, 4).map((id) => {
                        const e = employees.find((x) => x.id === id);
                        return e ? (
                          <div
                            key={id}
                            className={`avatar mini ${avatarTone(id)}`}
                            title={e.name}
                          >
                            {initials(e.name)}
                          </div>
                        ) : null;
                      })}
                      {total > 4 && (
                        <div className="avatar mini more">+{total - 4}</div>
                      )}
                    </div>
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
          employees={employees}
          subjects={subjects}
          onClose={() => setSelectedCourse(null)}
          onProgress={(courseId, employeeId, value) => {
            saveCourses(
              courses.map((c) =>
                c.id === courseId
                  ? { ...c, progress: { ...c.progress, [employeeId]: value } }
                  : c,
              ),
            );
            notify("Đã cập nhật trạng thái học viên");
          }}
        />
      )}
    </section>
  );
}
