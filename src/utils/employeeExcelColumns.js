export const employeeExcelColumns = [
  { key: "code", header: "Mã nhân viên", maxLength: 30, required: true },
  { key: "name", header: "Họ và tên", maxLength: 100, required: true },
  { key: "email", header: "Email", maxLength: 254 },
  { key: "phone", header: "Điện thoại", maxLength: 30 },
  { key: "department", header: "Phòng ban", maxLength: 100 },
  { key: "role", header: "Chức vụ", maxLength: 100 },
  { key: "status", header: "Trạng thái" },
  { key: "joined", header: "Ngày vào làm" },
];
