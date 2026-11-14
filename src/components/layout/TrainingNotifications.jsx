import React, { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { trainingMatrixApi } from "../../services/trainingMatrixApi";
import "./TrainingNotifications.css";

export default function TrainingNotifications({ onSelect }) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const container = useRef(null);
  const trigger = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    trainingMatrixApi.notifications(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setResult(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event) => {
      if (!container.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  const refresh = () => {
    setError(false);
    setAttempt((value) => value + 1);
  };

  const select = (status) => {
    setOpen(false);
    onSelect(status);
  };

  return (
    <div
      ref={container}
      className="training-notifications"
      onKeyDown={(event) => {
        if (open && event.key === "Escape") {
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="icon-button notification"
        aria-label="Thông báo đào tạo"
        aria-expanded={open}
        aria-controls={open ? "training-notifications-panel" : undefined}
        onClick={() => {
          if (!open) refresh();
          setOpen(!open);
        }}
      >
        <Bell size={18} aria-hidden="true" />
        {result && (result.expiringSoon > 0 || result.expiresToday > 0) && <i />}
      </button>
      {open && (
        <section id="training-notifications-panel" className="training-notifications-panel" aria-label="Thông báo đào tạo">
          <h2>Thông báo đào tạo</h2>
          {error ? (
            <p role="status">
              Không tải được thông báo. <button type="button" className="btn btn-secondary btn-small" onClick={refresh}>Thử lại</button>
            </p>
          ) : result ? (
            <>
              <button type="button" onClick={() => select("expiring")}>
                <span>Sắp hết hạn (1–14 ngày)</span><strong>{result.expiringSoon} nhân viên</strong>
              </button>
              <button type="button" onClick={() => select("expires-today")}>
                <span>Hết hạn hôm nay</span><strong>{result.expiresToday} nhân viên</strong>
              </button>
            </>
          ) : <p role="status">Đang tải thông báo…</p>}
        </section>
      )}
    </div>
  );
}
