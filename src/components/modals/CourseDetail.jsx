import React, { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Status } from "../common/UI";
import PageSizeInput from "../common/PageSizeInput";
import { courseParticipantsApi } from "../../services/courseParticipantsApi";

export default function CourseDetail({ course, subjects, onClose }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [roster, setRoster] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [employeeQuery, setEmployeeQuery] = useState("");

  useEffect(() => {
    if (!course) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    courseParticipantsApi
      .list(course.id, page, pageSize, controller.signal, employeeQuery.trim())
      .then((result) => {
        if (!controller.signal.aborted) setRoster(result);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError("Không tải được danh sách nhân viên tham gia.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [course?.id, page, pageSize, employeeQuery]);

  if (!course) return null;
  const subject = subjects.find((item) => item.id === course.subjectId);
  const participants = roster?.pageItems ?? [];
  const pageInfo = roster?.pageInfo;
  const totalCount = pageInfo?.totalCount ?? 0;
  const pageCount = pageInfo?.totalPages ?? 1;

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="modal modal-wide">
        <div className="modal-head">
          <div>
            <div className="eyebrow">CHI TIẾT KHÓA HỌC</div>
            <h2>{course.name}</h2>
            <p>{course.code}</p>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={19} />
          </button>
        </div>
        <div className="modal-body detail-body">
          <div className="detail-summary">
            <div>
              <small>Môn học</small>
              <b>{subject?.name || course.subjectName || "Chưa gán môn học"}</b>
            </div>
            <div>
              <small>Ngày bắt đầu</small>
              <b>{course.start}</b>
            </div>
            <div>
              <small>Ngày kết thúc</small>
              <b>{course.end}</b>
            </div>
          </div>
          <div className="form-field">
            <span>Trạng thái</span>
            <Status value={course.status} />
          </div>
          {course.description && (
            <div className="form-field">
              <span>Mô tả</span>
              <p>{course.description}</p>
            </div>
          )}
          <div className="participant-list-section">
            <div className="panel-heading">
              <div>
                <h2>Nhân viên tham gia</h2>
                <p>{totalCount} nhân viên trong khóa học</p>
              </div>
            </div>
            <div className="search-box participant-search">
              <Search size={15} />
              <input
                value={employeeQuery}
                onChange={(event) => {
                  setEmployeeQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Tìm theo mã hoặc tên nhân viên..."
                aria-label="Tìm nhân viên theo mã hoặc tên"
              />
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>MÃ NHÂN VIÊN</th>
                    <th>TÊN NHÂN VIÊN</th>
                    <th>TRẠNG THÁI</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((participant) => (
                    <tr key={participant.id ?? participant.staffMemberId}>
                      <td>{participant.staffCode}</td>
                      <td>{participant.staffName}</td>
                      <td>
                        <Status
                          value={participant.isCompleted ? "Hoàn thành" : "Chưa hoàn thành"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loading && <p className="participant-empty">Đang tải danh sách nhân viên…</p>}
              {error && <p className="error participant-empty" role="alert">{error}</p>}
              {!loading && !error && totalCount === 0 && (
                <p className="participant-empty">Khóa học chưa có nhân viên tham gia.</p>
              )}
            </div>
            <div className="participant-pagination">
              <PageSizeInput value={pageSize} onChange={(value) => { setPageSize(value); setPage(1); }} disabled={loading} />
              {totalCount > pageSize && <>
                <span>
                  Trang {page}/{pageCount} · {totalCount} kết quả
                </span>
                <div>
                  <button
                    className="btn btn-secondary btn-small"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => current - 1)}
                  >
                    Trước
                  </button>
                  <button
                    className="btn btn-secondary btn-small"
                    disabled={page >= pageCount}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Sau
                  </button>
                </div>
              </>}
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
