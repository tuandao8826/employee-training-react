import { useEffect, useState } from "react";

const pages = new Set(["dashboard", "employees", "subjects", "courses"]);

function readPage(canManageSystemAccounts) {
  const page = new URLSearchParams(window.location.search).get("page");
  if (page === "system-accounts" && canManageSystemAccounts) return page;
  return pages.has(page) ? page : "dashboard";
}

export default function usePageNavigation(onNavigate, canManageSystemAccounts) {
  const [page, setPage] = useState(() => readPage(canManageSystemAccounts));

  useEffect(() => {
    const restorePage = () => {
      setPage(readPage(canManageSystemAccounts));
      onNavigate();
    };
    window.addEventListener("popstate", restorePage);
    return () => window.removeEventListener("popstate", restorePage);
  }, [onNavigate, canManageSystemAccounts]);

  const navigate = (nextPage) => {
    if (!pages.has(nextPage) && !(nextPage === "system-accounts" && canManageSystemAccounts)) return;

    if (nextPage !== readPage(canManageSystemAccounts)) {
      const url = new URL(window.location.href);
      url.searchParams.set("page", nextPage);
      window.history.pushState(null, "", url);
    }

    setPage(nextPage);
    onNavigate();
  };

  return [page, navigate];
}
