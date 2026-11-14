import React, { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { avatarTone, initials } from "../../utils/helpers";
import { staffApi, staffError } from "../../services/staffApi";
import PageSizeInput from "../common/PageSizeInput";

function EditModal({
  modal,
  employees = [],
  subjects = [],
  courses = [],
  onClose,
  onSave,
}) {
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
            code: `MH${String(subjects.length + 1).padStart(3, "0")}`,
            name: "",
            category: "Bắt buộc",
            duration: 4,
            cycleUnit: "Ngày",
            description: "",
          }
        : data || {
            code: `KH2026-${String(courses.length + 1).padStart(2, "0")}`,
            name: "",
            subjectId: subjects[0]?.id || "",
            description: "",
            start: new Date().toISOString().slice(0, 10),
            end: new Date().toISOString().slice(0, 10),
            participantIds: [],
            progress: {},
          },
  );
  const [errors, setErrors] = useState({});
  const [employeeQuery, setEmployeeQuery] = useState("");
  const [employeePage, setEmployeePage] = useState(1);
  const [employeePageSize, setEmployeePageSize] = useState(8);
  const [employeeResults, setEmployeeResults] = useState([]);
  const [employeePageInfo, setEmployeePageInfo] = useState(null);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [employeeError, setEmployeeError] = useState("");
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const employeePageCount = employeePageInfo?.totalPages ?? 1;

  useEffect(() => {
    if (type !== "course") return undefined;
    const controller = new AbortController();
    setEmployeeLoading(true);
    setEmployeeError("");
    const timer = window.setTimeout(() => {
      staffApi
        .search(employeePage, employeePageSize, employeeQuery, controller.signal)
        .then((result) => {
          if (controller.signal.aborted) return;
          setEmployeeResults(result.pageItems);
          setEmployeePageInfo(result.pageInfo);
        })
        .catch((error) => {
          if (controller.signal.aborted) return;
          setEmployeeError(
            staffError(error, "Không tải được danh sách nhân viên."),
          );
          setEmployeeResults([]);
          setEmployeePageInfo(null);
        })
        .finally(() => {
          if (!controller.signal.aborted) setEmployeeLoading(false);
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [type, employeePage, employeePageSize, employeeQuery]);
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
          : ["code", "name", "subjectId", "start", "end"];
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
    if (type === "course") out.participantIds = out.participantIds.map(String);
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
                  {field("category", "Trạng thái", "", [
                    { value: "Đang hoạt động", label: "Đang hoạt động" },
                    { value: "Đã khóa", label: "Đã khóa" },
                  ])}
                  {field("duration", "Chu kỳ đào tạo", "", "", "number")}
                  {field("cycleUnit", "Đơn vị chu kỳ", "", [
                    { value: "Ngày", label: "Ngày" },
                    { value: "Tháng", label: "Tháng" },
                    { value: "Năm", label: "Năm" },
                  ])}
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
                  {field("start", "Ngày bắt đầu", "", null, "date")}
                  {field("end", "Ngày kết thúc", "", null, "date")}
                </div>
                <div className="form-field">
                  <span>Danh sách nhân viên tham dự</span>
                  <div className="employee-picker-toolbar">
                    <div className="search-box employee-picker-search">
                      <Search size={15} />
                      <input
                        value={employeeQuery}
                        onChange={(event) => {
                          setEmployeeQuery(event.target.value);
                          setEmployeePage(1);
                        }}
                        placeholder="Tìm theo mã hoặc tên nhân viên..."
                        aria-label="Tìm nhân viên theo mã hoặc tên"
                      />
                    </div>
                    <span>{employeePageInfo?.totalCount ?? 0} nhân viên</span>
                  </div>
                  <div className="employee-picker">
                    {employeeResults.map((emp) => (
                      <label key={emp.id} className="picker-item">
                        <input
                          type="checkbox"
                          checked={form.participantIds
                            .map(String)
                            .includes(String(emp.id))}
                          onChange={(e) => {
                            const ids = e.target.checked
                              ? [...form.participantIds.map(String), String(emp.id)]
                              : form.participantIds
                                  .map(String)
                                  .filter((id) => id !== String(emp.id));
                            set("participantIds", ids);
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
                    {employeeLoading && (
                      <p className="participant-empty">Đang tải nhân viên…</p>
                    )}
                    {!employeeLoading && employeeError && (
                      <p className="error participant-empty" role="alert">{employeeError}</p>
                    )}
                    {!employeeLoading && !employeeError && employeeResults.length === 0 && (
                      <p className="participant-empty">Không tìm thấy nhân viên phù hợp.</p>
                    )}
                  </div>
                  <div className="employee-picker-pagination">
                    <PageSizeInput value={employeePageSize} onChange={(value) => { setEmployeePageSize(value); setEmployeePage(1); }} disabled={employeeLoading} />
                    {(employeePageInfo?.totalCount ?? 0) > employeePageSize && <>
                      <span>
                        Trang {employeePage}/{employeePageCount} · {employeePageInfo?.totalCount ?? 0} nhân viên
                      </span>
                      <div>
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          disabled={employeePage <= 1}
                          onClick={() => setEmployeePage((current) => current - 1)}
                        >
                          Trước
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          disabled={employeePage >= employeePageCount}
                          onClick={() => setEmployeePage((current) => current + 1)}
                        >
                          Sau
                        </button>
                      </div>
                    </>}
                  </div>
                  <small className="field-hint">
                    {editing
                      ? "Danh sách tham gia sẽ được cập nhật theo lựa chọn này."
                      : "Có thể thêm nhân viên ngay khi tạo khóa học."}
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
