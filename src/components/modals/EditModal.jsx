import React, { useState } from "react";
import { X } from "lucide-react";
import { avatarTone, initials } from "../../utils/helpers";

function EditModal({ modal, employees, subjects, courses, onClose, onSave }) {
  const { type, data } = modal;
  const editing = !!data;
  const [form, setForm] = useState(() =>
    type === "employee"
      ? data || {
          id: Date.now(),
          code: `NV${String(employees.reduce((m, e) => Math.max(m, Number(e.code.replace("NV", "")) || 0), 0) + 1).padStart(3, "0")}`,
          name: "",
          email: "",
          phone: "",
          department: "Vận hành",
          role: "Nhân viên",
          status: "Đang làm việc",
          joined: new Date().toLocaleDateString("vi-VN"),
        }
      : type === "subject"
        ? data || {
            id: Date.now(),
            code: `MH${String(subjects.length + 1).padStart(3, "0")}`,
            name: "",
            category: "Bắt buộc",
            duration: 4,
            description: "",
          }
        : data || {
            id: Date.now(),
            code: `KH2026-${String(courses.length + 1).padStart(2, "0")}`,
            name: "",
            subjectId: subjects[0]?.id || "",
            start: "20/10/2026",
            end: "20/10/2026",
            instructor: "",
            status: "Sắp diễn ra",
            participantIds: [],
            progress: {},
          },
  );
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const heading =
    type === "employee"
      ? editing
        ? "Chỉnh sửa nhân viên"
        : "Thêm nhân viên"
      : type === "subject"
        ? editing
          ? "Chỉnh sửa môn học"
          : "Thêm môn học"
        : editing
          ? "Chỉnh sửa khóa học"
          : "Tạo khóa học";
  const submit = (e) => {
    e.preventDefault();
    const required =
      type === "employee"
        ? ["name", "email", "department"]
        : type === "subject"
          ? ["name", "code"]
          : ["name", "subjectId", "instructor"];
    const err = {};
    required.forEach((k) => {
      if (!String(form[k] ?? "").trim()) err[k] = "Trường này là bắt buộc";
    });
    if (
      type === "employee" &&
      form.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
    )
      err.email = "Email chưa đúng định dạng";
    setErrors(err);
    if (Object.keys(err).length) return;
    let out = { ...form };
    if (type === "course") {
      out.subjectId = Number(out.subjectId);
      out.participantIds = out.participantIds.map(Number);
      const p = { ...out.progress };
      out.participantIds.forEach((id) => {
        if (!p[id]) p[id] = "Chưa bắt đầu";
      });
      Object.keys(p).forEach((id) => {
        if (!out.participantIds.includes(Number(id))) delete p[id];
      });
      out.progress = p;
    }
    onSave(type, out);
  };
  const field = (key, label, placeholder = "", opts = null, kind = "text") => (
    <label className="form-field">
      <span>{label}</span>
      {opts ? (
        <select
          value={form[key] ?? ""}
          onChange={(e) => set(key, e.target.value)}
        >
          {opts.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={kind}
          value={form[key] ?? ""}
          placeholder={placeholder}
          onChange={(e) => set(key, e.target.value)}
        />
      )}
      {errors[key] && <small className="error">{errors[key]}</small>}
    </label>
  );
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-head">
          <div>
            <h2>{heading}</h2>
            <p>
              Nhập thông tin bên dưới để {editing ? "cập nhật" : "tạo mới"} dữ
              liệu.
            </p>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={19} />
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {type === "employee" && (
              <>
                <div className="form-grid">
                  {field("code", "Mã nhân viên")}
                  {field("name", "Họ và tên", "Nhập họ tên")}
                  {field("email", "Email công việc", "name@company.vn")}
                  {field("phone", "Số điện thoại", "Nhập số điện thoại")}
                  {field(
                    "department",
                    "Phòng ban",
                    "",
                    [
                      "Vận hành",
                      "Kỹ thuật",
                      "Nhân sự",
                      "An toàn",
                      "Tài chính",
                      "CNTT",
                    ].map((x) => ({ value: x, label: x })),
                  )}
                  {field(
                    "role",
                    "Chức vụ",
                    "",
                    [
                      "Nhân viên",
                      "Chuyên viên",
                      "Tổ trưởng",
                      "Trưởng bộ phận",
                      "Quản lý",
                    ].map((x) => ({ value: x, label: x })),
                  )}
                  {field("status", "Trạng thái", "", [
                    { value: "Đang làm việc", label: "Đang làm việc" },
                    { value: "Tạm nghỉ", label: "Tạm nghỉ" },
                  ])}
                  {field("joined", "Ngày vào làm", "", null, "text")}
                </div>
              </>
            )}
            {type === "subject" && (
              <>
                <div className="form-grid">
                  {field("code", "Mã môn học")}
                  {field("name", "Tên môn học", "Nhập tên môn học")}
                  {field("category", "Nhóm môn học", "", [
                    { value: "Bắt buộc", label: "Bắt buộc" },
                    { value: "Chuyên môn", label: "Chuyên môn" },
                    { value: "Kỹ năng mềm", label: "Kỹ năng mềm" },
                  ])}
                  {field("duration", "Thời lượng (giờ)", "", "", "number")}
                </div>
                <label className="form-field">
                  <span>Mô tả</span>
                  <textarea
                    rows="3"
                    value={form.description || ""}
                    placeholder="Mục tiêu, nội dung môn học..."
                    onChange={(e) => set("description", e.target.value)}
                  />
                </label>
              </>
            )}
            {type === "course" && (
              <>
                <div className="form-grid">
                  {field("code", "Mã khóa học")}
                  {field("name", "Tên khóa học", "Nhập tên khóa học")}
                  {field(
                    "subjectId",
                    "Môn học",
                    "",
                    subjects.map((s) => ({ value: s.id, label: s.name })),
                  )}
                  {field(
                    "instructor",
                    "Giảng viên phụ trách",
                    "Nhập tên giảng viên",
                  )}
                  {field("start", "Ngày bắt đầu", "DD/MM/YYYY")}
                  {field("end", "Ngày kết thúc", "DD/MM/YYYY")}
                  {field("status", "Trạng thái", "", [
                    { value: "Sắp diễn ra", label: "Sắp diễn ra" },
                    { value: "Đang diễn ra", label: "Đang diễn ra" },
                    { value: "Đã kết thúc", label: "Đã kết thúc" },
                  ])}
                </div>
                <div className="form-field">
                  <span>Danh sách nhân viên tham dự</span>
                  <div className="employee-picker">
                    {employees.map((emp) => (
                      <label key={emp.id} className="picker-item">
                        <input
                          type="checkbox"
                          checked={form.participantIds
                            .map(Number)
                            .includes(emp.id)}
                          onChange={(e) => {
                            const ids = e.target.checked
                              ? [...form.participantIds.map(Number), emp.id]
                              : form.participantIds
                                  .map(Number)
                                  .filter((id) => id !== emp.id);
                            set("participantIds", ids);
                            if (e.target.checked && !form.progress[emp.id])
                              set("progress", {
                                ...form.progress,
                                [emp.id]: "Chưa bắt đầu",
                              });
                          }}
                        />
                        <div className={`avatar mini ${avatarTone(emp.id)}`}>
                          {initials(emp.name)}
                        </div>
                        <span>
                          <b>{emp.name}</b>
                          <small>
                            {emp.code} · {emp.department}
                          </small>
                        </span>
                      </label>
                    ))}
                  </div>
                  <small className="field-hint">
                    Đã chọn {form.participantIds.length} nhân viên.
                  </small>
                </div>
              </>
            )}
          </div>
          <div className="modal-foot">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Hủy
            </button>
            <button type="submit" className="btn btn-primary">
              {editing ? "Lưu thay đổi" : "Lưu thông tin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditModal;
