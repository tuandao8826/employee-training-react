const clean = (text) => String(text ?? "").trim().normalize("NFC").replace(/\s+/g, " ");
const metadataHeaders = new Set(["stt", "staff_code", "staff_name", "birthday"]);

function cellDate(cell) {
  const value = cell.result ?? cell.value;
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) && value.getUTCFullYear() >= 1900
      ? value.toISOString().slice(0, 10)
      : undefined;
  }
  const text = clean(cell.text);
  if (!text) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  const local = /^(?:(\d{1,2}(?:\s*[,-]\s*\d{1,2})*)\/)?(\d{1,2})\/(\d{4})$/.exec(text);
  if (iso) return validDate(iso[1], iso[2], iso[3]);
  if (!local) return undefined;
  const [, days, month, year] = local;
  const parsed = (days?.split(/\s*[,-]\s*/) ?? ["1"]).map((day) => validDate(year, month, day));
  return parsed.every(Boolean) ? parsed.at(-1) : undefined;
}

function validDate(year, month, day) {
  const iso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number(year) >= 1900 && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === iso)
    return iso;
}

function parseCycle(header) {
  const match = /\b0*(\d+)\s*(năm|tháng|ngày)\b/iu.exec(header);
  if (!match) return null;
  return {
    cycleValue: Number(match[1]),
    cycleUnit: { ngày: 1, tháng: 2, năm: 3 }[match[2].toLocaleLowerCase("vi-VN")],
  };
}

function subjectName(header) {
  return clean(header
    .replace(/\([^)]*\d+\s*(?:năm|tháng|ngày)[^)]*\)/giu, "")
    .replace(/\b\d+\s*(?:năm|tháng|ngày)\b/giu, ""));
}

function findHeader(workbook) {
  for (const sheet of workbook.worksheets) {
    let header;
    sheet.eachRow((row) => {
      if (header) return;
      const columns = new Map();
      row.eachCell((cell, column) => {
        if (cell.isMerged && cell.master !== cell) return;
        const label = clean(cell.text).toLowerCase();
        if (label) columns.set(label, [...(columns.get(label) ?? []), column]);
      });
      if (columns.has("staff_code") && columns.has("staff_name")) header = { row, columns };
    });
    if (header) return { sheet, ...header };
  }
  throw new Error("Không tìm thấy dòng tiêu đề chứa Staff_Code và Staff_Name.");
}

export default async function readTrainingWorkbook(file) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch {
    throw new Error("Không đọc được tệp .xlsx.");
  }
  const { sheet, row: header, columns } = findHeader(workbook);
  const [codeColumn] = columns.get("staff_code");
  const [nameColumn] = columns.get("staff_name");
  const [sttColumn] = columns.get("stt") ?? [];
  const hasSubjectNames = clean(sheet.getCell(header.number + 1, nameColumn).text).toLowerCase() === "họ và tên";
  const dateHeaderRow = hasSubjectNames ? header.number + 2 : header.number + 1;
  const dateLabel = /^(ngày học|ngày hết hạn|hết hạn)$/iu;
  const hasDateLabels = [...columns].some(([label, [column]]) =>
    !metadataHeaders.has(label) && [column, column + 1].some((position) =>
      dateLabel.test(clean(sheet.getCell(dateHeaderRow, position).text))));
  const firstDataRow = dateHeaderRow + Number(hasDateLabels);
  const subjects = [];
  for (const [label, positions] of columns) {
    const [column] = positions;
    if (positions.length > 1) throw new Error(`Tiêu đề "${label}" bị trùng ở dòng ${header.number}.`);
    if (metadataHeaders.has(label)) continue;
    const code = clean(header.getCell(column).text).toUpperCase();
    const description = hasSubjectNames ? clean(sheet.getCell(header.number + 1, column).text) : "";
    const cycle = parseCycle(description);
    const name = subjectName(description) || code;
    if (code.length > 50 || name.length > 255)
      throw new Error(`Mã hoặc tên môn học tại cột ${header.getCell(column).address} vượt độ dài cho phép.`);
    subjects.push({
      column,
      code,
      name,
      usesDefaultCycle: !cycle,
      cycleValue: cycle?.cycleValue ?? 1,
      cycleUnit: cycle?.cycleUnit ?? 3,
    });
  }
  if (!subjects.length) throw new Error("Không tìm thấy cột môn học.");

  const employees = [];
  const entries = [];
  const issues = [];
  const codes = new Set();
  sheet.eachRow((row, number) => {
    if (number < firstDataRow) return;
    let code = clean(row.getCell(codeColumn).text).toUpperCase();
    const name = clean(row.getCell(nameColumn).text);
    const stt = sttColumn ? clean(row.getCell(sttColumn).text) : "";
    if (!code && !name && !stt) return;
    if (!name) throw new Error(`Dòng ${number} thiếu Staff_Name.`);
    const usesTemporaryCode = !code;
    if (usesTemporaryCode) {
      const sequence = stt.replace(/^0+/, "");
      if (!/^\d+$/.test(sequence)) throw new Error(`Dòng ${number} cần Staff_Code hoặc STT là số nguyên dương.`);
      code = `DTNV-${sequence.padStart(3, "0")}`;
    }
    if (code.length > 30 || name.length > 100) throw new Error(`Dòng ${number}: mã nhân viên tối đa 30 và họ tên tối đa 100 ký tự.`);
    if (codes.has(code)) throw new Error(`Mã nhân viên ${code} bị trùng ở dòng ${number}.`);
    codes.add(code);
    employees.push({ code, name, usesTemporaryCode });
    for (const subject of subjects) {
      const trainingCell = row.getCell(subject.column);
      const trainingDate = cellDate(trainingCell);
      if (trainingDate === null) continue;
      if (!trainingDate) {
        issues.push({ cell: trainingCell.address, value: clean(trainingCell.text), subject: subject.name, staffCode: code });
        continue;
      }
      entries.push({ staffCode: code, subjectCode: subject.code, trainingDate });
    }
  });
  if (!employees.length) throw new Error("Không tìm thấy dòng nhân viên.");
  return {
    employees,
    subjects: subjects.map(({ column, usesDefaultCycle, ...subject }) => subject),
    entries,
    issues,
    subjectsUsingDefaultCycle: subjects.filter((subject) => subject.usesDefaultCycle).map(({ code }) => code),
  };
}
