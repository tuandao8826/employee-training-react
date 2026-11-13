import React from "react";
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  ChevronDown,
  FileText,
  Settings,
  X,
} from "lucide-react";
import { initials } from "../../utils/helpers";

export default function Sidebar({
  user,
  nav,
  page,
  isOpen,
  onClose,
  onNavigate,
  notify,
}) {
  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="brand">
        <div className="brand-mark">
          <ChartNoAxesCombined size={22} />
        </div>
        <div>
          <strong>PeopleHub</strong>
          <span>HR & TRAINING</span>
        </div>
        <button className="mobile-close" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      <div className="workspace">
        <div className="workspace-logo">AC</div>
        <div>
          <b>Acme Corporation</b>
          <small>Không gian làm việc</small>
        </div>
        <ChevronDown size={15} />
      </div>
      <nav>
        {nav.map((group) => (
          <div className="nav-group" key={group.label}>
            <div className="nav-label">{group.label}</div>
            {group.items.map(([id, label, Icon]) => (
              <button
                key={id}
                className={`nav-item ${page === id ? "active" : ""}`}
                onClick={() => onNavigate(id)}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="help-card">
          <div className="help-icon">
            <FileText size={18} />
          </div>
          <b>Cần trợ giúp?</b>
          <p>Xem hướng dẫn sử dụng hệ thống.</p>
          <button
            onClick={() => notify("Tài liệu hướng dẫn sẽ được bổ sung sau.")}
          >
            Xem hướng dẫn <ArrowUpRight size={14} />
          </button>
        </div>
        <button className="nav-item">
          <Settings size={18} />
          <span>Cài đặt</span>
        </button>
        <div className="profile">
          <div className="avatar avatar-purple">
            {initials(user.name || user.username)}
          </div>
          <div className="profile-info">
            <b>{user.name || user.username}</b>
            <small>{user.role?.name || user.username}</small>
          </div>
        </div>
      </div>
    </aside>
  );
}
