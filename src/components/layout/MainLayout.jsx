import React, { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  GraduationCap,
  LayoutDashboard,
  Shield,
  Users,
} from "lucide-react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const navigation = [
  {
    label: "TỔNG QUAN",
    items: [["dashboard", "Tổng quan", LayoutDashboard]],
  },
  { label: "NHÂN SỰ", items: [["employees", "Quản lý nhân viên", Users]] },
  {
    label: "ĐÀO TẠO",
    items: [
      ["subjects", "Quản lý môn học", BookOpen],
      ["courses", "Quản lý khóa học", GraduationCap],
    ],
  },
];

export default function MainLayout({
  user,
  onLogout,
  page,
  onNavigate,
  courseCount,
  notify,
  toast,
  children,
  modal,
}) {
  const [mobileNav, setMobileNav] = useState(false);
  const availableNavigation = user.canManageSystemAccounts
    ? [...navigation, { label: "HỆ THỐNG", items: [["system-accounts", "Tài khoản hệ thống", Shield]] }]
    : navigation;
  const title = availableNavigation
    .flatMap((group) => group.items)
    .find(([id]) => id === page)?.[1];
  const closeNav = () => setMobileNav(false);

  const navigate = (nextPage) => {
    onNavigate(nextPage);
    closeNav();
  };

  return (
    <div className="app-shell">
      <Sidebar
        user={user}
        nav={availableNavigation}
        page={page}
        courseCount={courseCount}
        isOpen={mobileNav}
        onClose={closeNav}
        onNavigate={navigate}
        notify={notify}
      />
      {mobileNav && <div className="scrim" onClick={closeNav} />}
      <main className="main-area">
        <Topbar
          user={user}
          onLogout={onLogout}
          title={title}
          onOpenNav={() => setMobileNav(true)}
          notify={notify}
        />
        <div className="content">{children}</div>
      </main>
      {modal}
      {toast && (
        <div className="toast">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}
