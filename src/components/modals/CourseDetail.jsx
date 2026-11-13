import React from "react";
import { X } from "lucide-react";
import { Status } from "../common/UI";

export default function CourseDetail({ course, subjects, onClose }) {
  if (!course) return null;
  const subject = subjects.find((item) => item.id === course.subjectId);

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
