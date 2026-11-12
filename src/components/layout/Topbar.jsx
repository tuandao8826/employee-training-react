import React from "react";
import { Bell, CalendarDays, ChevronDown, ChevronRight, Menu } from "lucide-react";

export default function Topbar({ title, onOpenNav, notify }) {
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
          <CalendarDays size={16} /> Thứ Hai, 12/10/2026
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
          <div className="avatar avatar-purple">AD</div>
          <ChevronDown size={15} />
        </div>
      </div>
    </header>
  );
}
