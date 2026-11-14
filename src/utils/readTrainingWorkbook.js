const clean = (text) => text.trim().normalize("NFC").replace(/\s+/g, " ");

function cellDate(cell) {
  if (cell.value instanceof Date) return cell.value.toISOString().slice(0, 10);
  let text = clean(cell.text);
  if (!text) return null;
  if (/^\d{1,2}\/\d{4}$/.test(text)) text = `01/${text}`;
  const match = /^(\d{1,2}(?:[,.'/-]+\s*\d{1,2})*)\/{1,2}(\d{1,2})\/(\d{4})$/.exec(text);
  const days = match?.[1].split(/\D+/).map(Number) ?? [];
  const iso = (day) => `${match[3]}-${match[2].padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  if (!match || Number(match[3]) < 1900 || days.some((day) => {
    const date = new Date(`${iso(day)}T00:00:00Z`);
    return !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== iso(day);
  })) return undefined;
  return iso(days.at(-1));
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
    clean(item.getCell("A4").text).toLowerCase() === "stt" &&
    clean(item.getCell("B4").text).toLowerCase() === "họ và tên");
  if (!sheet) throw new Error("Không tìm thấy bảng có STT và Họ và tên ở dòng 4.");

  const subjects = [];
  for (let column = 4; column <= sheet.columnCount; column += 2) {
    const header = clean(sheet.getCell(4, column).text);
    if (!header) continue;
    const cycle = /\b0*(\d+)\s*(năm|tháng|ngày)/iu.exec(header);
    const sms = /^SMS\s*(\d+)$/i.exec(header);
    if (!cycle && !sms) throw new Error(`Thiếu chu kỳ ở ô ${sheet.getCell(4, column).address}.`);
    const name = clean(header.replace(/\([^)]*\d+\s*(?:năm|tháng|ngày)[^)]*\)/giu, "")
      .replace(/\s+0*\d+\s*(?:năm|tháng|ngày)$/iu, ""));
    subjects.push({
      column,
      code: sms ? `DT-SMS${sms[1]}` : `DT-${String(subjects.length + 1).padStart(2, "0")}`,
      name,
      cycleValue: cycle ? Number(cycle[1]) : 3,
      cycleUnit: cycle ? { ngày: 1, tháng: 2, năm: 3 }[cycle[2].toLowerCase()] : 3,
    });
  }
  if (!subjects.length) throw new Error("Không tìm thấy cột môn học.");

  const employees = [];
  const entries = [];
  const issues = [];
  const codes = new Set();
  sheet.eachRow((row, number) => {
    if (number < 6) return;
    const sequence = clean(row.getCell(1).text);
    const name = clean(row.getCell(2).text);
    if (!sequence && !name) return;
    if (!/^\d{1,24}$/.test(sequence) || !name) throw new Error(`Dòng ${number} thiếu STT hoặc họ tên hợp lệ.`);
    const code = `DTNV-${sequence.padStart(3, "0")}`;
    if (codes.has(code)) throw new Error(`STT bị trùng ở dòng ${number}.`);
    codes.add(code);
    employees.push({ code, name });
    for (const subject of subjects) {
      const trainingCell = row.getCell(subject.column);
      const expiryCell = row.getCell(subject.column + 1);
      const trainingDate = cellDate(trainingCell);
      if (trainingDate === null && !clean(expiryCell.text)) continue;
      if (!trainingDate) {
        issues.push({ cell: trainingCell.address, value: trainingCell.text, subject: subject.name });
        continue;
      }
      entries.push({ staffCode: code, subjectCode: subject.code, trainingDate });
    }
  });
  if (!employees.length) throw new Error("Không tìm thấy dòng nhân viên.");
  return { employees, subjects: subjects.map(({ column, ...subject }) => subject), entries, issues };
}
