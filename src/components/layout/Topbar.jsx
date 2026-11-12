import React, { useState } from "react";
import { Bell, CalendarDays, ChevronRight, LogOut, Menu } from "lucide-react";
import { initials } from "../../utils/helpers";
import CurrentDate from "../common/CurrentDate";

export default function Topbar({ title, onOpenNav, notify, user, onLogout }) {
  const [signingOut, setSigningOut] = useState(false);

  const logout = async () => {
    setSigningOut(true);
    try {
      await onLogout();
    } catch {
      notify("Không thể đăng xuất lúc này. Vui lòng thử lại.");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <header className="topbar">
      <div className="top-left">
        <button className="menu-toggle" onClick={onOpenNav}>
          <Menu size={21} />
        </button>
        <div className="breadcrumb">
          Trang chủ <ChevronRight size={14} /> <b>{title}</b>
        </div>
      </div>
      <div className="top-actions">
        <div className="top-date">
          <CalendarDays size={16} aria-hidden="true" /> <CurrentDate />
        </div>
        <button
          className="icon-button notification"
          onClick={() => notify("Bạn đã xem các thông báo mới.")}
          aria-label="Thông báo"
        >
          <Bell size={18} />
          <i />
        </button>
        <div className="top-profile">
          <div
            className="avatar avatar-purple"
            title={user.name || user.username}
          >
            {initials(user.name || user.username)}
          </div>
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
