import React, { useEffect, useState } from "react";
import { AlertCircle, X } from "lucide-react";
import "./AntiDebugger.css";

const DEVTOOLS_KEYS = new Set(["i", "j", "c"]);
const DOCKED_PANEL_THRESHOLD = 180;

function blockDebugShortcut(event) {
  const key = event.key.toLowerCase();
  const usesCtrl = event.ctrlKey && !event.altKey && !event.metaKey;
  if (key === "f12" || (usesCtrl && (
    event.shiftKey ? DEVTOOLS_KEYS.has(key) : key === "u"
  ))) {
    event.preventDefault();
  }
}

function blockContextMenu(event) {
  const target = event.target;
  if (target instanceof Element &&
      (target.closest("input, textarea") || target.isContentEditable)) return;
  event.preventDefault();
}

export default function AntiDebugger() {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(hover: hover) and (pointer: fine)");
    let timer;
    let panelDetected = false;

    const checkWindow = () => {
      if (document.hidden) return;
      const panelVisible = desktop.matches && (
        window.outerWidth - window.innerWidth >= DOCKED_PANEL_THRESHOLD ||
        window.outerHeight - window.innerHeight >= DOCKED_PANEL_THRESHOLD
      );
      if (panelVisible !== panelDetected) {
        panelDetected = panelVisible;
        setShowWarning(panelVisible);
      }
    };

    const scheduleCheck = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(checkWindow, 250);
    };

    window.addEventListener("keydown", blockDebugShortcut, true);
    window.addEventListener("contextmenu", blockContextMenu, true);
    window.addEventListener("resize", scheduleCheck);
    document.addEventListener("visibilitychange", scheduleCheck);
    scheduleCheck();

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", blockDebugShortcut, true);
      window.removeEventListener("contextmenu", blockContextMenu, true);
      window.removeEventListener("resize", scheduleCheck);
      document.removeEventListener("visibilitychange", scheduleCheck);
    };
  }, []);

  if (!showWarning) return null;

  return (
    <aside className="devtools-warning">
      <AlertCircle size={18} aria-hidden="true" />
      <span role="status">Công cụ nhà phát triển có thể đang mở. Vui lòng đóng nếu bạn đang sử dụng.</span>
      <button type="button" className="icon-button" aria-label="Đóng cảnh báo" onClick={() => setShowWarning(false)}>
        <X size={17} aria-hidden="true" />
      </button>
    </aside>
  );
}
