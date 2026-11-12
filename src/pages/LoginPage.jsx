import React, { useState } from "react";
import { ArrowRight, ChartNoAxesCombined, Eye, EyeOff } from "lucide-react";
import "./LoginPage.css";

function loginError(error) {
  if (error.message === "Message.User.Blocked") return "Tài khoản đã bị khóa.";
  if (error.status === 400 || error.status === 401) {
    return "Tên đăng nhập hoặc mật khẩu không đúng.";
  }
  return "Không thể đăng nhập lúc này. Vui lòng thử lại.";
}

export default function LoginPage({
  restoring,
  sessionError,
  onLogin,
  onRetry,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    const form = new FormData(event.currentTarget);
    const username = form.get("username").trim();
    if (!username) {
      setError("Vui lòng nhập tên đăng nhập.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await onLogin(username, form.get("password"));
    } catch (error) {
      setError(loginError(error));
      setSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-heading">
        <div className="login-brand">
          <div className="brand-mark">
            <ChartNoAxesCombined size={23} aria-hidden="true" />
          </div>
          <strong>PeopleHub</strong>
        </div>
        <h1 id="login-heading">Đăng nhập</h1>

        {restoring ? (
          <div className="login-restore">
            {sessionError ? (
              <>
                <p className="login-error" role="alert">
                  {sessionError}
                </p>
                <div className="login-restore-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={onRetry}
                  >
                    Thử lại
                  </button>
                </div>
              </>
            ) : (
              <p role="status">Đang kiểm tra phiên đăng nhập…</p>
            )}
          </div>
        ) : (
          <form className="login-form" onSubmit={submit} aria-busy={submitting}>
            <label className="form-field" htmlFor="login-username">
              <span>Tên đăng nhập</span>
              <input
                id="login-username"
                name="username"
                autoComplete="username"
                required
                disabled={submitting}
              />
            </label>
            <div className="form-field">
              <label htmlFor="login-password">Mật khẩu</label>
              <div className="login-password">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? (
                    <EyeOff size={19} aria-hidden="true" />
                  ) : (
                    <Eye size={19} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
            {(error || (!submitting && sessionError)) && (
              <p className="login-error" role="alert">
                {error || sessionError}
              </p>
            )}
            <button
              type="submit"
              className="btn btn-primary login-submit"
              disabled={submitting}
            >
              {submitting ? "Đang đăng nhập…" : "Đăng nhập"}
              {!submitting && <ArrowRight size={17} aria-hidden="true" />}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
