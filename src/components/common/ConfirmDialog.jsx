import React from "react";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmDialog({
  title = "Xác nhận xóa",
  message,
  confirmLabel = "Xóa",
  onCancel,
  onConfirm,
}) {
  return (
    <div className="modal-backdrop confirm-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onCancel();
    }}>
      <section className="modal confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-message">
        <div className="modal-head confirm-modal-head">
          <div className="confirm-modal-icon"><AlertTriangle size={20} aria-hidden="true" /></div>
          <button type="button" className="icon-button" aria-label="Đóng" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>
        <div className="confirm-modal-body">
          <h2 id="confirm-dialog-title">{title}</h2>
          <p id="confirm-dialog-message">{message}</p>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Hủy</button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}
