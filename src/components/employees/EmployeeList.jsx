import React from "react";
import {
  Users,
  CheckCircle2,
  Clock3,
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { Stat, Status, Empty } from "../common/UI";
import { avatarTone, initials } from "../../utils/helpers";
import downloadEmployeesCsv from "../../utils/downloadEmployeesCsv";

export default function EmployeeList({
  employees,
  query,
  setQuery,
  filter,
  setFilter,
  openEmployee,
  viewEmployee,
  removeEmployee,
  notify,
  busy,
}) {
  const search = query.toLowerCase();
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch = [
      employee.name,
      employee.code,
      employee.email,
      employee.department,
    ].some((value) => value.toLowerCase().includes(search));
    return matchesSearch && (filter === "Tất cả" || employee.status === filter);
  });

  const exportEmployees = () => {
    downloadEmployeesCsv(filteredEmployees);
    notify("Đã xuất danh sách CSV");
  };

  return (
    <section>
      <div className="page-heading">
        <div>
          <div className="eyebrow">NHÂN SỰ / DANH SÁCH</div>
          <h1>Quản lý nhân viên</h1>
        </div>
        <div className="heading-actions">
          <button
            className="btn btn-secondary"
            disabled={!filteredEmployees.length}
            onClick={exportEmployees}
          >
            <Download size={16} /> Xuất CSV
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
          value={employees.length}
          note="Hồ sơ trong hệ thống"
          icon={Users}
          tone="blue"
        />
        <Stat
          label="Đang làm việc"
          value={employees.filter((e) => e.status === "Đang làm việc").length}
          note="Nhân sự hiện tại"
          icon={CheckCircle2}
          tone="green"
        />
        <Stat
          label="Tạm nghỉ"
          value={employees.filter((e) => e.status === "Tạm nghỉ").length}
          note="Cần theo dõi"
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
              {filteredEmployees.length} nhân viên
            </span>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
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
              {filteredEmployees.map((employee) => (
                <tr key={employee.id}>
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
          {filteredEmployees.length === 0 &&
            (employees.length === 0 ? (
              <Empty
                title="Chưa có nhân viên"
                text="Chọn Thêm nhân viên để tạo hồ sơ đầu tiên."
              />
            ) : (
              <Empty
                title="Không tìm thấy nhân viên"
                text="Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc."
              />
            ))}
        </div>
        <div className="table-footer">
          <span>
            Hiển thị <b>{filteredEmployees.length}</b> trên{" "}
            <b>{employees.length}</b> nhân viên
          </span>
        </div>
      </div>
    </section>
  );
}
