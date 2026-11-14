import React, { useEffect, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
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
      ["training", "Quản lý đào tạo", ClipboardList],
      ["subjects", "Quản lý môn học", BookOpen],
    ],
  },
];

export default function MainLayout({
  user,
  onLogout,
  page,
  onNavigate,
  notify,
  toast,
  children,
  modal,
}) {
  const [isCompactNav, setIsCompactNav] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches,
  );
  const [navOpen, setNavOpen] = useState(() =>
    typeof window === "undefined" || !window.matchMedia("(max-width: 900px)").matches,
  );
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 900px)");
    const syncViewport = () => {
      setIsCompactNav(mediaQuery.matches);
      setNavOpen(!mediaQuery.matches);
    };
    mediaQuery.addEventListener("change", syncViewport);
    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);
  const availableNavigation = user.canManageSystemAccounts
    ? [...navigation, { label: "HỆ THỐNG", items: [["system-accounts", "Tài khoản hệ thống", Shield]] }]
    : navigation;
  const title = availableNavigation
    .flatMap((group) => group.items)
    .find(([id]) => id === page)?.[1];
  const closeNav = () => setNavOpen(false);

  const navigate = (nextPage, status) => {
    onNavigate(nextPage, status);
    if (isCompactNav) closeNav();
  };

  return (
    <div className={`app-shell${!isCompactNav && !navOpen ? " nav-compact" : ""}`}>
      <Sidebar
        user={user}
        nav={availableNavigation}
        page={page}
        isOpen={navOpen}
        isCompactNav={isCompactNav}
        collapsed={!isCompactNav && !navOpen}
        onClose={closeNav}
        onNavigate={navigate}
        notify={notify}
      />
      {isCompactNav && navOpen && <div className="scrim" onClick={closeNav} />}
      <main className="main-area">
        <Topbar
          onTrainingNotification={(status) => navigate("training", status)}
          user={user}
          onLogout={onLogout}
          title={title}
          navOpen={navOpen}
          isCompactNav={isCompactNav}
          onToggleNav={() => setNavOpen((open) => !open)}
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
