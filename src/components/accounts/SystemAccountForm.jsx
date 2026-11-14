import React, { useState } from "react";
import { X } from "lucide-react";
import { systemAccountError } from "../../services/systemAccountsApi";

export default function SystemAccountForm({ account, onClose, onSave, notify }) {
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    const fields = new FormData(event.currentTarget);
    const username = fields.get("username").trim();
    const name = fields.get("name").trim();
    const email = fields.get("email").trim();
    const password = fields.get("password");
    if (!account && !/^[A-Za-z0-9._-]{6,50}$/.test(username)) {
      notify("Tên đăng nhập phải dài 6–50 ký tự, chỉ gồm chữ không dấu, số, dấu chấm, gạch dưới hoặc gạch ngang.", "error");
      return;
    }
    if (!name || name.length > 50) {
      notify("Họ và tên là bắt buộc và tối đa 50 ký tự.", "error");
      return;
    }
    if (!email || email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      notify("Email là bắt buộc và phải đúng định dạng (tối đa 100 ký tự).", "error");
      return;
    }
    if ((!account && !password) || (password && (
      password.length < 8 || password.length > 50 ||
      !/[A-Z]/.test(password) || !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) || !Array.from(password).some((character) => !/[\p{L}\p{N}]/u.test(character)) ||
      new TextEncoder().encode(password).length > 72
    ))) {
      notify("Mật khẩu cần dài 8–50 ký tự, có chữ hoa, chữ thường, chữ số, ký tự đặc biệt và tối đa 72 byte.", "error");
      return;
    }
    const values = {
      name,
      email,
      password: password || null,
      status: Number(fields.get("status")),
    };
    if (!account) values.username = username;

    setSaving(true);
    try {
      await onSave(values);
    } catch (error) {
      notify(systemAccountError(error, "Không lưu được tài khoản. Vui lòng thử lại."), "error");
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="system-account-heading">
        <div className="modal-head">
          <h2 id="system-account-heading">{account ? "Sửa tài khoản" : "Thêm tài khoản hệ thống"}</h2>
          <button type="button" className="icon-button" disabled={saving} onClick={onClose} aria-label="Đóng">
            <X size={19} />
          </button>
        </div>
        <form onSubmit={submit} noValidate>
          <div className="modal-body">
            <div className="form-grid">
              <label className="form-field">
                <span>Tên đăng nhập<b className="required-marker" aria-hidden="true"> *</b></span>
                <input name="username" autoComplete="username" defaultValue={account?.username} readOnly={Boolean(account)} required minLength={6} maxLength={50} disabled={saving} />
              </label>
              <label className="form-field">
                <span>Họ và tên<b className="required-marker" aria-hidden="true"> *</b></span>
                <input name="name" defaultValue={account?.name} required maxLength={50} disabled={saving} />
              </label>
              <label className="form-field">
                <span>Email<b className="required-marker" aria-hidden="true"> *</b></span>
                <input type="email" name="email" defaultValue={account?.email ?? ""} required maxLength={100} disabled={saving} />
              </label>
              <label className="form-field">
                <span>{account ? "Mật khẩu mới" : "Mật khẩu"}{!account && <b className="required-marker" aria-hidden="true"> *</b>}</span>
                <input type="password" name="password" autoComplete="new-password" required={!account} minLength={8} maxLength={50} disabled={saving} />
                {account && <small>Để trống nếu giữ mật khẩu hiện tại. Mật khẩu mới cần có chữ hoa, chữ thường, số và ký tự đặc biệt.</small>}
              </label>
              <label className="form-field">
                <span>Trạng thái<b className="required-marker" aria-hidden="true"> *</b></span>
                <select name="status" defaultValue={account?.status ?? 1} required disabled={saving}>
                  <option value={1}>Hoạt động</option>
                  <option value={2}>Khóa</option>
                </select>
              </label>
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-secondary" disabled={saving} onClick={onClose}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Đang lưu…" : "Lưu tài khoản"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
