import React, { useEffect, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import SystemAccountForm from "../components/accounts/SystemAccountForm";
import PageSizeInput from "../components/common/PageSizeInput";
import { systemAccountsApi, systemAccountError } from "../services/systemAccountsApi";

function paginationItems(currentPage, totalPages) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (currentPage <= 3) return [1, 2, 3, 4, "…", totalPages];
  if (currentPage >= totalPages - 2) return [1, "…", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, "…", currentPage - 1, currentPage, currentPage + 1, "…", totalPages];
}

export default function SystemAccountsPage({ notify, currentUserId }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [query, setQuery] = useState("");
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setError("");
      systemAccountsApi.search(page, pageSize, query, controller.signal).then((result) => {
        if (controller.signal.aborted) return;
        if (!result.pageItems.length && result.pageInfo.hasPrevious) {
          setPage((value) => Math.max(1, value - 1));
          return;
        }
        setData(result);
      }).catch((requestError) => {
        if (!controller.signal.aborted) setError(systemAccountError(requestError, "Không tải được danh sách tài khoản."));
      });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [page, pageSize, query, revision]);

  const reload = () => {
    setData(null);
    setError("");
    setRevision((value) => value + 1);
  };

  const save = async (values) => {
    await systemAccountsApi.save(modal.account, values);
    notify(modal.account ? "Đã cập nhật tài khoản" : "Đã thêm tài khoản");
    setModal(null);
    reload();
  };

  const canDeleteAccount = (account) =>
    Boolean(currentUserId) && !account.isRootAdmin && account.id !== currentUserId;

  const remove = async (account) => {
    if (!canDeleteAccount(account) || deleting || !window.confirm(`Xóa tài khoản ${account.username}?`)) return;
    setDeleting(true);
    try {
      await systemAccountsApi.remove(account.id);
      notify("Đã xóa tài khoản");
      reload();
    } catch (requestError) {
      setError(systemAccountError(requestError, "Không xóa được tài khoản."));
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, data?.pageInfo.totalPages ?? 1);

  return (
    <section>
      <div className="page-heading">
        <div><h1>Tài khoản hệ thống</h1></div>
        <button type="button" className="btn btn-primary" disabled={!data || deleting} onClick={() => setModal({ account: null })}>
          <Plus size={17} /> Thêm tài khoản
        </button>
      </div>
      {error && (
        <p role="alert" className="error">
          {error} <button type="button" className="btn btn-secondary btn-small" onClick={reload}>Tải lại</button>
        </p>
      )}
      <div className="panel">
        <div className="panel-toolbar">
          <div className="search-box">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1); setData(null); }}
              placeholder="Tìm theo tên đăng nhập, họ tên hoặc email..."
              aria-label="Tìm kiếm tài khoản hệ thống"
            />
          </div>
          <span className="result-count">{data?.pageInfo.totalCount ?? 0} tài khoản</span>
        </div>
        {!data && !error && <p role="status" className="modal-body">Đang tải danh sách tài khoản…</p>}
        {data && (
          <>
            <div className="table-wrap">
              <table>
                <thead><tr><th>STT</th><th>Tên đăng nhập</th><th>Họ và tên</th><th>Email</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                <tbody>
                  {data.pageItems.map((account, index) => (
                    <tr key={account.id}>
                      <td>{(page - 1) * pageSize + index + 1}</td>
                      <td><b>{account.username}</b>{account.isRootAdmin && <> · <strong>Admin gốc</strong></>}</td>
                      <td>{account.name}</td>
                      <td>{account.email || "—"}</td>
                      <td>{account.status === 1 ? "Hoạt động" : "Bị khóa"}</td>
                      <td>
                        {!account.isRootAdmin && (
                          <div className="row-actions">
                            <button type="button" aria-label={`Sửa ${account.username}`} title="Sửa" disabled={deleting} onClick={() => setModal({ account })}><Pencil size={15} /></button>
                            {canDeleteAccount(account) && (
                              <button type="button" aria-label={`Xóa ${account.username}`} title="Xóa" disabled={deleting} onClick={() => remove(account)}><Trash2 size={15} /></button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.pageItems.length === 0 && <p className="modal-body">Không tìm thấy tài khoản phù hợp.</p>}
            </div>
            <div className="training-pagination">
              <PageSizeInput value={pageSize} onChange={(value) => { setPageSize(value); setPage(1); setData(null); }} disabled={deleting} />
              <div className="training-pagination-controls" aria-label="Phân trang tài khoản hệ thống">
                <button className="training-page-direction" disabled={!data.pageInfo.hasPrevious || deleting} onClick={() => { setData(null); setPage((value) => Math.max(1, value - 1)); }}>
                  <span aria-hidden="true">«</span> Previous
                </button>
                {paginationItems(page, totalPages).map((item, index) => item === "…" ? (
                  <span className="training-page-ellipsis" key={`ellipsis-${index}`}>…</span>
                ) : (
                  <button key={item} className={`training-page-number ${page === item ? "active" : ""}`} aria-current={page === item ? "page" : undefined} disabled={deleting} onClick={() => { setData(null); setPage(item); }}>{item}</button>
                ))}
                <button className="training-page-direction" disabled={!data.pageInfo.hasNext || deleting} onClick={() => { setData(null); setPage((value) => value + 1); }}>
                  Next <span aria-hidden="true">»</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      {modal && <SystemAccountForm account={modal.account} onClose={() => setModal(null)} onSave={save} />}
    </section>
  );
}
