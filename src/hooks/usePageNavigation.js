import { useEffect, useState } from "react";

const pages = new Set(["dashboard", "employees", "training", "subjects"]);

function readPage(canManageSystemAccounts) {
  const page = new URLSearchParams(window.location.search).get("page");
  if (page === "system-accounts" && canManageSystemAccounts) return page;
  return pages.has(page) ? page : "dashboard";
}

function readTrainingStatus() {
  const status = new URLSearchParams(window.location.search).get("trainingStatus");
  return status === "expiring" || status === "expires-today" ? status : "all";
}

export default function usePageNavigation(onNavigate, canManageSystemAccounts) {
  const [page, setPage] = useState(() => readPage(canManageSystemAccounts));
  const [trainingStatus, setTrainingStatus] = useState(readTrainingStatus);
  const [trainingNavigation, setTrainingNavigation] = useState(0);

  useEffect(() => {
    const restorePage = () => {
      setPage(readPage(canManageSystemAccounts));
      setTrainingStatus(readTrainingStatus());
      onNavigate();
    };
    window.addEventListener("popstate", restorePage);
    return () => window.removeEventListener("popstate", restorePage);
  }, [onNavigate, canManageSystemAccounts]);

  const navigate = (nextPage, status = "all") => {
    if (!pages.has(nextPage) && !(nextPage === "system-accounts" && canManageSystemAccounts)) return;

    if (nextPage !== readPage(canManageSystemAccounts) || status !== readTrainingStatus()) {
      const url = new URL(window.location.href);
      url.searchParams.set("page", nextPage);
      if (nextPage === "training" && status !== "all") url.searchParams.set("trainingStatus", status);
      else url.searchParams.delete("trainingStatus");
      window.history.pushState(null, "", url);
    }

    setPage(nextPage);
    setTrainingStatus(status);
    if (nextPage === "training" && status !== "all") {
      setTrainingNavigation((value) => value + 1);
    }
    onNavigate();
  };

  return [page, navigate, trainingStatus, trainingNavigation];
}
