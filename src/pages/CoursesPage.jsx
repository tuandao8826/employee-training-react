import React, { useEffect, useState } from "react";
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
import { courseApi, courseError } from "../services/courseApi";

const pageSize = 5;
const statusValues = {
  "Chưa bắt đầu": 1,
  "Đang diễn ra": 2,
  "Đã hoàn thành": 3,
};

export default function CoursesPage({
  courses = [],
  subjects = [],
  query = "",
  setQuery,
  filter = "Tất cả",
  setFilter,
  openCourse,
  removeCourse,
  setSelectedCourse,
  selectedCourse,
}) {
  const [page, setPage] = useState(1);
  const [pageResult, setPageResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setSearchError("");
    const timer = window.setTimeout(() => {
      courseApi
        .search(
          page,
          pageSize,
          String(query ?? ""),
          statusValues[filter] ?? "",
          controller.signal,
        )
        .then((result) => {
          if (controller.signal.aborted) return;
          const lastPage = result.pageInfo.totalPages;
          if (lastPage > 0 && page > lastPage) {
            setPage(lastPage);
            return;
          }
          setPageResult(result);
        })
        .catch((error) => {
          if (!controller.signal.aborted) {
            setSearchError(
              courseError(error, "Không tìm kiếm được khóa học. Vui lòng thử lại."),
            );
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [page, query, filter, courses]);

  const visibleCourses = pageResult?.pageItems ?? [];
  const totalFiltered = pageResult?.pageInfo.totalCount ?? 0;
  const pageCount = Math.max(1, pageResult?.pageInfo.totalPages ?? 1);
  const currentPage = pageResult?.pageInfo.page ?? page;

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
          value={courses.filter((c) => c?.status === "Đang diễn ra").length}
          note="Đang tổ chức"
          icon={Clock3}
          tone="orange"
        />
        <Stat
          label="Đã hoàn thành"
          value={courses.filter((c) => c?.status === "Đã hoàn thành").length}
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
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tên hoặc mã khóa học..."
            />
          </div>
          <div className="toolbar-right">
            <div className="select-wrap">
              <Filter size={15} />
              <select
                value={filter}
                onChange={(event) => {
                  setFilter(event.target.value);
                  setPage(1);
                }}
              >
                <option>Tất cả</option>
                <option>Đang diễn ra</option>
                <option>Chưa bắt đầu</option>
                <option>Đã hoàn thành</option>
              </select>
            </div>
            <span className="result-count">
              {totalFiltered} khóa học
            </span>
          </div>
        </div>
        <div className="course-list">
          {visibleCourses.map((c) => {
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
        {loading && !pageResult && (
          <Empty title="Đang tải khóa học…" />
        )}
        {searchError && <p className="error participant-empty" role="alert">{searchError}</p>}
        {!loading && !searchError && totalFiltered === 0 && courses.length === 0 && (
          <Empty
            title="Chưa có khóa học"
            text="Tạo khóa học để quản lý học viên và kết quả đào tạo."
          />
        )}
        {!loading && !searchError && totalFiltered === 0 && courses.length > 0 && (
          <Empty
            title="Không tìm thấy khóa học"
            text="Thử thay đổi nội dung tìm kiếm hoặc trạng thái lọc."
          />
        )}
        {totalFiltered > 0 && (
          <div className="course-pagination">
            <span>
              Trang {currentPage}/{pageCount} · {totalFiltered} khóa học · {pageSize} mỗi trang
            </span>
            <div>
              <button
                className="btn btn-secondary btn-small"
                disabled={currentPage <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Trước
              </button>
              <button
                className="btn btn-secondary btn-small"
                disabled={currentPage >= pageCount}
                onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              >
                Sau
              </button>
            </div>
          </div>
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
