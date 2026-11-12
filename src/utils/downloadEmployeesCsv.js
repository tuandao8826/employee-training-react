export default function downloadEmployeesCsv(employees) {
  const rows = [
    [
      "Mã nhân viên",
      "Họ và tên",
      "Email",
      "Điện thoại",
      "Phòng ban",
      "Chức vụ",
      "Trạng thái",
      "Ngày vào làm",
    ],
    ...employees.map((e) => [
      e.code,
      e.name,
      e.email,
      e.phone,
      e.department,
      e.role,
      e.status,
      e.joined,
    ]),
  ];
  const csv =
    "\ufeff" +
    rows
      .map((r) =>
        r
          .map((value) => {
            const cell = String(value ?? "");
            const safeCell = /^[\s\uFEFF]*[=+\-@]/.test(cell) ? "'" + cell : cell;
            return '"' + safeCell.replaceAll('"', '""') + '"';
          })
          .join(","),
      )
      .join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
  );
  a.download = "danh-sach-nhan-vien.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}
