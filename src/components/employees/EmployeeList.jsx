import React, { useState } from "react";
import {
  Users,
  CheckCircle2,
  Clock3,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { Stat, Status, Empty } from "../common/UI";
import { avatarTone, initials } from "../../utils/helpers";
import downloadEmployeesExcel from "../../utils/downloadEmployeesExcel";
import { staffApi } from "../../services/staffApi";
import PageSizeInput from "../common/PageSizeInput";

function paginationItems(currentPage, totalPages) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (currentPage <= 3) return [1, 2, 3, 4, "…", totalPages];
  if (currentPage >= totalPages - 2) return [1, "…", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, "…", currentPage - 1, currentPage, currentPage + 1, "…", totalPages];
}

export default function EmployeeList({
  employees,
  query,
  setQuery,
  filter,
  setFilter,
  openEmployee,
  openImport,
  viewEmployee,
  removeEmployee,
  notify,
  busy,
  page,
  setPage,
  pageSize,
  setPageSize,
  totalCount,
  totalPages,
  loading,
}) {
  const [exporting, setExporting] = useState(false);
  const currentPage = page;

  const exportEmployees = async () => {
    setExporting(true);
    try {
      const allEmployees = await staffApi.list(undefined, query, filter);
      await downloadEmployeesExcel(allEmployees);
      notify("Đã xuất danh sách Excel");
    } catch {
      notify("Không thể xuất danh sách Excel. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <section>
      <div className="page-heading">
        <div>
          <div className="eyebrow">NHÂN SỰ / DANH SÁCH</div>
          <h1>Quản lý nhân viên</h1>
        </div>
        <div className="heading-actions">
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={openImport}>
            <Upload size={16} aria-hidden="true" /> Nhập Excel
          </button>
          <button
            className="btn btn-secondary"
            disabled={exporting || !totalCount}
            onClick={exportEmployees}
          >
            <Download size={16} /> {exporting ? "Đang xuất…" : "Xuất Excel"}
          </button>
          <button
            className="btn btn-primary"
            disabled={busy}
            onClick={() => openEmployee()}
          >
            <Plus size={17} /> Thêm nhân viên
          </button>
        </div>
      </div>
      <div className="stats-row compact">
        <Stat
          label="Tổng nhân viên"
          value={totalCount}
          note="Theo kết quả tìm kiếm"
          icon={Users}
          tone="blue"
        />
        <Stat
          label="Đang làm việc"
          value={employees.filter((e) => e.status === "Đang làm việc").length}
          note="Trong trang hiện tại"
          icon={CheckCircle2}
          tone="green"
        />
        <Stat
          label="Tạm nghỉ"
          value={employees.filter((e) => e.status === "Tạm nghỉ").length}
          note="Trong trang hiện tại"
          icon={Clock3}
          tone="orange"
        />
      </div>
      <div className="panel">
        <div className="panel-toolbar">
          <div className="search-box">
            <Search size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên, mã nhân viên, email..."
            />
          </div>
          <div className="toolbar-right">
            <div className="select-wrap">
              <Filter size={15} />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option>Tất cả</option>
                <option>Đang làm việc</option>
                <option>Tạm nghỉ</option>
              </select>
            </div>
            <span className="result-count">
              {totalCount} nhân viên
            </span>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>STT</th>
                <th>NHÂN VIÊN</th>
                <th>MÃ NHÂN VIÊN</th>
                <th>PHÒNG BAN</th>
                <th>CHỨC VỤ</th>
                <th>TRẠNG THÁI</th>
                <th>NGÀY VÀO LÀM</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee, index) => (
                <tr key={employee.id}>
                  <td>{(currentPage - 1) * pageSize + index + 1}</td>
                  <td>
                    <div className="person-cell">
                      <div
                        className={`avatar ${avatarTone(parseInt(employee.id.slice(0, 8), 16))}`}
                      >
                        {initials(employee.name)}
                      </div>
                      <div>
                        <b>{employee.name}</b>
                        <small>{employee.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="code">{employee.code}</span>
                  </td>
                  <td>{employee.department}</td>
                  <td>{employee.role}</td>
                  <td>
                    <Status value={employee.status} />
                  </td>
                  <td>{employee.joined}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        title="Xem hồ sơ"
                        aria-label={`Xem hồ sơ ${employee.name}`}
                        disabled={busy}
                        onClick={() => viewEmployee(employee)}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        title="Sửa"
                        aria-label={`Sửa ${employee.name}`}
                        disabled={busy}
                        onClick={() => openEmployee(employee)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        title="Xóa"
                        aria-label={`Xóa ${employee.name}`}
                        disabled={busy}
                        onClick={() => removeEmployee(employee.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading ? <Empty title="Đang tải danh sách nhân viên…" /> : totalCount === 0 &&
            (query || filter !== "Tất cả" ? (
              <Empty
                title="Không tìm thấy nhân viên"
                text="Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc."
              />
            ) : (
              <Empty
                title="Chưa có nhân viên"
                text="Chọn Thêm nhân viên để tạo hồ sơ đầu tiên."
              />
            ))}
        </div>
        <div className="training-pagination employee-pagination">
          <PageSizeInput value={pageSize} onChange={setPageSize} disabled={loading} />
          <div className="training-pagination-controls" aria-label="Phân trang danh sách nhân viên">
            <button className="training-page-direction" disabled={currentPage <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>
              <span aria-hidden="true">«</span> Previous
            </button>
            {paginationItems(currentPage, totalPages).map((item, index) => item === "…" ? (
              <span className="training-page-ellipsis" key={`ellipsis-${index}`}>…</span>
            ) : (
              <button
                key={item}
                className={`training-page-number ${currentPage === item ? "active" : ""}`}
                aria-current={currentPage === item ? "page" : undefined}
                disabled={loading}
                onClick={() => setPage(item)}
              >{item}</button>
            ))}
            <button className="training-page-direction" disabled={currentPage >= totalPages || loading} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
              Next <span aria-hidden="true">»</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
