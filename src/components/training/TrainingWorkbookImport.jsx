import React, { useState } from "react";
import { X } from "lucide-react";
import { trainingMatrixApi } from "../../services/trainingMatrixApi";
import readTrainingWorkbook from "../../utils/readTrainingWorkbook";

const units = { 1: "ngày", 2: "tháng", 3: "năm" };

export default function TrainingWorkbookImport({ onClose, onImported }) {
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const chooseFile = async (event) => {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setPreview(null);
    setResult(null);
    setError("");
    try {
      setPreview(await readTrainingWorkbook(file));
    } catch (error) {
      setError(error.message || "Không đọc được tệp Excel.");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (busy || !preview || result) return;
    setBusy(true);
    setError("");
    try {
      const { employees, subjects, entries } = preview;
      setResult(await trainingMatrixApi.importWorkbook({ employees, subjects, entries }));
      onImported();
    } catch (error) {
      if (error.status === 404) {
        setError("Backend chưa có API nhập bảng đào tạo. Hãy build và khởi động lại API rồi thử lại.");
      } else {
        setError(error.message.startsWith("API Error:")
          ? "Không nhập được bảng đào tạo. Vui lòng kiểm tra dữ liệu và thử lại."
          : error.message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <section className="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="training-import-title">
        <div className="modal-head">
          <h2 id="training-import-title">Nhập bảng đào tạo từ Excel</h2>
          <button type="button" className="icon-button" aria-label="Đóng" disabled={busy} onClick={onClose}>
            <X size={19} aria-hidden="true" />
          </button>
        </div>
        <div className="modal-body" aria-busy={busy}>
          <label className="form-field">
            <span>Tệp Excel theo mẫu Test.xlsx</span>
            <input type="file" accept=".xlsx" disabled={busy} onChange={chooseFile} />
          </label>
          {error && <p role="alert" className="error">{error}</p>}
          {preview && (
            <>
              <p>{preview.employees.length} nhân viên, {preview.subjects.length} môn học và {preview.entries.length} hồ sơ hợp lệ.</p>
              <details>
                <summary>Xem môn học và chu kỳ</summary>
                <ul>{preview.subjects.map((subject) => (
                  <li key={subject.code}>{subject.name} ({subject.cycleValue} {units[subject.cycleUnit]})</li>
                ))}</ul>
              </details>
              {preview.issues.length > 0 && (
                <details open>
                  <summary>{preview.issues.length} hồ sơ sẽ được bỏ qua vì ngày học thiếu hoặc không hợp lệ</summary>
                  <ul>{preview.issues.map((issue) => (
                    <li key={issue.cell}>{issue.cell} · {issue.subject} · {issue.value || "Ô trống"}</li>
                  ))}</ul>
                </details>
              )}
              <p>Mã nhân viên tạo từ STT, ví dụ DTNV-001. Hệ thống đối chiếu theo mã và giữ nguyên hồ sơ đã có.</p>
              <p>Ngày học chỉ có tháng/năm được nhập là ngày 01 của tháng đó. Ngày hết hạn tính theo chu kỳ môn học.</p>
              <p>Hồ sơ nhân viên hiện chưa có trường ngày sinh.</p>
            </>
          )}
          {result && (
            <p role="status">Đã tạo {result.employeesCreated} nhân viên, {result.subjectsCreated} môn học và {result.recordsCreated} hồ sơ. Bỏ qua {result.recordsSkipped} hồ sơ đã có.</p>
          )}
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={onClose}>Đóng</button>
          <button type="button" className="btn btn-primary" disabled={busy || !preview || Boolean(result)} onClick={save}>
            {busy ? "Đang xử lý…" : "Nhập dữ liệu hợp lệ"}
          </button>
        </div>
      </section>
    </div>
  );
}
