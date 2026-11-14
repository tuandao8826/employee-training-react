import React, { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, CalendarClock, Download, Search, Upload, Users, CalendarDays } from "lucide-react";
import { Empty, Stat } from "../components/common/UI";
import TrainingWorkbookImport from "../components/training/TrainingWorkbookImport";
import { trainingMatrixApi, trainingMatrixError } from "../services/trainingMatrixApi";
import { createExpiredTrainingWorkbook, downloadWorkbook } from "../utils/exportExpiredTrainingsExcel";

const pageSize = 8;
const dateInput = (value) => (value ? value.slice(0, 10) : "");
const dateLabel = (value) => {
  if (!value) return "—";
  const [year, month, day] = dateInput(value).split("-");
  return `${day}/${month}/${year}`;
};
const dayMilliseconds = 24 * 60 * 60 * 1000;
const businessDate = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Bangkok", dateStyle: "short" });
const expiryClasses = {
  valid: "training-valid",
  expired: "training-expired",
  expiring: "training-expiring-soon",
  "expires-today": "training-expires-today",
};

function parseDateInput(value) {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (parsed.getUTCFullYear() !== Number(year) || parsed.getUTCMonth() !== Number(month) - 1 || parsed.getUTCDate() !== Number(day)) return null;
  return `${year}-${month}-${day}`;
}

function paginationItems(currentPage, totalPages) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (currentPage <= 3) return [1, 2, 3, 4, "…", totalPages];
  if (currentPage >= totalPages - 2) return [1, "…", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, "…", currentPage - 1, currentPage, currentPage + 1, "…", totalPages];
}

function expiryClass(value) {
  if (!value) return "";
  const expiration = new Date(`${dateInput(value)}T00:00:00Z`).getTime();
  const todayUtc = Date.parse(`${businessDate.format(new Date())}T00:00:00Z`);
  const daysRemaining = Math.floor((expiration - todayUtc) / dayMilliseconds);
  if (daysRemaining < 0) return "training-expired";
  if (daysRemaining === 0) return "training-expires-today";
  if (daysRemaining <= 14) return "training-expiring-soon";
  return "training-valid";
}

function TrainingDateEditor({ value, draft, disabled, subjectName, staffName, onDraftChange, onTextCommit, onDateSelect }) {
  const datePickerRef = useRef(null);
  return (
    <div className="training-date-editor">
      <input
        className="training-date-text"
        type="text"
        inputMode="numeric"
        maxLength={10}
        placeholder="dd/mm/yyyy"
        aria-label={`Ngày học ${subjectName} của ${staffName} (dd/mm/yyyy)`}
        value={draft ?? dateLabel(value).replace("—", "")}
        disabled={disabled}
        onChange={(event) => onDraftChange(event.target.value)}
        onBlur={(event) => onTextCommit(event.target.value)}
      />
      <button
        type="button"
        className="training-date-picker-button"
        title="Chọn ngày"
        aria-label={`Chọn ngày học ${subjectName} của ${staffName}`}
        disabled={disabled}
        onClick={() => {
          const picker = datePickerRef.current;
          if (!picker) return;
          if (picker.showPicker) picker.showPicker();
          else picker.click();
        }}
      >
        <CalendarDays size={14} />
      </button>
      <input
        ref={datePickerRef}
        className="training-native-date-picker"
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={dateInput(value)}
        disabled={disabled}
        onChange={(event) => onDateSelect(event.target.value)}
      />
    </div>
  );
}

