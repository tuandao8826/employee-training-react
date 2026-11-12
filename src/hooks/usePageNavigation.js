import { useEffect, useState } from "react";

const pages = new Set(["dashboard", "employees", "subjects", "courses"]);

function readPage() {
  const page = new URLSearchParams(window.location.search).get("page");
  return pages.has(page) ? page : "dashboard";
}

export default function usePageNavigation(onNavigate) {
  const [page, setPage] = useState(readPage);

  useEffect(() => {
    const restorePage = () => {
      setPage(readPage());
      onNavigate();
    };
    window.addEventListener("popstate", restorePage);
    return () => window.removeEventListener("popstate", restorePage);
  }, [onNavigate]);

  const navigate = (nextPage) => {
    if (!pages.has(nextPage)) return;

    if (nextPage !== readPage()) {
      const url = new URL(window.location.href);
      url.searchParams.set("page", nextPage);
      window.history.pushState(null, "", url);
    }

    setPage(nextPage);
    onNavigate();
  };

  return [page, navigate];
}
