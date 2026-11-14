import React, { useState } from "react";
import { X } from "lucide-react";
import { trainingMatrixApi } from "../../services/trainingMatrixApi";
import readTrainingWorkbook from "../../utils/readTrainingWorkbook";

function importError(error, fallback) {
  if (error.status === 404) return "Backend chưa có API nhập bảng đào tạo. Hãy build và khởi động lại API rồi thử lại.";
  if (error.status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  return error.message && !error.message.startsWith("API Error:") ? error.message : fallback;
}

function ImportSummary({ counts, completed }) {
  return (
    <div role="status">
      <strong>{completed ? "Đã đồng bộ" : "Dự kiến đồng bộ"}</strong>
      <ul>
        <li>{counts.employeesCreated} nhân viên mới</li>
        <li>{counts.subjectsCreated} môn học mới</li>
        <li>{counts.recordsCreated + counts.recordsUpdated} ngày học thay đổi ({counts.recordsCreated} thêm mới, {counts.recordsUpdated} cập nhật)</li>
        <li>{counts.recordsUnchanged} ngày học trùng với CSDL</li>
      </ul>
    </div>
  );
}

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
      const { employees, subjects, entries, issues, subjectsUsingDefaultCycle } = await readTrainingWorkbook(file);
      const data = { employees, subjects, entries };
      const counts = await trainingMatrixApi.previewImportWorkbook(data);
      setPreview({ data, counts, issues, subjectsUsingDefaultCycle });
    } catch (error) {
      setError(importError(error, "Không xem trước được bảng đào tạo."));
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (busy || !preview || result) return;
    setBusy(true);
    setError("");
    try {
      setResult(await trainingMatrixApi.importWorkbook({ ...preview.data, expectedResult: preview.counts }));
      onImported();
    } catch (error) {
      setError(importError(error, "Không đồng bộ được bảng đào tạo."));
      if (error.status === 409) {
        setPreview(null);
        try {
          const counts = await trainingMatrixApi.previewImportWorkbook(preview.data);
          setPreview({ ...preview, counts });
        } catch (previewError) {
          setError(importError(previewError, "Không cập nhật được số liệu xem trước. Hãy chọn lại tệp."));
        }
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
            <span>Tệp Excel có cột Staff_Code, Staff_Name và mã môn học</span>
            <input type="file" accept=".xlsx" disabled={busy} onChange={chooseFile} />
          </label>
          {error && <p role="alert" className="error">{error}</p>}
          {preview && !result && (
            <>
              <ImportSummary counts={preview.counts} />
              {preview.data.employees.some((employee) => employee.usesTemporaryCode) && (
                <p>{preview.data.employees.filter((employee) => employee.usesTemporaryCode).length} dòng thiếu Staff_Code dùng mã tạm từ STT, ví dụ DTNV-001.</p>
              )}
              {preview.subjectsUsingDefaultCycle.length > 0 && (
                <p>Môn học mới thiếu chu kỳ sẽ dùng chu kỳ 1 năm ({preview.subjectsUsingDefaultCycle.join(", ")}).</p>
              )}
              {preview.issues.length > 0 && (
                <details open>
                  <summary>{preview.issues.length} ô ngày học sai định dạng sẽ được bỏ qua</summary>
                  <ul>{preview.issues.map((issue) => (
                    <li key={issue.cell}>{issue.cell} · {issue.staffCode} · {issue.subject} · {issue.value}</li>
                  ))}</ul>
                </details>
              )}
              <p>Ô ngày học để trống sẽ được bỏ qua. Ngày hết hạn được tính theo chu kỳ môn học.</p>
            </>
          )}
          {result && <ImportSummary counts={result} completed />}
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={onClose}>Đóng</button>
          <button type="button" className="btn btn-primary" disabled={busy || !preview || Boolean(result)} onClick={save}>
            {busy ? "Đang xử lý…" : "Xác nhận đồng bộ"}
          </button>
        </div>
      </section>
    </div>
  );
}
