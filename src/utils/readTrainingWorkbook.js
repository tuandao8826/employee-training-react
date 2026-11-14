const clean = (text) => String(text ?? "").trim().normalize("NFC").replace(/\s+/g, " ");

function cellDate(cell) {
  if (cell.value instanceof Date && Number.isFinite(cell.value.getTime())) {
    const year = cell.value.getUTCFullYear();
    const month = String(cell.value.getUTCMonth() + 1).padStart(2, "0");
    const day = String(cell.value.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  let text = clean(cell.text || (typeof cell.value === "string" ? cell.value : ""));
  if (!text) return null;
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  if (!match) return undefined;
  const [, day, month, year] = match;
  const iso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number(year) < 1900 || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== iso) return undefined;
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

export default async function readTrainingWorkbook(file) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch {
    throw new Error("Không đọc được tệp .xlsx.");
  }
  const sheet = workbook.worksheets.find((item) =>
    clean(item.getCell("B4").text).toLowerCase() === "staff_code" &&
    clean(item.getCell("C4").text).toLowerCase() === "staff_name");
  if (!sheet) throw new Error("Không tìm thấy hàng tiêu đề Staff_Code và Staff_Name ở dòng 4.");

  const subjects = [];
  const lastHeaderColumn = Math.max(sheet.getRow(4).cellCount, sheet.getRow(5).cellCount, sheet.getRow(6).cellCount);
  for (let column = 5; column <= lastHeaderColumn; column += 1) {
    const code = clean(sheet.getCell(4, column).text).toUpperCase();
    const dateHeader = clean(sheet.getCell(6, column).text).toLocaleLowerCase("vi-VN");
    if (!code || dateHeader !== "ngày học") continue;
    const header = clean(sheet.getCell(5, column).text);
    const cycle = parseCycle(header);
    const name = subjectName(header);
    if (!name) throw new Error(`Thiếu tên môn học ở ô ${sheet.getCell(5, column).address}.`);
    if (name.length > 255) throw new Error(`Tên môn học ở ô ${sheet.getCell(5, column).address} dài quá 255 ký tự.`);
    subjects.push({
      column,
      code,
      name,
      // Existing subjects keep the cycle configured in the database; only new subjects need the workbook cycle.
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
    if (number < 7) return;
    const code = clean(row.getCell(2).text).toUpperCase();
    const name = clean(row.getCell(3).text);
    if (!code && !name) return;
    if (!code || !name) throw new Error(`Dòng ${number} cần có cả Staff_Code và Staff_Name.`);
    if (code.length > 30 || name.length > 100) throw new Error(`Dòng ${number}: mã nhân viên tối đa 30 và họ tên tối đa 100 ký tự.`);
    if (codes.has(code)) throw new Error(`STT bị trùng ở dòng ${number}.`);
    codes.add(code);
    employees.push({ code, name });
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
    subjects: subjects.map(({ column, ...subject }) => subject),
    entries,
    issues,
    subjectsUsingDefaultCycle: subjects.filter((subject) => !parseCycle(clean(sheet.getCell(5, subject.column).text))).map(({ code, name }) => ({ code, name })),
  };
}
