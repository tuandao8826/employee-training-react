import React, { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, Clock3 } from "lucide-react";
import { trainingMatrixApi } from "../../services/trainingMatrixApi";
import "./TrainingNotifications.css";

const notificationTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
};

export default function TrainingNotifications({ onSelect }) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const container = useRef(null);
  const trigger = useRef(null);
  const panel = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    setError("");
    trainingMatrixApi.notifications(1, 5, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setResult(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError("Không tải được thông báo.");
      });
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    const controller = new AbortController();
    const refreshInterval = window.setInterval(() => {
      trainingMatrixApi.notifications(1, 5, controller.signal)
        .then((latest) => {
          if (controller.signal.aborted) return;
          setResult((current) => {
            if (!current) return latest;
            const newestIds = new Set(latest.pageItems.map((item) => item.id));
            const pageItems = [
              ...latest.pageItems,
              ...current.pageItems.filter((item) => !newestIds.has(item.id)),
            ];
            const loadedPage = current.pageInfo?.page ?? 1;
            return {
              ...latest,
              pageItems,
              pageInfo: {
                ...latest.pageInfo,
                page: loadedPage,
                itemCount: pageItems.length,
                hasNext: loadedPage < latest.pageInfo.totalPages,
              },
            };
          });
        })
        .catch(() => {});
    }, 10000);
    return () => {
      window.clearInterval(refreshInterval);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event) => {
      if (!container.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  const refresh = () => {
    setError("");
    setResult(null);
    setAttempt((value) => value + 1);
  };

  const loadMore = async () => {
    if (!result?.pageInfo?.hasNext || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = result.pageInfo.page + 1;
      const next = await trainingMatrixApi.notifications(nextPage, 5);
      setResult((current) => ({
        ...next,
        pageItems: [...(current?.pageItems ?? []), ...next.pageItems],
      }));
      requestAnimationFrame(() => panel.current?.scrollTo({
        top: panel.current.scrollHeight,
        behavior: "smooth",
      }));
    } catch {
      setError("Không tải thêm được thông báo.");
    } finally {
      setLoadingMore(false);
    }
  };

  const select = async (notification) => {
    if (markingId) return;
    setError("");
    setMarkingId(notification.id);
    try {
      if (!notification.isRead) {
        await trainingMatrixApi.markNotificationRead(notification.id);
        setResult((current) => ({
          ...current,
          unreadCount: Math.max(0, current.unreadCount - 1),
          pageItems: current.pageItems.map((item) => item.id === notification.id
            ? { ...item, isRead: true }
            : item),
        }));
      }
      setOpen(false);
      onSelect(notification.type === 1 ? "expired" : "expiring");
    } catch {
      setError("Không thể cập nhật trạng thái đã đọc. Vui lòng thử lại.");
    } finally {
      setMarkingId(null);
    }
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
        aria-label={result?.unreadCount > 0
          ? `Thông báo đào tạo, ${result.unreadCount} thông báo chưa đọc`
          : "Thông báo đào tạo"}
        aria-expanded={open}
        aria-controls={open ? "training-notifications-panel" : undefined}
        onClick={() => {
          if (!open) refresh();
          setOpen(!open);
        }}
      >
        <Bell size={18} aria-hidden="true" />
        {result?.unreadCount > 0 && (
          <span className="notification-badge" aria-hidden="true">
            {result.unreadCount > 99 ? "99+" : result.unreadCount}
          </span>
        )}
      </button>
      {open && (
        <section ref={panel} id="training-notifications-panel" className="training-notifications-panel" aria-label="Thông báo đào tạo">
          <h2>Thông báo</h2>
          {result && result.unreadCount > 0 && <span className="training-notifications-unread-count">{result.unreadCount} chưa đọc</span>}
          {error ? (
            <p role="status">
              {error} <button type="button" className="btn btn-secondary btn-small" onClick={refresh}>Thử lại</button>
            </p>
          ) : result ? (
            <>
              {result.pageItems.map((notification) => (
                <button
                  className={`training-notification-card${notification.isRead ? " is-read" : ""}`}
                  type="button"
                  key={notification.id}
                  disabled={Boolean(markingId)}
                  onClick={() => select(notification)}
                >
                  <span className="training-notification-card-top">
                    <strong>Thông báo đào tạo</strong>
                    <b>{notification.employeeCount} nhân viên</b>
                  </span>
                  <span className="training-notification-card-bottom">
                    <span>{notification.type === 1 ? "Nhân viên đã hết hạn" : "Nhân viên sắp hết hạn (1–14 ngày)"}</span>
                    <span className="training-notification-card-meta">
                      <small><i />{notification.isRead ? "Đã đọc" : "Chưa đọc"}</small>
                      <time dateTime={notification.createdAt} title="Thời gian tạo thông báo">
                        <Clock3 size={12} aria-hidden="true" />{notificationTime(notification.createdAt)}
                      </time>
                    </span>
                  </span>
                </button>
              ))}
              {result.pageItems.length === 0 && <p className="training-notifications-empty">Chưa có thông báo đào tạo.</p>}
              {result.pageInfo.hasNext && (
                <button type="button" className="training-notifications-more" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? "Đang tải…" : "Xem thêm"}
                  {!loadingMore && <ChevronDown size={15} aria-hidden="true" />}
                </button>
              )}
            </>
          ) : <p role="status">Đang tải thông báo…</p>}
        </section>
      )}
    </div>
  );
}
