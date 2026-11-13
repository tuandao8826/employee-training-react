import React, { useState } from "react";
import { X } from "lucide-react";
import { systemAccountError } from "../../services/systemAccountsApi";

export default function SystemAccountForm({ account, onClose, onSave }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    const fields = new FormData(event.currentTarget);
    const values = {
      name: fields.get("name").trim(),
      email: fields.get("email").trim() || null,
      password: fields.get("password") || null,
      status: Number(fields.get("status")),
    };
    if (!account) values.username = fields.get("username").trim();

    setError("");
    setSaving(true);
    try {
      await onSave(values);
    } catch (error) {
      setError(systemAccountError(error, "Không lưu được tài khoản. Vui lòng thử lại."));
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
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-grid">
              <label className="form-field">
                <span>Tên đăng nhập</span>
                <input name="username" autoComplete="username" defaultValue={account?.username} readOnly={Boolean(account)} required minLength={6} maxLength={50} disabled={saving} />
              </label>
              <label className="form-field">
                <span>Họ và tên</span>
                <input name="name" defaultValue={account?.name} required maxLength={50} disabled={saving} />
              </label>
              <label className="form-field">
                <span>Email</span>
                <input type="email" name="email" defaultValue={account?.email ?? ""} maxLength={100} disabled={saving} />
              </label>
              <label className="form-field">
                <span>{account ? "Mật khẩu mới" : "Mật khẩu"}</span>
                <input type="password" name="password" autoComplete="new-password" required={!account} minLength={6} maxLength={50} disabled={saving} />
                {account && <small>Để trống nếu giữ mật khẩu hiện tại.</small>}
              </label>
              <label className="form-field">
                <span>Trạng thái</span>
                <select name="status" defaultValue={account?.status ?? 1} disabled={saving}>
                  <option value={1}>Hoạt động</option>
                  <option value={2}>Bị khóa</option>
                </select>
              </label>
            </div>
            {error && <p className="error" role="alert">{error}</p>}
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
