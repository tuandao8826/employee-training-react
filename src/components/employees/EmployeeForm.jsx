import React, { useState } from "react";
import { X } from "lucide-react";
import { staffError } from "../../services/staffApi";

export default function EmployeeForm({ employee, viewing, onClose, onSave, notify }) {
  const [form, setForm] = useState(() => ({
    status: "Đang làm việc",
    ...employee,
  }));
  const [saving, setSaving] = useState(false);

  const change = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const field = (key, label, options = {}) => (
    <label className="form-field">
      <span>
        {label}
        {options.required && !viewing && <b className="required-marker" aria-hidden="true"> *</b>}
      </span>
      <input
        {...options}
        readOnly={viewing}
        value={form[key] ?? ""}
        onChange={(event) => change(key, event.target.value)}
      />
    </label>
  );

  const submit = async (event) => {
    event.preventDefault();
    if (saving || viewing) return;
    if (!form.code?.trim() || !form.name?.trim()) {
      notify("Vui lòng nhập mã nhân viên và họ tên.", "error");
      return;
    }
    if (form.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      notify("Email không đúng định dạng.", "error");
      return;
    }
    const phone = form.phone?.trim() ?? "";
    const phoneDigits = phone.replace(/\D/g, "").length;
    if (phone && (!/^\+?[0-9\s().-]+$/.test(phone) || phoneDigits < 7 || phoneDigits > 15)) {
      notify("Số điện thoại phải có từ 7 đến 15 chữ số và đúng định dạng.", "error");
      return;
    }

    setSaving(true);
    try {
      await onSave(form);
    } catch (error) {
      notify(staffError(error, "Không lưu được hồ sơ. Vui lòng thử lại."), "error");
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (!saving && event.currentTarget === event.target) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-form-heading"
      >
        <div className="modal-head">
          <h2 id="staff-form-heading">
            {viewing
              ? "Hồ sơ nhân viên"
              : employee
                ? "Chỉnh sửa nhân viên"
                : "Thêm nhân viên"}
          </h2>
          <button
            type="button"
            className="icon-button"
            aria-label="Đóng"
            disabled={saving}
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-grid">
              {field("code", "Mã nhân viên", {
                required: true,
                maxLength: 30,
                placeholder: "NV001",
              })}
              {field("name", "Họ và tên", { required: true, maxLength: 100 })}
              {field("email", "Email công việc", {
                type: "email",
                maxLength: 254,
              })}
              {field("phone", "Số điện thoại", { type: "tel", maxLength: 30 })}
              {field("department", "Phòng ban", { maxLength: 100 })}
              {field("role", "Chức vụ", { maxLength: 100 })}
              <label className="form-field">
                <span>Trạng thái</span>
                <select
                  value={form.status}
                  disabled={viewing}
                  onChange={(event) => change("status", event.target.value)}
                >
                  <option>Đang làm việc</option>
                  <option>Đã nghỉ việc</option>
                </select>
              </label>
              {field("joinedOn", "Ngày vào làm", { type: "date" })}
            </div>
          </div>
          <div className="modal-foot">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={saving}
              onClick={onClose}
            >
              {viewing ? "Đóng" : "Hủy"}
            </button>
            {!viewing && (
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Đang lưu…" : "Lưu thông tin"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
