import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LayoutDashboard, Users, GraduationCap, BookOpen, CalendarDays, Bell, ChevronDown, MoreHorizontal, ArrowUpRight, CheckCircle2, FileText, Settings, X, Menu, ChevronRight, ChartNoAxesCombined } from 'lucide-react';
import { initialEmployees, initialSubjects, initialCourses } from './data/initialData';
import { readStore, persist } from './utils/helpers';
import Dashboard from './features/dashboard/Dashboard';
import EmployeesPage from './features/employees/EmployeesPage';
import SubjectsPage from './features/subjects/SubjectsPage';
import CoursesPage from './features/courses/CoursesPage';
import EditModal from './components/modals/EditModal';
import './styles.css';

function App() {
  const [employees, setEmployees] = useState(() => readStore('ph-employees', initialEmployees));
  const [subjects, setSubjects] = useState(() => readStore('ph-subjects', initialSubjects));
  const [courses, setCourses] = useState(() => readStore('ph-courses', initialCourses));
  const [page, setPage] = useState('dashboard');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Tất cả');
  const [modal, setModal] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState('');
  const saveEmployees = v => { setEmployees(v); persist('ph-employees', v); };
  const saveSubjects = v => { setSubjects(v); persist('ph-subjects', v); };
  const saveCourses = v => { setCourses(v); persist('ph-courses', v); };
  const notify = msg => { setToast(msg); setTimeout(() => setToast(''), 2600); };
  const nav = [
    { label:'TỔNG QUAN', items:[['dashboard','Tổng quan',LayoutDashboard]] },
    { label:'NHÂN SỰ', items:[['employees','Quản lý nhân viên',Users]] },
    { label:'ĐÀO TẠO', items:[['subjects','Quản lý môn học',BookOpen],['courses','Quản lý khóa học',GraduationCap]] },
  ];
  const title = ({dashboard:'Tổng quan',employees:'Quản lý nhân viên',subjects:'Quản lý môn học',courses:'Quản lý khóa học'})[page];
  const filteredEmployees = useMemo(() => employees.filter(e => {
    const q = query.toLowerCase();
    const matches = [e.name,e.code,e.email,e.department].some(x => x.toLowerCase().includes(q));
    return matches && (filter === 'Tất cả' || e.status === filter);
  }), [employees, query, filter]);
  const allParticipants = courses.reduce((n,c)=>n+c.participantIds.length,0);
  const completionCount = courses.reduce((n,c)=>n+Object.values(c.progress).filter(s=>s==='Hoàn thành').length,0);
  const completionRate = allParticipants ? Math.round(completionCount/allParticipants*100) : 0;

  const openEmployee = employee => setModal({ type:'employee', data: employee || null });
  const openSubject = subject => setModal({ type:'subject', data: subject || null });
  const openCourse = course => setModal({ type:'course', data: course || null });
  const removeEmployee = id => {
    if (!confirm('Bạn có chắc muốn xóa nhân viên này?')) return;
    saveEmployees(employees.filter(e=>e.id!==id));
    saveCourses(courses.map(c=>({...c, participantIds:c.participantIds.filter(x=>x!==id), progress:Object.fromEntries(Object.entries(c.progress).filter(([k])=>Number(k)!==id))})));
    notify('Đã xóa nhân viên');
  };
  const removeSubject = id => {
    if (courses.some(c=>c.subjectId===id)) { notify('Môn học đang được sử dụng trong khóa học'); return; }
    if (!confirm('Xóa môn học này?')) return;
    saveSubjects(subjects.filter(s=>s.id!==id)); notify('Đã xóa môn học');
  };
  const removeCourse = id => {
    if (!confirm('Xóa khóa học này?')) return;
    saveCourses(courses.filter(c=>c.id!==id)); notify('Đã xóa khóa học');
  };
  const exportEmployees = () => {
    const rows = [['Mã nhân viên','Họ và tên','Email','Điện thoại','Phòng ban','Chức vụ','Trạng thái'], ...filteredEmployees.map(e=>[e.code,e.name,e.email,e.phone,e.department,e.role,e.status])];
    const csv = '\ufeff' + rows.map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\n');
    const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})); a.download='danh-sach-nhan-vien.csv'; a.click(); URL.revokeObjectURL(a.href);
    notify('Đã xuất danh sách CSV');
  };

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav?'open':''}`}>
      <div className="brand"><div className="brand-mark"><ChartNoAxesCombined size={22}/></div><div><strong>PeopleHub</strong><span>HR & TRAINING</span></div><button className="mobile-close" onClick={()=>setMobileNav(false)}><X size={18}/></button></div>
      <div className="workspace"><div className="workspace-logo">AC</div><div><b>Acme Corporation</b><small>Không gian làm việc</small></div><ChevronDown size={15}/></div>
      <nav>{nav.map(group=><div className="nav-group" key={group.label}><div className="nav-label">{group.label}</div>{group.items.map(([id,label,Icon])=><button key={id} className={`nav-item ${page===id?'active':''}`} onClick={()=>{setPage(id);setQuery('');setFilter('Tất cả');setMobileNav(false)}}><Icon size={18}/><span>{label}</span>{id==='courses'&&<span className="nav-count">{courses.length}</span>}</button>)}</div>)}</nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><FileText size={18}/></div><b>Cần trợ giúp?</b><p>Xem hướng dẫn sử dụng hệ thống.</p><button onClick={()=>notify('Tài liệu hướng dẫn sẽ được bổ sung sau.')}>Xem hướng dẫn <ArrowUpRight size={14}/></button></div><button className="nav-item"><Settings size={18}/><span>Cài đặt</span></button><div className="profile"><div className="avatar avatar-purple">AD</div><div className="profile-info"><b>Admin User</b><small>Quản trị viên</small></div><MoreHorizontal size={18}/></div></div>
    </aside>
    {mobileNav&&<div className="scrim" onClick={()=>setMobileNav(false)} />}
    <main className="main-area">
      <header className="topbar"><div className="top-left"><button className="menu-toggle" onClick={()=>setMobileNav(true)}><Menu size={21}/></button><div className="breadcrumb">Trang chủ <ChevronRight size={14}/> <b>{title}</b></div></div><div className="top-actions"><div className="top-date"><CalendarDays size={16}/> Thứ Hai, 12/10/2026</div><button className="icon-button notification" onClick={()=>notify('Bạn đã xem các thông báo mới.')} aria-label="Thông báo"><Bell size={18}/><i/></button><div className="top-profile"><div className="avatar avatar-purple">AD</div><ChevronDown size={15}/></div></div></header>
      <div className="content">
        {page==='dashboard'&&<Dashboard employees={employees} courses={courses} subjects={subjects} completionRate={completionRate} setPage={setPage} setSelectedCourse={setSelectedCourse}/>}
        {page === 'employees' && <EmployeesPage employees={employees} filteredEmployees={filteredEmployees} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} openEmployee={openEmployee} removeEmployee={removeEmployee} exportEmployees={exportEmployees} />}        {page === 'subjects' && <SubjectsPage subjects={subjects} query={query} setQuery={setQuery} openSubject={openSubject} removeSubject={removeSubject} />}        {page === 'courses' && <CoursesPage courses={courses} employees={employees} subjects={subjects} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} openCourse={openCourse} removeCourse={removeCourse} setSelectedCourse={setSelectedCourse} selectedCourse={selectedCourse} saveCourses={saveCourses} notify={notify} />}      </div>
    </main>
    {modal&&<EditModal modal={modal} employees={employees} subjects={subjects} courses={courses} onClose={()=>setModal(null)} onSave={(type,data)=>{if(type==='employee'){const exists=employees.some(x=>x.id===data.id);saveEmployees(exists?employees.map(x=>x.id===data.id?data:x):[data,...employees]);}if(type==='subject'){const exists=subjects.some(x=>x.id===data.id);saveSubjects(exists?subjects.map(x=>x.id===data.id?data:x):[data,...subjects]);}if(type==='course'){const exists=courses.some(x=>x.id===data.id);saveCourses(exists?courses.map(x=>x.id===data.id?data:x):[data,...courses]);}setModal(null);notify('Đã lưu thông tin thành công')}}/>}
    {toast&&<div className="toast"><CheckCircle2 size={18}/>{toast}</div>}
  </div>;
}

export default App;
