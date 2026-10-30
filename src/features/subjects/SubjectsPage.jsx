import React from 'react';
import { BookOpen, CheckCircle2, Clock3, Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { Stat, Status, Empty } from '../../components/common/UI';
import { avatarTone, initials } from '../../utils/helpers';

export default function SubjectsPage({subjects, query, setQuery, openSubject, removeSubject}) {
  return <section>
          <div className="page-heading"><div><div className="eyebrow">ĐÀO TẠO / DANH MỤC</div><h1>Quản lý môn học</h1><p>Xây dựng danh mục môn học làm cơ sở tổ chức các khóa đào tạo.</p></div><button className="btn btn-primary" onClick={()=>openSubject()}><Plus size={17}/> Thêm môn học</button></div>
          <div className="stats-row compact"><Stat label="Tổng môn học" value={subjects.length} note="Danh mục hiện có" icon={BookOpen} tone="blue"/><Stat label="Môn bắt buộc" value={subjects.filter(s=>s.category==='Bắt buộc').length} note="Theo yêu cầu đào tạo" icon={CheckCircle2} tone="green"/><Stat label="Tổng thời lượng" value={subjects.reduce((n,s)=>n+Number(s.duration),0)+' giờ'} note="Thời lượng dự kiến" icon={Clock3} tone="orange"/></div>
          <div className="panel"><div className="panel-toolbar"><div className="search-box"><Search size={17}/><input value={query} onChange={setQuery} placeholder="Tìm kiếm môn học..."/></div><span className="result-count">{subjects.filter(s=>(s.name+s.code+s.category).toLowerCase().includes(query.toLowerCase())).length} môn học</span></div>
            <div className="subject-grid">{subjects.filter(s=>(s.name+s.code+s.category).toLowerCase().includes(query.toLowerCase())).map(s=><article className="subject-card" key={s.id}><div className="subject-card-top"><div className="subject-icon"><BookOpen size={21}/></div><div className="row-actions"><button onClick={()=>openSubject(s)} title="Sửa"><Pencil size={15}/></button><button onClick={()=>removeSubject(s.id)} title="Xóa"><Trash2 size={15}/></button></div></div><span className="code">{s.code}</span><h3>{s.name}</h3><p>{s.description||'Chưa có mô tả cho môn học này.'}</p><div className="subject-card-foot"><Status value={s.category}/><span><Clock3 size={14}/>{s.duration} giờ</span></div></article>)}</div>{subjects.length===0&&<Empty title="Chưa có môn học" text="Thêm môn học đầu tiên để bắt đầu quản lý đào tạo."/>}</div>
        </section>;
}
