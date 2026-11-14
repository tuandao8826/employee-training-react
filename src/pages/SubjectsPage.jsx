import React, { useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, Clock3, LockKeyhole, Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { Stat, Status, Empty } from '../components/common/UI';
import PageSizeInput from '../components/common/PageSizeInput';
import { subjectApi } from '../services/subjectApi';

function paginationItems(currentPage, totalPages) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (currentPage <= 3) return [1, 2, 3, 4, '…', totalPages];
  if (currentPage >= totalPages - 2) return [1, '…', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, '…', currentPage - 1, currentPage, currentPage + 1, '…', totalPages];
}

export default function SubjectsPage({ subjects, query, setQuery, openSubject, removeSubject, confirmDelete }) {
  const subjectRecords = Array.isArray(subjects)
    ? subjects.filter((subject) => subject && typeof subject === 'object')
    : [];
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [pageItems, setPageItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const requestRemove = async (subject) => {
    if (deleting) return;
    const confirmed = await confirmDelete({
      title: "Xóa môn học",
      message: `Bạn có chắc muốn xóa môn học ${subject.name} (${subject.code})? Thao tác này không thể hoàn tác.`,
    });
    if (!confirmed) return;
    setDeleting(true);
    try {
      await removeSubject(subject.id);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError('');
      subjectApi.search(page, pageSize, query, controller.signal)
        .then((result) => {
          if (controller.signal.aborted) return;
          const lastPage = Math.max(1, result.pageInfo.totalPages ?? Math.ceil(result.pageInfo.totalCount / pageSize));
          if (page > lastPage) {
            setPage(lastPage);
            return;
          }
          setPageItems(Array.isArray(result.pageItems)
            ? result.pageItems.filter((subject) => subject && typeof subject === 'object')
            : []);
          setTotalCount(result.pageInfo.totalCount);
          setTotalPages(lastPage);
          setLoading(false);
        })
        .catch((requestError) => {
          if (controller.signal.aborted) return;
          setError(requestError.message || 'Không tải được danh sách môn học.');
          setLoading(false);
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [page, pageSize, query, subjects]);

  return <section>
    <div className="page-heading">
      <div>
        <div className="eyebrow">ĐÀO TẠO / DANH MỤC</div>
        <h1>Quản lý môn học</h1>
        <p>Xây dựng danh mục môn học làm cơ sở tổ chức các khóa đào tạo.</p>
      </div>
      <button className="btn btn-primary" onClick={() => openSubject()}><Plus size={17}/> Thêm môn học</button>
    </div>
    <div className="stats-row compact">
      <Stat label="Tổng số môn học" value={subjectRecords.length} note="Danh mục hiện có" icon={BookOpen} tone="blue"/>
      <Stat label="Đang hoạt động" value={subjectRecords.filter((subject) => subject.category === 'Đang hoạt động').length} note="Môn học khả dụng" icon={CheckCircle2} tone="green"/>
      <Stat label="Đã khóa" value={subjectRecords.filter((subject) => subject.category === 'Đã khóa').length} note="Không hiển thị trong quản lý đào tạo" icon={LockKeyhole} tone="orange"/>
    </div>
    <div className="panel">
      <div className="panel-toolbar">
        <div className="search-box">
          <Search size={17}/>
          <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Tìm theo mã hoặc tên môn học..."/>
        </div>
        <span className="result-count">{totalCount} môn học</span>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="subject-grid">
        {pageItems.map((subject) => <article className="subject-card" key={subject.id}>
          <div className="subject-card-top">
            <div className="subject-icon"><BookOpen size={21}/></div>
            <div className="row-actions">
              <button onClick={() => openSubject(subject)} title="Sửa"><Pencil size={15}/></button>
              <button disabled={deleting} onClick={() => requestRemove(subject)} title="Xóa"><Trash2 size={15}/></button>
            </div>
          </div>
          <span className="code">{subject.code}</span>
          <h3>{subject.name}</h3>
          <p>{subject.description || 'Chưa có mô tả cho môn học này.'}</p>
          <div className="subject-card-foot">
            <Status value={subject.category}/>
            <span><Clock3 size={14}/>{subject.duration} {subject.cycleUnit || 'Ngày'}</span>
          </div>
        </article>)}
      </div>
      {!loading && totalCount === 0 && <Empty
        title={query ? 'Không tìm thấy môn học' : 'Chưa có môn học'}
        text={query ? 'Thử thay đổi từ khóa tìm kiếm.' : 'Thêm môn học đầu tiên để bắt đầu quản lý đào tạo.'}
      />}
      {loading && <div className="subject-loading" aria-live="polite">Đang tải danh sách môn học…</div>}
      <div className="training-pagination">
        <PageSizeInput value={pageSize} onChange={(value) => { setPageSize(value); setPage(1); }} disabled={loading} />
        <div className="training-pagination-controls" aria-label="Phân trang danh sách môn học">
          <button className="training-page-direction" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))}>
            <span aria-hidden="true">«</span> Previous
          </button>
          {paginationItems(page, totalPages).map((item, index) => item === '…' ? (
            <span className="training-page-ellipsis" key={`ellipsis-${index}`}>…</span>
          ) : (
            <button key={item} className={`training-page-number ${page === item ? 'active' : ''}`} aria-current={page === item ? 'page' : undefined} disabled={loading} onClick={() => setPage(item)}>{item}</button>
          ))}
          <button className="training-page-direction" disabled={page >= totalPages || loading} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
            Next <span aria-hidden="true">»</span>
          </button>
        </div>
      </div>
    </div>
  </section>;
}
