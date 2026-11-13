import { employeeExcelColumns } from "./employeeExcelColumns";

const normalize = (value) => value.trim().normalize("NFC").toLowerCase();
const statuses = ["Đang làm việc", "Tạm nghỉ"];

function readCell(cell) {
  const { value } = cell;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number" && /^0+$/.test(cell.numFmt ?? "")) {
    return String(value).padStart(cell.numFmt.length, "0");
  }
  return cell.text.trim();
}

function toIsoDate(text) {
  const parts = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  const iso = parts
    ? `${parts[3]}-${parts[2].padStart(2, "0")}-${parts[1].padStart(2, "0")}`
    : text;
  if (!/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const date = new Date(`${iso}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === iso ? iso : null;
}

export default async function readEmployeesExcel(file, employees) {
  if (!/\.xlsx$/i.test(file.name)) throw new Error("Vui lòng chọn tệp .xlsx.");
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch {
    throw new Error("Không đọc được tệp Excel. Vui lòng kiểm tra tệp hoặc dùng mẫu.");
  }

  const sheet = workbook.getWorksheet("Nhân viên") ?? workbook.worksheets[0];
  if (!sheet) throw new Error("Tệp Excel không có trang tính.");

  const headers = new Map();
  const duplicates = new Set();
  sheet.getRow(1).eachCell((cell, index) => {
    const header = normalize(cell.text);
    if (headers.has(header)) duplicates.add(header);
    headers.set(header, index);
  });
  const columns = employeeExcelColumns.map((column) => ({
    ...column,
    index: headers.get(normalize(column.header)),
  }));
  const invalidHeaders = columns.filter(({ header, index }) => !index || duplicates.has(normalize(header)));
  if (invalidHeaders.length) {
    throw new Error(`Tiêu đề cột thiếu hoặc bị lặp: ${invalidHeaders.map(({ header }) => header).join(", ")}.`);
  }

  const existingCodes = new Set(employees.map(({ code }) => normalize(code)));
  const rowsByCode = new Map();
  const rows = [];
  sheet.eachRow((row, number) => {
    if (number === 1) return;
    const fields = {};
    const errors = [];
    let hasData = false;

    for (const { key, header, index, required, maxLength } of columns) {
      const cell = row.getCell(index);
      const isFormula = cell.type === ExcelJS.ValueType.Formula;
      const invalidType = isFormula || cell.type === ExcelJS.ValueType.Error || cell.type === ExcelJS.ValueType.Boolean;
      const text = invalidType ? "" : readCell(cell);
      hasData ||= Boolean(text) || invalidType;
      fields[key] = text;
      if (invalidType) errors.push(`${header} phải là giá trị, không dùng công thức hoặc ô lỗi.`);
      else if (required && !text) errors.push(`${header} là bắt buộc.`);
      else if (maxLength && text.length > maxLength) errors.push(`${header} tối đa ${maxLength} ký tự.`);
    }

    if (!hasData) return;
    if (fields.email && !/^[^@\s]+@[^@\s]+$/.test(fields.email)) errors.push("Email không hợp lệ.");
    const status = statuses.find((label) => normalize(label) === normalize(fields.status));
    if (fields.status && !status) errors.push("Trạng thái phải là Đang làm việc hoặc Tạm nghỉ.");
    const joinedOn = fields.joined ? toIsoDate(fields.joined) : "";
    if (joinedOn === null) errors.push("Ngày vào làm không hợp lệ. Dùng dd/mm/yyyy hoặc ô ngày của Excel.");

    const code = normalize(fields.code);
    if (code && existingCodes.has(code)) errors.push("Mã nhân viên đã tồn tại.");
    if (code) {
      const matches = rowsByCode.get(code) ?? [];
      matches.push(errors);
      rowsByCode.set(code, matches);
    }

    rows.push({
      number,
      errors,
      employee: { ...fields, status: status ?? statuses[0], joinedOn },
    });
  });

  for (const matches of rowsByCode.values()) {
    if (matches.length > 1) {
      for (const errors of matches) errors.push("Mã nhân viên bị lặp trong tệp.");
    }
  }

  if (!rows.length) throw new Error("Tệp không có dòng nhân viên để nhập.");
  return rows;
}
