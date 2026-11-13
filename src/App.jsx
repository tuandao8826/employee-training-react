import React, { useCallback, useState } from "react";
import AuthGate from "./components/auth/AuthGate";
import MainLayout from "./components/layout/MainLayout";
import EditModal from "./components/modals/EditModal";
import DashboardPage from "./pages/DashboardPage";
import EmployeesPage from "./pages/EmployeesPage";
import SubjectsPage from "./pages/SubjectsPage";
import CoursesPage from "./pages/CoursesPage";
import SystemAccountsPage from "./pages/SystemAccountsPage";
import usePeopleHubData from "./hooks/usePeopleHubData";
import usePageNavigation from "./hooks/usePageNavigation";
import "./styles.css";

export default function App() {
  return (
    <AuthGate>
      {(user, onLogout) => <PeopleHub user={user} onLogout={onLogout} />}
    </AuthGate>
  );
}

function PeopleHub({ user, onLogout }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Tất cả");
  const [modal, setModal] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [toast, setToast] = useState("");
  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  const {
    employees,
    subjects,
    courses,
    saveRecord,
    removeSubject,
    removeCourse,
    updateCourseProgress,
  } = usePeopleHubData(notify);

  const resetPageControls = useCallback(() => {
    setQuery("");
    setFilter("Tất cả");
    setModal(null);
  }, []);
  const [page, navigate] = usePageNavigation(resetPageControls, user.canManageSystemAccounts);

  const openSubject = (subject) =>
    setModal({ type: "subject", data: subject || null });
  const openCourse = (course) =>
    setModal({ type: "course", data: course || null });

  const saveEdit = (type, data) => {
    saveRecord(type, data);
    setModal(null);
    notify("Đã lưu thông tin thành công");
  };

  return (
    <MainLayout
      user={user}
      onLogout={onLogout}
      page={page}
      onNavigate={navigate}
      courseCount={courses.length}
      notify={notify}
      toast={toast}
      modal={modal && (
        <EditModal
          modal={modal}
          employees={employees}
          subjects={subjects}
          courses={courses}
          onClose={() => setModal(null)}
          onSave={saveEdit}
        />
      )}
    >
      {page === "dashboard" && (
        <DashboardPage
          courses={courses}
          subjects={subjects}
          setPage={navigate}
          setSelectedCourse={setSelectedCourse}
        />
      )}
      {page === "employees" && (
        <EmployeesPage
          query={query}
          setQuery={setQuery}
          filter={filter}
          setFilter={setFilter}
          notify={notify}
        />
      )}
      {page === "system-accounts" && user.canManageSystemAccounts && (
        <SystemAccountsPage notify={notify} canDelete={user.canDeleteSystemAccounts} />
      )}
      {page === "subjects" && (
        <SubjectsPage
          subjects={subjects}
          query={query}
          setQuery={setQuery}
          openSubject={openSubject}
          removeSubject={removeSubject}
        />
      )}
      {page === "courses" && (
        <CoursesPage
          courses={courses}
          employees={employees}
          subjects={subjects}
          query={query}
          setQuery={setQuery}
          filter={filter}
          setFilter={setFilter}
          openCourse={openCourse}
          removeCourse={removeCourse}
          setSelectedCourse={setSelectedCourse}
          selectedCourse={selectedCourse}
          updateCourseProgress={updateCourseProgress}
        />
      )}
    </MainLayout>
  );
}
