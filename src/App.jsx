import React, { useCallback, useState } from "react";
import AuthGate from "./components/auth/AuthGate";
import MainLayout from "./components/layout/MainLayout";
import EditModal from "./components/modals/EditModal";
import DashboardPage from "./pages/DashboardPage";
import EmployeesPage from "./pages/EmployeesPage";
import SubjectsPage from "./pages/SubjectsPage";
import TrainingPage from "./pages/TrainingPage";
import SystemAccountsPage from "./pages/SystemAccountsPage";
import usePeopleHubData from "./hooks/usePeopleHubData";
import usePageNavigation from "./hooks/usePageNavigation";
import { subjectError } from "./services/subjectApi";
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
  const [toast, setToast] = useState("");
  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  const {
    subjects,
    refreshSubjects,
    courses,
    saveRecord,
    removeSubject,
  } = usePeopleHubData(notify);

  const resetPageControls = useCallback(() => {
    setQuery("");
    setFilter("Tất cả");
    setModal(null);
  }, []);
  const [page, navigate, trainingStatus, trainingNavigation] = usePageNavigation(resetPageControls, user.canManageSystemAccounts);

  const openSubject = (subject) =>
    setModal({ type: "subject", data: subject || null });
  const saveEdit = async (type, data) => {
    try {
      await saveRecord(type, data);
      setModal(null);
      notify("Đã lưu thông tin thành công");
    } catch (error) {
      notify(
        type === "subject"
          ? subjectError(error, "Không lưu được môn học. Vui lòng thử lại.")
          : "Không lưu được thông tin. Vui lòng thử lại.",
      );
    }
  };

  return (
    <MainLayout
      user={user}
      onLogout={onLogout}
      page={page}
      onNavigate={navigate}
      notify={notify}
      toast={toast}
      modal={modal && (
        <EditModal
          modal={modal}
          subjects={subjects}
          courses={courses}
          onClose={() => setModal(null)}
          onSave={saveEdit}
        />
      )}
    >
      {page === "dashboard" && (
        <DashboardPage
          subjects={subjects}
          setPage={navigate}
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
      {page === "training" && (
        <TrainingPage key={`${trainingStatus}-${trainingNavigation}`} subjects={subjects} initialStatus={trainingStatus} onImported={refreshSubjects} />
      )}
      {page === "system-accounts" && user.canManageSystemAccounts && (
        <SystemAccountsPage notify={notify} currentUserId={user.id} />
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
    </MainLayout>
  );
}
