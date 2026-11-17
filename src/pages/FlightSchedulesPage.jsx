import React, { useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Plane, Plus, Search, Upload, Pencil, Trash2 } from "lucide-react";
import PageSizeInput from "../components/common/PageSizeInput";
import { Stat } from "../components/common/UI";
import { flightSchedulesApi } from "../services/flightSchedulesApi";

const emptyForm = { flightNumber: "", icaoFlightNumber: "", flightDate: "", route: "", registrationNumber: "", aircraftType: "", flightStatus: "", arrivalFlightNumber: "", departureFlightNumber: "", scheduledArrivalAt: "", scheduledDepartureAt: "", estimatedDepartureAt: "", actualLandingAt: "", actualTakeoffAt: "", arrivalStand: "", departureStand: "", belt: "", arrivalFlightDate: "", departureFlightDate: "", arrivalRouteIcao: "", departureRouteIcao: "", handlingAgent: "", landingRunway: "", takeoffRunway: "", natureOfFlight: "", estimatedInBlockAt: "", estimatedTaxiTime: "", targetOffBlockAt: "", calculatedTakeoffAt: "", targetStartupApprovalAt: "", actualStartupApprovalAt: "", actualGroundHandlingAt: "", actualOffBlockAt: "", actualInBlockAt: "", actualRunwayDepartureAt: "", actualEngineStartAt: "", actualStartupAt: "", targetTaxiTime: "", arrivalGate: "", departureGate: "", estimatedLandingAt: "", actualStartRequestAt: "", sourceRowIndex: "", arrivalIcaoFlightNumber: "", departureIcaoFlightNumber: "", estimatedDepartureAtSource: "", estimatedArrivalAt: "", targetOffBlockCount: "", targetStartupApprovalCount: "" };
const dateTimeFields = [...Object.keys(emptyForm).filter((key) => key.endsWith("At")), "targetTaxiTime", "estimatedDepartureAtSource"];
const fmtDate = (value) => value ? new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(`${value}T00:00:00`)) : "—";
const fmtShortDate = (value) => value ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)) : "—";
const fmtFullDate = (value) => value ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)) : "—";
const fmtFlightDate = (item) => {
  const start = item.arrivalFlightDate || item.flightDate;
  const end = item.departureFlightDate || item.flightDate;
  return start && end && start !== end ? `${fmtShortDate(start)} → ${fmtShortDate(end)}` : fmtShortDate(start || end);
};
const fmtPair = (first, second) => first && second ? `${first}/${second}` : first || second || "–";
const fmtRoute = (value) => value ? value.split("-").filter(Boolean).join(" → ") : "—";
const fmtTime = (value) => value ? new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : "—";
const FLIGHT_HIGHLIGHT_WINDOW_MS = 60 * 60 * 1000;
const isFlightNearNow = (item, now) => [item.scheduledArrivalAt, item.scheduledDepartureAt].some((value) => {
  if (!value) return false;
  const scheduledTime = Date.parse(value);
  return Number.isFinite(scheduledTime) && Math.abs(scheduledTime - now) <= FLIGHT_HIGHLIGHT_WINDOW_MS;
});
const inputTime = (value) => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : "";
const paginationItems = (current, total) => total <= 5 ? Array.from({ length: total }, (_, i) => i + 1) : current <= 3 ? [1, 2, 3, 4, "…", total] : current >= total - 2 ? [1, "…", total - 3, total - 2, total - 1, total] : [1, "…", current - 1, current, current + 1, "…", total];

