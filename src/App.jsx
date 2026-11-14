import React, { useCallback, useEffect, useRef, useState } from "react";
import AuthGate from "./components/auth/AuthGate";
import MainLayout from "./components/layout/MainLayout";
import EditModal from "./components/modals/EditModal";
import DashboardPage from "./pages/DashboardPage";
import EmployeesPage from "./pages/EmployeesPage";
import SubjectsPage from "./pages/SubjectsPage";
import TrainingPage from "./pages/TrainingPage";
import SystemAccountsPage from "./pages/SystemAccountsPage";
import ConfirmDialog from "./components/common/ConfirmDialog";
import usePeopleHubData from "./hooks/usePeopleHubData";
import usePageNavigation from "./hooks/usePageNavigation";
import { subjectError } from "./services/subjectApi";
import "./styles.css";

class SubjectPageErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("Không thể hiển thị giao diện Quản lý môn học:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="panel modal-body" role="alert">
          <h2>Không thể hiển thị Quản lý môn học</h2>
          <p>Đã xảy ra lỗi khi dựng giao diện. Tải lại trang để thử lại.</p>
          <button type="button" className="btn btn-secondary" onClick={() => window.location.reload()}>
            Tải lại trang
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}

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
  const [confirmation, setConfirmation] = useState(null);
  const confirmationResolver = useRef(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);
  const notify = (message, type = "success") => {
    window.clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = window.setTimeout(() => setToast(null), 3000);
  };
  const confirmDelete = (options) => new Promise((resolve) => {
    confirmationResolver.current = resolve;
    setConfirmation(options);
  });
  const resolveConfirmation = (confirmed) => {
    setConfirmation(null);
    confirmationResolver.current?.(confirmed);
    confirmationResolver.current = null;
  };

  const {
    subjects,
    refreshSubjects,
    courses,
    saveRecord,
    removeSubject,
  } = usePeopleHubData(notify, confirmDelete);

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
      notify("Đã lưu thông tin thành công", "success");
    } catch (error) {
      notify(
        type === "subject"
          ? subjectError(error, "Không lưu được môn học. Vui lòng thử lại.")
          : "Không lưu được thông tin. Vui lòng thử lại.",
        "error",
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
      confirmation={confirmation && (
        <ConfirmDialog
          {...confirmation}
          onCancel={() => resolveConfirmation(false)}
          onConfirm={() => resolveConfirmation(true)}
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
          confirmDelete={confirmDelete}
        />
      )}
      {page === "training" && (
          <TrainingPage key={`${trainingStatus}-${trainingNavigation}`} subjects={subjects} initialStatus={trainingStatus} onImported={refreshSubjects} />
      )}
      {page === "system-accounts" && user.canManageSystemAccounts && (
        <SystemAccountsPage notify={notify} confirmDelete={confirmDelete} currentUserId={user.id} />
      )}
      {page === "subjects" && (
        <SubjectPageErrorBoundary>
          <SubjectsPage
            subjects={subjects}
            query={query}
            setQuery={setQuery}
            openSubject={openSubject}
            removeSubject={removeSubject}
            confirmDelete={confirmDelete}
          />
        </SubjectPageErrorBoundary>
      )}
    </MainLayout>
  );
}
