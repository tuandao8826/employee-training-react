import React, { useEffect, useRef, useState } from "react";
import { Download, X } from "lucide-react";
import { staffApi, staffError } from "../../services/staffApi";
import downloadEmployeesExcel from "../../utils/downloadEmployeesExcel";
import { employeeExcelColumns } from "../../utils/employeeExcelColumns";
import readEmployeesExcel from "../../utils/readEmployeesExcel";

export default function EmployeeImport({ employees, onClose, onImported, notify }) {
  const [rows, setRows] = useState([]);
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const [imported, setImported] = useState(false);
  const controller = useRef(null);

  useEffect(() => () => controller.current?.abort(), []);

  const validRows = rows.filter((row) => !row.errors.length);

  const chooseFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = "";

    setWorking(true);
    setFilename(file.name);
    setError("");
    setRows([]);
    setImported(false);
    try {
      setRows(await readEmployeesExcel(file, employees));
    } catch (error) {
      setError(error.message);
    } finally {
      setWorking(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      await downloadEmployeesExcel([], "mau-nhap-nhan-vien.xlsx");
    } catch {
      setError("Không tải được mẫu Excel. Vui lòng thử lại.");
    }
  };

  const importEmployees = async () => {
    if (working || imported || !validRows.length) return;

    const request = new AbortController();
    controller.current = request;
    setWorking(true);
    setError("");
    const outcomes = new Map();

    for (const { number, employee } of validRows) {
      if (request.signal.aborted) return;
      try {
        const saved = await staffApi.save(employee, request.signal);
        if (request.signal.aborted) return;
        onImported(saved);
        outcomes.set(number, { saved: true });
      } catch (error) {
        if (request.signal.aborted) return;
        outcomes.set(number, {
          errors: [staffError(error, "Không xác nhận được kết quả lưu. Hãy kiểm tra danh sách trước khi thử lại.")],
        });
        if (!error.status || ![400, 409].includes(error.status)) break;
      }
    }

    setRows((current) => current.map((row) => {
      if (row.errors.length) return row;
      return { ...row, ...(outcomes.get(row.number) ?? { errors: ["Chưa gửi do quá trình nhập bị gián đoạn."] }) };
    }));
    const savedCount = [...outcomes.values()].filter((result) => result.saved).length;
    notify(`Đã nhập ${savedCount}/${validRows.length} nhân viên hợp lệ.`);
    setImported(true);
    setWorking(false);
  };

  return (
    <div className="modal-backdrop">
      <section className="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="employee-import-heading">
        <div className="modal-head">
          <h2 id="employee-import-heading">Nhập nhân viên từ Excel</h2>
          <button type="button" className="icon-button" aria-label="Đóng" disabled={working} onClick={onClose}>
            <X size={19} />
          </button>
        </div>
        <div className="modal-body" aria-busy={working}>
          <label className="form-field">
            <span>Tệp nhân viên (.xlsx)</span>
            <input type="file" accept=".xlsx" disabled={working} onChange={chooseFile} />
          </label>
          {filename && <p>{filename}</p>}
          <button type="button" className="btn btn-secondary btn-small" disabled={working} onClick={downloadTemplate}>
            <Download size={15} aria-hidden="true" /> Tải mẫu Excel
          </button>
          {error && <p className="error" role="alert">{error}</p>}
          {rows.length > 0 && (
            <>
              <p role="status">
                {imported
                  ? `Đã lưu ${rows.filter((row) => row.saved).length}/${rows.length} dòng.`
                  : `${validRows.length}/${rows.length} dòng hợp lệ. Mã đã tồn tại sẽ được bỏ qua.`}
              </p>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Dòng Excel</th>
                      {employeeExcelColumns.map(({ key, header }) => <th key={key}>{header}</th>)}
                      <th>Kết quả kiểm tra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ number, employee, errors, saved }) => (
                      <tr key={number}>
                        <td>{number}</td>
                        {employeeExcelColumns.map(({ key }) => <td key={key}>{employee[key]}</td>)}
                        <td>{saved ? "Đã lưu" : errors.join(" ") || "Hợp lệ"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-secondary" disabled={working} onClick={onClose}>Đóng</button>
          <button type="button" className="btn btn-primary" disabled={working || imported || !validRows.length} onClick={importEmployees}>
            {working ? "Đang xử lý…" : imported ? "Đã xử lý tệp" : `Nhập ${validRows.length} dòng hợp lệ`}
          </button>
        </div>
      </section>
    </div>
  );
}
