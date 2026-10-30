export const initialEmployees = [
  { id: 1, code: 'NV001', name: 'Nguyễn Minh Anh', email: 'minhanh@company.vn', phone: '0901 234 567', department: 'Vận hành', role: 'Nhân viên', status: 'Đang làm việc', joined: '12/03/2024' },
  { id: 2, code: 'NV002', name: 'Trần Quốc Bảo', email: 'quocbao@company.vn', phone: '0902 345 678', department: 'Kỹ thuật', role: 'Tổ trưởng', status: 'Đang làm việc', joined: '05/06/2023' },
  { id: 3, code: 'NV003', name: 'Lê Thu Hà', email: 'thuha@company.vn', phone: '0903 456 789', department: 'Nhân sự', role: 'Chuyên viên', status: 'Đang làm việc', joined: '21/08/2024' },
  { id: 4, code: 'NV004', name: 'Phạm Hoàng Nam', email: 'hoangnam@company.vn', phone: '0904 567 890', department: 'Vận hành', role: 'Nhân viên', status: 'Tạm nghỉ', joined: '17/01/2022' },
  { id: 5, code: 'NV005', name: 'Võ Khánh Linh', email: 'khanhlinh@company.vn', phone: '0905 678 901', department: 'An toàn', role: 'Chuyên viên', status: 'Đang làm việc', joined: '02/11/2023' },
  { id: 6, code: 'NV006', name: 'Đặng Gia Huy', email: 'giahuy@company.vn', phone: '0906 789 012', department: 'Kỹ thuật', role: 'Nhân viên', status: 'Đang làm việc', joined: '14/04/2025' },
];
export const initialSubjects = [
  { id: 1, code: 'MH001', name: 'An toàn lao động', category: 'Bắt buộc', duration: 4, description: 'Quy định an toàn và xử lý rủi ro tại nơi làm việc.' },
  { id: 2, code: 'MH002', name: 'Quy trình vận hành thiết bị', category: 'Chuyên môn', duration: 8, description: 'Kiến thức và quy trình vận hành thiết bị kỹ thuật.' },
  { id: 3, code: 'MH003', name: 'Phòng cháy chữa cháy', category: 'Bắt buộc', duration: 4, description: 'Nhận diện nguy cơ và thực hành ứng phó sự cố.' },
  { id: 4, code: 'MH004', name: 'Kỹ năng giao tiếp', category: 'Kỹ năng mềm', duration: 3, description: 'Giao tiếp và phối hợp công việc hiệu quả.' },
];
export const initialCourses = [
  { id: 1, code: 'KH2026-01', name: 'Đào tạo an toàn lao động Q4', subjectId: 1, start: '15/10/2026', end: '16/10/2026', instructor: 'Nguyễn Hoàng Long', status: 'Đang diễn ra', participantIds: [1,2,3,4], progress: {1:'Hoàn thành',2:'Đang học',3:'Chưa bắt đầu',4:'Hoàn thành'} },
  { id: 2, code: 'KH2026-02', name: 'Vận hành thiết bị cơ bản', subjectId: 2, start: '20/10/2026', end: '22/10/2026', instructor: 'Trần Quốc Bảo', status: 'Sắp diễn ra', participantIds: [1,2,6], progress: {1:'Chưa bắt đầu',2:'Chưa bắt đầu',6:'Chưa bắt đầu'} },
  { id: 3, code: 'KH2026-03', name: 'Đào tạo PCCC định kỳ', subjectId: 3, start: '05/10/2026', end: '05/10/2026', instructor: 'Lê Thanh Tùng', status: 'Đã kết thúc', participantIds: [3,4,5,6], progress: {3:'Hoàn thành',4:'Hoàn thành',5:'Hoàn thành',6:'Đang học'} },
];