export default function FlightSchedulesPage({ notify, confirmDelete }) {
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "", searchType: "flight", searchTerm: "" });
  const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(8);
  const [items, setItems] = useState([]); const [pageInfo, setPageInfo] = useState({ totalCount: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const [modal, setModal] = useState(null); const [form, setForm] = useState(emptyForm); const [saving, setSaving] = useState(false);
  const [importFile, setImportFile] = useState(null); const [preview, setPreview] = useState(null); const [importing, setImporting] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [statistics, setStatistics] = useState(null);
  const [statisticsError, setStatisticsError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const updateNow = () => setNow(Date.now());
    const timer = window.setInterval(updateNow, 30_000);
    window.addEventListener("focus", updateNow);
    document.addEventListener("visibilitychange", updateNow);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", updateNow);
      document.removeEventListener("visibilitychange", updateNow);
    };
  }, []);
  useEffect(() => {
    const abort = new AbortController();
    flightSchedulesApi.statistics({ dateFrom: filters.dateFrom, dateTo: filters.dateTo, signal: abort.signal })
      .then((result) => { if (!abort.signal.aborted) { setStatistics(result); setStatisticsError(""); } })
      .catch((e) => { if (!abort.signal.aborted) setStatisticsError(e.message || "Không tải được thống kê lịch bay."); });
    return () => abort.abort();
  }, [refresh, filters.dateFrom, filters.dateTo]);
  useEffect(() => {
    const abort = new AbortController(); const timer = window.setTimeout(() => {
      setLoading(true); setError("");
      flightSchedulesApi.search({ ...filters, page, pageSize, signal: abort.signal }).then((result) => {
        if (abort.signal.aborted) return;
        const last = Math.max(1, result.pageInfo?.totalPages || 1);
        if (page > last) { setPage(last); return; }
        setItems(Array.isArray(result.pageItems) ? result.pageItems : []); setPageInfo(result.pageInfo || { totalCount: 0, totalPages: 1 }); setLoading(false);
      }).catch((e) => { if (!abort.signal.aborted) { setError(e.message || "Không tải được lịch bay."); setLoading(false); } });
    }, 250);
    return () => { window.clearTimeout(timer); abort.abort(); };
  }, [filters, page, pageSize, refresh]);
  const setFilter = (key, value) => { setFilters((old) => ({ ...old, [key]: value })); setPage(1); };
  const openForm = async (record = null) => {
    if (!record) { setForm(emptyForm); setModal("edit"); return; }
    setModal("loading-detail");
    try {
      const detail = await flightSchedulesApi.detail(record.id);
      const next = Object.fromEntries(Object.keys(emptyForm).map((key) => [key, dateTimeFields.includes(key) ? inputTime(detail[key]) : key === "flightDate" || key === "arrivalFlightDate" || key === "departureFlightDate" ? (detail[key] || "").slice(0, 10) : detail[key] ?? ""]));
      setForm({ ...next, id: detail.id }); setModal("edit");
    } catch (e) { setModal(null); notify(e.message || "Không tải được chi tiết lịch bay.", "error"); }
  };
  const save = async (event) => {
    event.preventDefault(); if (saving) return; setSaving(true);
    try {
      const payload = { ...form, flightDate: form.flightDate, ...Object.fromEntries(dateTimeFields.map((key) => [key, form[key] ? new Date(form[key]).toISOString() : null])), ...Object.fromEntries(["arrivalFlightDate", "departureFlightDate"].map((key) => [key, form[key] || null])) };
      await flightSchedulesApi.save(payload); notify(form.id ? "Đã cập nhật lịch bay." : "Đã tạo lịch bay."); setModal(null); setRefresh((x) => x + 1);
    } catch (e) { notify(e.message || "Không lưu được lịch bay.", "error"); } finally { setSaving(false); }
  };
  const remove = async (item) => {
    if (!await confirmDelete({ title: "Xóa lịch bay", message: `Bạn có chắc muốn xóa chuyến ${item.flightNumber} ngày ${fmtDate(item.flightDate)}?` })) return;
    try { await flightSchedulesApi.remove(item.id); notify("Đã xóa lịch bay."); setRefresh((x) => x + 1); } catch (e) { notify(e.message || "Không xóa được lịch bay.", "error"); }
  };
  const getPreview = async () => {
    if (!importFile) return; setImporting(true);
    try { const result = await flightSchedulesApi.importPreview(importFile); setPreview(result.data); } catch (e) { notify(e.message || "Không đọc được file lịch bay.", "error"); } finally { setImporting(false); }
  };
  const commitImport = async () => {
    if (!importFile || importing) return; setImporting(true);
    try { const result = await flightSchedulesApi.import(importFile); const stats = result.data; notify(`Đã nhập lịch bay: ${stats.created} mới, ${stats.updated} cập nhật.`); setModal(null); setImportFile(null); setPreview(null); setPage(1); setRefresh((x) => x + 1); } catch (e) { notify(e.message || "Không nhập được file.", "error"); } finally { setImporting(false); }
  };
  const fields = useMemo(() => [
    ["flightNumber", "Số hiệu chuyến bay", true], ["icaoFlightNumber", "Mã ICAO"], ["flightDate", "Ngày bay", true, "date"], ["route", "Tuyến bay", true], ["registrationNumber", "Số đăng ký"], ["aircraftType", "Loại tàu bay"], ["flightStatus", "Trạng thái"], ["arrivalFlightNumber", "Chuyến bay đến"], ["departureFlightNumber", "Chuyến bay đi"], ["scheduledArrivalAt", "SIBT · Giờ đến dự kiến", false, "datetime-local"], ["scheduledDepartureAt", "SOBT · Giờ đi dự kiến", false, "datetime-local"], ["estimatedDepartureAt", "EOBT · Giờ đi ước tính", false, "datetime-local"], ["actualLandingAt", "ALDT · Giờ hạ cánh thực tế", false, "datetime-local"], ["actualTakeoffAt", "ATOT · Giờ cất cánh thực tế", false, "datetime-local"], ["arrivalStand", "Bến đậu đến"], ["departureStand", "Bến đậu đi"], ["belt", "Băng chuyền"],
    ["arrivalFlightDate", "Ngày chuyến bay đến", false, "date"], ["departureFlightDate", "Ngày chuyến bay đi", false, "date"], ["arrivalRouteIcao", "Mã ICAO tuyến đến"], ["departureRouteIcao", "Mã ICAO tuyến đi"], ["handlingAgent", "Đơn vị phục vụ mặt đất"], ["landingRunway", "Đường băng hạ cánh"], ["takeoffRunway", "Đường băng cất cánh"], ["natureOfFlight", "Loại hình chuyến bay"], ["estimatedInBlockAt", "EIBT · Giờ vào bến ước tính", false, "datetime-local"], ["estimatedTaxiTime", "ETTT · Thời gian lăn ước tính"], ["targetOffBlockAt", "TOBT · Giờ rời bến mục tiêu", false, "datetime-local"], ["calculatedTakeoffAt", "CTOT · Giờ cất cánh tính toán", false, "datetime-local"], ["targetStartupApprovalAt", "TSAT · Giờ cấp phép khởi động", false, "datetime-local"], ["actualStartupApprovalAt", "ASBT · Giờ cấp phép thực tế", false, "datetime-local"], ["actualGroundHandlingAt", "ACGT · Giờ hoàn tất phục vụ", false, "datetime-local"], ["actualOffBlockAt", "AOBT · Giờ rời bến thực tế", false, "datetime-local"], ["actualInBlockAt", "AIBT · Giờ vào bến thực tế", false, "datetime-local"], ["actualRunwayDepartureAt", "ARDT · Giờ rời đường băng", false, "datetime-local"], ["actualEngineStartAt", "AEGT · Giờ nổ máy", false, "datetime-local"], ["actualStartupAt", "ASAT · Giờ khởi động thực tế", false, "datetime-local"], ["targetTaxiTime", "TTOT · Giờ lăn mục tiêu", false, "datetime-local"], ["arrivalGate", "Cửa đến"], ["departureGate", "Cửa đi"], ["estimatedLandingAt", "ELDT · Giờ hạ cánh dự kiến", false, "datetime-local"], ["actualStartRequestAt", "ASRT · Giờ yêu cầu khởi động", false, "datetime-local"], ["sourceRowIndex", "Số dòng dữ liệu nguồn"], ["arrivalIcaoFlightNumber", "Mã ICAO chuyến đến"], ["departureIcaoFlightNumber", "Mã ICAO chuyến đi"], ["estimatedDepartureAtSource", "EOBT1 · Giờ đi dự kiến nguồn", false, "datetime-local"], ["estimatedArrivalAt", "ETA · Giờ đến dự kiến", false, "datetime-local"], ["targetOffBlockCount", "Số lần TOBT"], ["targetStartupApprovalCount", "Số lần TSAT"],
  ], []);
  return <section>
    <div className="page-heading"><div><div className="eyebrow">KHAI THÁC / QUẢN LÝ LỊCH BAY</div><h1>Quản lý lịch bay</h1><p>Tra cứu và quản lý lịch khai thác chuyến bay.</p></div><div className="flight-actions"><button className="btn btn-secondary" onClick={() => { setModal("import"); setImportFile(null); setPreview(null); }}><Upload size={16}/> Nhập file</button><button className="btn btn-primary" onClick={() => openForm()}><Plus size={16}/> Thêm lịch bay</button></div></div>
    <div className="stats-row compact flight-stats">
      {[ ["Tổng số chuyến bay", "totalFlights", Plane, "blue"], ["Tổng số chuyến bay đến", "arrivalFlights", ArrowDownToLine, "green"], ["Tổng số chuyến bay đi", "departureFlights", ArrowUpFromLine, "purple"] ].map(([title, key, icon, tone]) => {
        const isDefaultDate = !filters.dateFrom && !filters.dateTo;
        const scope = statistics ? (isDefaultDate ? "hôm nay" : statistics.dateFrom && statistics.dateTo ? statistics.dateFrom === statistics.dateTo ? fmtFullDate(statistics.dateFrom) : `${fmtFullDate(statistics.dateFrom)} - ${fmtFullDate(statistics.dateTo)}` : statistics.dateFrom ? `Từ ${fmtFullDate(statistics.dateFrom)}` : `Đến ${fmtFullDate(statistics.dateTo)}`) : "đang tải";
        return <Stat key={key} label={title} value={statistics ? statistics[key] : "…"} note={statisticsError || (statistics ? (isDefaultDate ? `Ngày ${fmtFullDate(statistics.dateFrom)}` : `Thời gian: ${scope}`) : "Đang tải thống kê")} icon={icon} tone={tone} />;
      })}
    </div>
    <div className="panel">
      <div className="panel-toolbar flight-toolbar">
        <label className="form-field"><span>Từ ngày</span><input type="date" value={filters.dateFrom} onChange={(e) => setFilter("dateFrom", e.target.value)}/></label>
        <label className="form-field"><span>Đến ngày</span><input type="date" value={filters.dateTo} onChange={(e) => setFilter("dateTo", e.target.value)}/></label>
        <select className="flight-filter-type" aria-label="Chọn tiêu chí tìm kiếm" value={filters.searchType} onChange={(e) => setFilter("searchType", e.target.value)}>
          <option value="flight">Chuyến bay</option><option value="stand">Bến đậu</option><option value="registration">Số đăng ký</option>
        </select>
        <label className="flight-search"><Search size={16}/><input aria-label={`Tìm kiếm theo ${filters.searchType === "flight" ? "chuyến bay" : filters.searchType === "stand" ? "bến đậu" : "số đăng ký"}`} placeholder={filters.searchType === "flight" ? "Nhập số hiệu chuyến bay..." : filters.searchType === "stand" ? "Nhập bến đậu đến hoặc đi..." : "Nhập số đăng ký tàu bay..."} value={filters.searchTerm} onChange={(e) => setFilter("searchTerm", e.target.value)}/></label>
      </div>
      <div className="flight-table-wrap"><table className="flight-table"><thead><tr><th>Chuyến bay</th><th>Đến/Đi</th><th>Ngày</th><th>Chặng bay</th><th>Số đăng bạ</th><th>Loại MB</th><th>Đơn vị PV</th><th>Bến đậu<br/><small>đến/đi</small></th><th>Băng chuyền</th><th>Gate</th><th>Dự kiến vào<br/><small>SIBT</small></th><th>Thực tế vào<br/><small>AIBT</small></th><th>Dự kiến rời<br/><small>SOBT</small></th><th>Thao tác</th></tr></thead><tbody>
        {loading ? <tr><td colSpan="14" className="flight-empty">Đang tải lịch bay…</td></tr> : error ? <tr><td colSpan="14" className="flight-error">{error}</td></tr> : items.length === 0 ? <tr><td colSpan="14" className="flight-empty">Không tìm thấy lịch bay phù hợp.</td></tr> : items.map((item) => <tr key={item.id} className={isFlightNearNow(item, now) ? "flight-near-now" : undefined}><td className="flight-number">{item.flightNumber}</td><td><div className="flight-direction">{item.arrivalFlightNumber && <span className="arrival">ĐẾN</span>}{item.departureFlightNumber && <span className="departure">ĐI</span>}</div></td><td>{fmtFlightDate(item)}</td><td className="flight-route">{fmtRoute(item.route)}</td><td>{item.registrationNumber || "–"}</td><td>{item.aircraftType || "–"}</td><td>{item.handlingAgent || "–"}</td><td>{fmtPair(item.arrivalStand, item.departureStand)}</td><td>{item.belt || "–"}</td><td>{fmtPair(item.arrivalGate, item.departureGate)}</td><td className="flight-time">{fmtTime(item.scheduledArrivalAt)}</td><td className={`flight-time ${item.actualInBlockAt ? "actual" : ""}`}>{fmtTime(item.actualInBlockAt)}</td><td className="flight-time">{fmtTime(item.scheduledDepartureAt)}</td><td><div className="row-actions"><button title="Sửa" onClick={() => openForm(item)}><Pencil size={16}/></button><button title="Xóa" onClick={() => remove(item)}><Trash2 size={16}/></button></div></td></tr>)}
      </tbody></table></div>
      <div className="training-pagination"><PageSizeInput value={pageSize} onChange={(value) => { setPageSize(value); setPage(1); }} disabled={loading}/><span>Tổng {pageInfo.totalCount || 0} lịch bay</span><div className="training-pagination-controls"><button className="training-page-direction" disabled={page <= 1 || loading} onClick={() => setPage((n) => n - 1)}>« Trước</button>{paginationItems(page, pageInfo.totalPages || 1).map((n, i) => n === "…" ? <span key={`ellipsis-${i}`}>…</span> : <button className={`training-page-number ${page === n ? "active" : ""}`} key={n} disabled={loading} onClick={() => setPage(n)}>{n}</button>)}<button className="training-page-direction" disabled={page >= (pageInfo.totalPages || 1) || loading} onClick={() => setPage((n) => n + 1)}>Sau »</button></div></div>
    </div>
    {modal === "loading-detail" && <div className="modal-backdrop"><div className="modal flight-detail-loading">Đang tải thông tin lịch bay…</div></div>}
    {modal === "edit" && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(null); }}><form className="modal modal-flight" onSubmit={save}><div className="modal-head"><div><h2>{form.id ? "Sửa lịch bay" : "Thêm lịch bay"}</h2><p>Nhập thông tin chuyến bay.</p></div><button type="button" className="icon-button" onClick={() => setModal(null)}>×</button></div><div className="modal-body"><div className="form-grid flight-form-grid">{fields.map(([key, label, required, type = "text"]) => <label className="form-field" key={key}><span>{label}{required && <i className="required-mark"> *</i>}</span><input type={type} required={required} value={form[key] || ""} onChange={(e) => setForm((old) => ({ ...old, [key]: e.target.value }))}/></label>)}</div></div><div className="modal-foot"><button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Hủy</button><button className="btn btn-primary" disabled={saving}>{saving ? "Đang lưu…" : "Lưu lịch bay"}</button></div></form></div>}
    {modal === "import" && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(null); }}><div className="modal"><div className="modal-head"><div><h2>Nhập file lịch bay</h2><p>Hỗ trợ định dạng CSV và XLSX, dùng hàng tiêu đề có FlightNo, FlightDate, Route.</p></div><button className="icon-button" onClick={() => setModal(null)}>×</button></div><div className="modal-body"><label className="form-field"><span>Chọn file</span><input type="file" accept=".csv,.xlsx" onChange={(e) => { setImportFile(e.target.files?.[0] || null); setPreview(null); }}/></label>{preview && <div className="flight-import-summary"><b>Đối chiếu dữ liệu ({preview.totalRows} dòng)</b><span>{preview.created} chuyến mới</span><span>{preview.updated} chuyến cập nhật</span><span>{preview.unchanged} chuyến không thay đổi</span>{preview.errors?.map((x) => <small key={x}>{x}</small>)}</div>}</div><div className="modal-foot"><button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Hủy</button><button type="button" className="btn btn-secondary" disabled={!importFile || importing} onClick={getPreview}>{importing ? "Đang đọc…" : "Xem trước"}</button>{preview && <button type="button" className="btn btn-primary" disabled={importing} onClick={commitImport}>{importing ? "Đang nhập…" : "Xác nhận nhập"}</button>}</div></div></div>}
  </section>;
}
