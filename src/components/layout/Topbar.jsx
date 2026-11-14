import React, { useState } from "react";
import { CalendarDays, ChevronRight, LogOut, Menu } from "lucide-react";
import { initials } from "../../utils/helpers";
import CurrentDate from "../common/CurrentDate";
import TrainingNotifications from "./TrainingNotifications";
import "./Topbar.css";

export default function Topbar({ title, navOpen, isCompactNav, onToggleNav, notify, user, onLogout, onTrainingNotification }) {
  const [signingOut, setSigningOut] = useState(false);

  const logout = async () => {
    setSigningOut(true);
    try {
      await onLogout();
    } catch {
      notify("Không thể đăng xuất lúc này. Vui lòng thử lại.", "error");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <header className="topbar">
      <div className="top-left">
        <button
          type="button"
          className={`menu-toggle${isCompactNav && navOpen ? " menu-toggle-open" : ""}`}
          onClick={onToggleNav}
          aria-label={isCompactNav
            ? navOpen ? "Đóng thanh điều hướng" : "Mở thanh điều hướng"
            : navOpen ? "Thu gọn thanh điều hướng" : "Mở rộng thanh điều hướng"}
          aria-expanded={navOpen}
          aria-controls="primary-navigation"
        >
          <Menu size={21} aria-hidden="true" />
        </button>
        <div className="breadcrumb">
          Trang chủ <ChevronRight size={14} /> <b>{title}</b>
        </div>
      </div>
      <div className="top-actions">
        <div className="top-date">
          <CalendarDays size={16} aria-hidden="true" /> <CurrentDate />
        </div>
        <TrainingNotifications onSelect={onTrainingNotification} />
        <div className="top-profile">
          <div
            className="avatar avatar-purple"
            title={user.name || user.username}
          >
            {initials(user.name || user.username)}
          </div>
          <span className="top-username" title={user.username}>{user.username}</span>
          <button
            type="button"
            className="icon-button"
            disabled={signingOut}
            onClick={logout}
            aria-label="Đăng xuất"
            title="Đăng xuất"
          >
            <LogOut size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