export default function TrainingPage({ subjects = [], initialStatus = "all", onImported }) {
  const [query, setQuery] = useState("");
  const [trainingStatus, setTrainingStatus] = useState(initialStatus);
  const [subjectId, setSubjectId] = useState("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [result, setResult] = useState(null);
  const [statusRows, setStatusRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState({});
  const [dateDrafts, setDateDrafts] = useState({});
  const [exporting, setExporting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const orderedSubjects = useMemo(() => [...subjects].sort((a, b) => a.name.localeCompare(b.name, "vi")), [subjects]);
  const requiredExpiryClass = expiryClasses[trainingStatus];
  const serverPage = requiredExpiryClass ? null : page;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const timer = window.setTimeout(() => {
      const request = serverPage === null
        ? trainingMatrixApi.searchAll(query, { subjectId }, controller.signal)
        : trainingMatrixApi.search(serverPage, pageSize, query, { subjectId }, controller.signal);
      request
        .then((data) => {
          if (controller.signal.aborted) return;
          if (serverPage === null) setStatusRows(data);
          else setResult(data);
        })
        .catch((apiError) => {
          if (!controller.signal.aborted) setError(trainingMatrixError(apiError, "Không tải được bảng quản lý đào tạo."));
        })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 200);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [serverPage, query, subjectId, refreshKey]);

  const matchingRows = requiredExpiryClass ? statusRows.filter((employee) =>
    employee.subjects.some((record) =>
      (!subjectId || record.subjectId === subjectId) &&
      expiryClass(record.expirationDate) === requiredExpiryClass
    )
  ) : [];
  const visibleSubjects = subjectId
    ? orderedSubjects.filter((subject) => subject.id === subjectId)
    : orderedSubjects;
  const pageInfo = requiredExpiryClass
    ? { totalCount: matchingRows.length, totalPages: Math.ceil(matchingRows.length / pageSize) }
    : result?.pageInfo;
  const totalCount = pageInfo?.totalCount ?? 0;
  const totalPages = Math.max(1, pageInfo?.totalPages ?? 1);
  const visiblePage = Math.min(page, totalPages);
  const employees = requiredExpiryClass
    ? matchingRows.slice((visiblePage - 1) * pageSize, visiblePage * pageSize)
    : result?.pageItems ?? [];

  useEffect(() => {
    if (requiredExpiryClass && !loading && page > totalPages) setPage(totalPages);
  }, [requiredExpiryClass, loading, page, totalPages]);

  const saveTrainingDate = async (employee, subject, value) => {
    const key = `${employee.staffMemberId}:${subject.id}`;
    setSaving((current) => ({ ...current, [key]: true }));
    setError("");
    try {
      await trainingMatrixApi.saveDate(employee.staffMemberId, subject.id, value);
      if (trainingStatus !== "all" || subjectId) {
        setRefreshKey((current) => current + 1);
        return;
      }
      setResult((current) => {
        if (!current) return current;
        return {
          ...current,
          pageItems: current.pageItems.map((row) => {
            if (row.staffMemberId !== employee.staffMemberId) return row;
            const remaining = row.subjects.filter((record) => record.subjectId !== subject.id);
            if (!value) return { ...row, subjects: remaining };
            const expirationDate = new Date(value);
            const amount = Number(subject.duration) || 0;
            if (subject.cycleUnit === "Tháng") expirationDate.setUTCMonth(expirationDate.getUTCMonth() + amount);
            else if (subject.cycleUnit === "Năm") expirationDate.setUTCFullYear(expirationDate.getUTCFullYear() + amount);
            else expirationDate.setUTCDate(expirationDate.getUTCDate() + amount);
            remaining.push({ subjectId: subject.id, trainingDate: `${value}T00:00:00Z`, expirationDate: expirationDate.toISOString() });
            return { ...row, subjects: remaining };
          }),
        };
      });
    } catch (apiError) {
      setError(trainingMatrixError(apiError, "Không lưu được ngày học. Vui lòng thử lại."));
    } finally {
      setSaving((current) => ({ ...current, [key]: false }));
      setDateDrafts((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  };

  const commitTrainingDate = (employee, subject, currentDate, value) => {
    const trimmed = value.trim();
    if (!trimmed) {
      if (currentDate) saveTrainingDate(employee, subject, "");
      else setDateDrafts((current) => ({ ...current, [`${employee.staffMemberId}:${subject.id}`]: "" }));
      return;
    }
    const parsed = parseDateInput(trimmed);
    if (!parsed) {
      setError("Nhập ngày theo định dạng dd/mm/yyyy.");
      setDateDrafts((current) => {
        const next = { ...current };
        delete next[`${employee.staffMemberId}:${subject.id}`];
        return next;
      });
      return;
    }
    setError("");
    if (parsed !== dateInput(currentDate)) saveTrainingDate(employee, subject, parsed);
    else setDateDrafts((current) => {
      const next = { ...current };
      delete next[`${employee.staffMemberId}:${subject.id}`];
      return next;
    });
  };

  const exportExpiredEmployees = async () => {
    const exportSubjects = subjectId
      ? orderedSubjects.filter((subject) => subject.id === subjectId)
      : orderedSubjects;
    if (exportSubjects.length === 0) {
      setError("Chưa có môn học để xuất dữ liệu.");
      return;
    }

    setExporting(true);
    setError("");
    try {
      const expiredEmployees = await trainingMatrixApi.searchAllExpired(subjectId);
      const reportDate = dateLabel(new Date().toISOString());
      const sheets = exportSubjects.map((subject) => ({
        subject,
        rows: expiredEmployees.flatMap((employee) => {
          const record = employee.subjects.find((item) => item.subjectId === subject.id);
          if (!record || expiryClass(record.expirationDate) !== "training-expired") return [];
          return [{
            staffCode: employee.staffCode,
            staffName: employee.staffName,
            trainingDate: dateLabel(record.trainingDate),
            expirationDate: dateLabel(record.expirationDate),
          }];
        }),
      }));
      const workbook = createExpiredTrainingWorkbook(sheets, reportDate);
      const now = new Date();
      const filenameDate = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("");
      downloadWorkbook(workbook, `Nhan_vien_da_het_han_${filenameDate}.xlsx`);
    } catch (apiError) {
      setError(trainingMatrixError(apiError, "Không xuất được danh sách nhân viên hết hạn."));
    } finally {
      setExporting(false);
    }
  };

  return (
    <section>
      <div className="page-heading">
        <div>
          <div className="eyebrow">ĐÀO TẠO / TỔNG QUAN</div>
          <h1>Quản lý đào tạo</h1>
          <p>Theo dõi ngày học và hạn đào tạo của từng nhân viên theo môn học.</p>
        </div>
      </div>

      <div className="stats-row compact">
        <Stat label="Nhân viên" value={totalCount} note="Trong danh sách nhân sự" icon={Users} tone="blue" />
        <Stat label="Môn học" value={orderedSubjects.length} note="Các cột theo dõi đào tạo" icon={BookOpen} tone="purple" />
        <Stat label="Chu kỳ hạn" value="Theo môn học" note="Tự tính từ ngày học" icon={CalendarClock} tone="orange" />
      </div>

      <div className="panel">
        <div className="panel-toolbar training-toolbar">
          <div className="search-box">
            <Search size={17} />
            <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Tìm theo mã hoặc tên nhân viên..." aria-label="Tìm theo mã hoặc tên nhân viên" />
          </div>
          <label className="training-status-filter training-subject-filter">
            <span>Môn học</span>
            <select value={subjectId} onChange={(event) => { setSubjectId(event.target.value); setPage(1); }} aria-label="Lọc theo môn học">
              <option value="">Tất cả môn học</option>
              {orderedSubjects.map((subject) => <option value={subject.id} key={subject.id}>{subject.code} · {subject.name}</option>)}
            </select>
          </label>
          <label className="training-status-filter">
            <span>Trạng thái</span>
            <select value={trainingStatus} onChange={(event) => { setTrainingStatus(event.target.value); setPage(1); }} aria-label="Lọc trạng thái đào tạo">
              <option value="all">Tất cả</option>
              <option value="valid">Còn hạn</option>
              <option value="expired">Đã hết hạn</option>
              <option value="expiring">Sắp hết hạn (1–14 ngày)</option>
              <option value="expires-today">Hết hạn hôm nay</option>
            </select>
          </label>
          <span className="result-count">{totalCount} nhân viên</span>
          <button className="btn btn-secondary btn-small" type="button" onClick={() => setImportOpen(true)}>
            <Upload size={14} aria-hidden="true" /> Nhập bảng đào tạo
          </button>
          <button className="btn btn-primary btn-small training-export-button" type="button" onClick={exportExpiredEmployees} disabled={exporting || orderedSubjects.length === 0}>
            <Download size={14} />{exporting ? "Đang xuất…" : "Xuất Excel nhân viên hết hạn"}
          </button>
        </div>
        <div className="training-expiry-legend" aria-label="Chú thích trạng thái ngày hết hạn">
          <span><i className="legend-expired" />Đã hết hạn</span>
          <span><i className="legend-expires-today" />Hết hạn hôm nay</span>
          <span><i className="legend-expiring" />Sắp hết hạn (14 ngày)</span>
          <span><i className="legend-valid" />Còn hạn</span>
        </div>
        {error && <p className="error training-error" role="alert">{error}</p>}
        <div className="training-matrix-wrap">
          <table className="training-matrix">
            <thead>
              <tr>
                <th rowSpan={2}>STT</th>
                <th rowSpan={2}>Mã nhân viên</th>
                <th rowSpan={2}>Họ và tên</th>
                {visibleSubjects.map((subject) => <th key={subject.id} colSpan={2}>{subject.name}<small>{subject.duration} {subject.cycleUnit}</small></th>)}
              </tr>
              <tr>{visibleSubjects.flatMap((subject) => [
                <th className="training-subhead" key={`${subject.id}-date`}>Ngày học</th>,
                <th className="training-subhead" key={`${subject.id}-expiry`}>Ngày hết hạn</th>,
              ])}</tr>
            </thead>
            <tbody>
              {employees.map((employee, index) => (
                <tr key={employee.staffMemberId}>
                  <td>{((pageInfo?.page ?? page) - 1) * pageSize + index + 1}</td>
                  <td><b>{employee.staffCode}</b></td>
                  <td>{employee.staffName}</td>
                  {visibleSubjects.flatMap((subject) => {
                    const record = employee.subjects.find((item) => item.subjectId === subject.id);
                    const key = `${employee.staffMemberId}:${subject.id}`;
                    const currentExpiryClass = expiryClass(record?.expirationDate);
                    const showCell = trainingStatus === "all" || (record && currentExpiryClass === requiredExpiryClass);
                    return [
                      <td key={`${key}-date`} className="training-date-cell">
                        {showCell && <TrainingDateEditor
                          value={record?.trainingDate}
                          draft={dateDrafts[key]}
                          disabled={Boolean(saving[key])}
                          subjectName={subject.name}
                          staffName={employee.staffName}
                          onDraftChange={(value) => setDateDrafts((current) => ({ ...current, [key]: value }))}
                          onTextCommit={(value) => commitTrainingDate(employee, subject, record?.trainingDate, value)}
                          onDateSelect={(value) => {
                            if (value && value !== dateInput(record?.trainingDate)) saveTrainingDate(employee, subject, value);
                            else setDateDrafts((current) => {
                              const next = { ...current };
                              delete next[key];
                              return next;
                            });
                          }}
                        />}
                      </td>,
                      <td key={`${key}-expiry`} className={`training-expiry-cell ${showCell ? currentExpiryClass : ""}`}>{showCell ? dateLabel(record?.expirationDate) : ""}</td>,
                    ];
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <div className="training-matrix-overlay"><Empty title="Đang tải danh sách nhân viên…" /></div>}
          {!loading && !error && employees.length === 0 && <div className="training-matrix-empty"><Empty title={query ? "Không tìm thấy nhân viên" : "Chưa có nhân viên phù hợp"} text={query ? "Thử tìm bằng mã hoặc tên khác." : subjectId ? "Chưa có hồ sơ đào tạo cho môn học này." : "Danh sách nhân viên sẽ được hiển thị tại đây."} /></div>}
          {!loading && !error && orderedSubjects.length === 0 && <div className="training-matrix-empty"><Empty title="Chưa có môn học" text="Tạo môn học để thêm cột theo dõi ngày học và ngày hết hạn." /></div>}
        </div>
        <div className="training-pagination">
          <div className="training-pagination-controls" aria-label="Phân trang danh sách nhân viên">
            <button className="training-page-direction" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>
              <span aria-hidden="true">«</span> Previous
            </button>
            {paginationItems(pageInfo?.page ?? page, totalPages).map((item, index) => item === "…" ? (
              <span className="training-page-ellipsis" key={`ellipsis-${index}`}>…</span>
            ) : (
              <button
                key={item}
                className={`training-page-number ${(pageInfo?.page ?? page) === item ? "active" : ""}`}
                aria-current={(pageInfo?.page ?? page) === item ? "page" : undefined}
                disabled={loading}
                onClick={() => setPage(item)}
              >{item}</button>
            ))}
            <button className="training-page-direction" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)}>
              Next <span aria-hidden="true">»</span>
            </button>
          </div>
        </div>
      </div>
      {importOpen && (
        <TrainingWorkbookImport onClose={() => setImportOpen(false)} onImported={() => {
          setRefreshKey((value) => value + 1);
          onImported();
        }} />
      )}
    </section>
  );
}
