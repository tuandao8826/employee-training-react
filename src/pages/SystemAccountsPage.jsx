import React, { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import SystemAccountForm from "../components/accounts/SystemAccountForm";
import { systemAccountsApi, systemAccountError } from "../services/systemAccountsApi";

export default function SystemAccountsPage({ notify, canDelete }) {
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    systemAccountsApi.list(page, controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      if (!result.pageItems.length && result.pageInfo.hasPrevious) {
        setPage((value) => value - 1);
        return;
      }
      setData(result);
    }).catch((error) => {
      if (!controller.signal.aborted) setError(systemAccountError(error, "Không tải được danh sách tài khoản."));
    });
    return () => controller.abort();
  }, [page, revision]);

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

  const remove = async (account) => {
    if (!canDelete || deleting || !window.confirm(`Xóa tài khoản ${account.username}?`)) return;
    setDeleting(true);
    try {
      await systemAccountsApi.remove(account.id);
      notify("Đã xóa tài khoản");
      reload();
    } catch (error) {
      setError(systemAccountError(error, "Không xóa được tài khoản."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section>
      <div className="page-heading">
        <h1>Tài khoản hệ thống</h1>
        <button type="button" className="btn btn-primary" disabled={!data || deleting} onClick={() => setModal({ account: null })}>
          <Plus size={17} /> Thêm tài khoản
        </button>
      </div>
      {error && (
        <p role="alert">
          {error} <button type="button" className="btn btn-secondary btn-small" onClick={reload}>Tải lại</button>
        </p>
      )}
      {!data && !error && <p role="status">Đang tải danh sách tài khoản…</p>}
      {data && (
        <div className="panel">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Tên đăng nhập</th><th>Họ và tên</th><th>Email</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
              <tbody>
                {data.pageItems.map((account) => (
                  <tr key={account.id}>
                    <td><b>{account.username}</b>{account.isRootAdmin && <> · <strong>Admin gốc</strong></>}</td>
                    <td>{account.name}</td>
                    <td>{account.email || "—"}</td>
                    <td>{account.status === 1 ? "Hoạt động" : "Bị khóa"}</td>
                    <td>
                      {!account.isRootAdmin && (
                        <div className="row-actions">
                          <button type="button" aria-label={`Sửa ${account.username}`} title="Sửa" disabled={deleting} onClick={() => setModal({ account })}><Pencil size={15} /></button>
                          {canDelete && (
                            <button type="button" aria-label={`Xóa ${account.username}`} title="Xóa" disabled={deleting} onClick={() => remove(account)}><Trash2 size={15} /></button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>{data.pageInfo.totalCount} tài khoản</span>
            <div className="heading-actions">
              <button type="button" className="btn btn-secondary btn-small" disabled={!data.pageInfo.hasPrevious || deleting} onClick={() => { setData(null); setPage(page - 1); }}>Trước</button>
              <button type="button" className="btn btn-secondary btn-small" disabled={!data.pageInfo.hasNext || deleting} onClick={() => { setData(null); setPage(page + 1); }}>Sau</button>
            </div>
          </div>
        </div>
      )}
      {modal && <SystemAccountForm account={modal.account} onClose={() => setModal(null)} onSave={save} />}
    </section>
  );
}
