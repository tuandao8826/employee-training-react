import { employeeExcelColumns as columns } from "./employeeExcelColumns";

const maxColumnWidth = 64;
const bodyFont = "11pt Calibri, Arial, sans-serif";

function countWrappedLines(text, availableWidth, measure) {
  return text.split(/\r\n|[\r\n]/).reduce((total, line) => {
    let lines = 1;
    let usedWidth = 0;

    for (const word of line.match(/\S+\s*|\s+/g) ?? []) {
      const width = measure(word);
      if (usedWidth > 0 && usedWidth + width > availableWidth) {
        lines += 1;
        usedWidth = 0;
      }

      // Excel also wraps long, unbroken values such as email addresses.
      const fullLines = Math.max(0, Math.ceil(width / availableWidth) - 1);
      lines += fullLines;
      usedWidth += width - fullLines * availableWidth;
    }

    return total + lines;
  }, 0);
}

export default async function downloadEmployeesExcel(employees, filename = "danh-sach-nhan-vien.xlsx") {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Nhân viên");
  const context = document.createElement("canvas").getContext("2d");
  const measure = (text) => context.measureText(text).width;

  context.font = bodyFont;
  const digitWidth = measure("0");
  const rows = employees.map((employee) =>
    columns.map(({ key }) => String(employee[key] ?? "")),
  );

  sheet.columns = columns.map(({ header }, index) => {
    context.font = `bold ${bodyFont}`;
    let widest = measure(header);
    context.font = bodyFont;
    for (const row of rows) {
      for (const line of row[index].split(/\r\n|[\r\n]/)) {
        widest = Math.max(widest, measure(line));
      }
    }

    return {
      header,
      width: Math.min(maxColumnWidth, Math.max(12, Math.ceil(widest / digitWidth) + 3)),
      style: {
        numFmt: "@",
        font: { name: "Calibri", size: 11 },
        alignment: { vertical: "middle", wrapText: true },
      },
    };
  });
  sheet.getRow(1).font = { name: "Calibri", size: 11, bold: true };
  sheet.getRow(1).height = 22;

  for (const values of rows) {
    const row = sheet.addRow(values);
    const lines = values.reduce((max, value, index) => {
      const width = (sheet.getColumn(index + 1).width - 2) * digitWidth;
      return Math.max(max, countWrappedLines(value, width, measure));
    }, 1);
    row.height = Math.min(409, 18 * lines + 4);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
