import React, { useEffect, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import PageSizeInput from "../components/common/PageSizeInput";
import RoleForm from "../components/roles/RoleForm";
import { roleError, rolesApi } from "../services/rolesApi";
import "./roles.css";

function paginationItems(currentPage, totalPages) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (currentPage <= 3) return [1, 2, 3, 4, "…", totalPages];
  if (currentPage >= totalPages - 2) return [1, "…", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, "…", currentPage - 1, currentPage, currentPage + 1, "…", totalPages];
}

export default function RolesPage({ notify, confirmDelete }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [query, setQuery] = useState("");
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [permissions, setPermissions] = useState(null);
  const [permissionError, setPermissionError] = useState("");
  const [permissionRevision, setPermissionRevision] = useState(0);
  const [modal, setModal] = useState(null);
  const [loadingRoleId, setLoadingRoleId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setError("");
      rolesApi.search(page, pageSize, query, controller.signal).then((result) => {
        if (controller.signal.aborted) return;
        if (!result.pageItems.length && result.pageInfo.hasPrevious) {
          setPage((value) => Math.max(1, value - 1));
          return;
        }
        setData(result);
      }).catch((requestError) => {
        if (!controller.signal.aborted) setError(roleError(requestError, "Không tải được danh sách vai trò."));
      });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [page, pageSize, query, revision]);

  useEffect(() => {
    const controller = new AbortController();
    setPermissionError("");
    rolesApi.permissions(controller.signal).then((result) => {
      if (!controller.signal.aborted) setPermissions(result);
    }).catch((requestError) => {
      if (!controller.signal.aborted) setPermissionError(roleError(requestError, "Không tải được danh sách quyền."));
    });
    return () => controller.abort();
  }, [permissionRevision]);

  const reload = () => {
    setData(null);
    setError("");
    setRevision((value) => value + 1);
  };

  const edit = async (item) => {
    if (item.isDefault || loadingRoleId || deleting) return;
    setLoadingRoleId(item.id);
    try {
      const role = await rolesApi.detail(item.id);
      setModal({ role });
    } catch (requestError) {
      notify(roleError(requestError, "Không tải được thông tin vai trò."), "error");
    } finally {
      setLoadingRoleId(null);
    }
  };

  const save = async (values) => {
    await rolesApi.save(modal.role, values);
    notify(modal.role ? "Đã cập nhật vai trò" : "Đã thêm vai trò");
    setModal(null);
    reload();
  };

  const remove = async (item) => {
    if (item.isDefault || deleting) return;
    const confirmed = await confirmDelete({
      title: "Xóa vai trò",
      message: `Bạn có chắc muốn xóa vai trò ${item.name}? Thao tác này không thể hoàn tác.`,
    });
    if (!confirmed) return;
    setDeleting(true);
    try {
      await rolesApi.remove(item.id);
      notify("Đã xóa vai trò");
      reload();
    } catch (requestError) {
      notify(roleError(requestError, "Không xóa được vai trò."), "error");
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, data?.pageInfo.totalPages ?? 1);

  return (
    <section>
      <div className="page-heading">
        <div><h1>Quản lý vai trò</h1><p>Quản lý vai trò và các quyền truy cập được gán.</p></div>
        <button type="button" className="btn btn-primary" disabled={!permissions?.length || deleting} onClick={() => setModal({ role: null })}>
          <Plus size={17} /> Thêm vai trò
        </button>
      </div>
      {permissionError && <p role="alert" className="error">{permissionError} <button type="button" className="btn btn-secondary btn-small" onClick={() => setPermissionRevision((value) => value + 1)}>Tải lại quyền</button></p>}
      {error && <p role="alert" className="error">{error} <button type="button" className="btn btn-secondary btn-small" onClick={reload}>Tải lại</button></p>}
      <div className="panel">
        <div className="panel-toolbar">
          <div className="search-box">
            <Search size={17} />
            <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); setData(null); }} placeholder="Tìm theo mã hoặc tên vai trò..." aria-label="Tìm kiếm vai trò" />
          </div>
          <span className="result-count">{data?.pageInfo.totalCount ?? 0} vai trò</span>
        </div>
        {!data && !error && <p role="status" className="modal-body">Đang tải danh sách vai trò…</p>}
        {data && (
          <>
            <div className="table-wrap">
              <table>
                <thead><tr><th>STT</th><th>Mã vai trò</th><th>Tên vai trò</th><th>Mô tả</th><th>Số quyền</th><th>Thao tác</th></tr></thead>
                <tbody>
                  {data.pageItems.map((item, index) => (
                    <tr key={item.id}>
                      <td>{(page - 1) * pageSize + index + 1}</td>
                      <td><b>{item.code}</b></td>
                      <td>{item.name}{item.isDefault && <span className="role-default-tag">Mặc định</span>}</td>
                      <td className="role-description-cell" title={item.description || ""}>{item.description || "—"}</td>
                      <td>{item.permissionCount} quyền</td>
                      <td>
                        {!item.isDefault && (
                          <div className="row-actions">
                            <button type="button" aria-label={`Sửa ${item.name}`} title="Sửa" disabled={!permissions?.length || deleting || Boolean(loadingRoleId)} onClick={() => edit(item)}><Pencil size={15} /></button>
                            <button type="button" aria-label={`Xóa ${item.name}`} title="Xóa" disabled={deleting || Boolean(loadingRoleId)} onClick={() => remove(item)}><Trash2 size={15} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.pageItems.length === 0 && <p className="modal-body">Không tìm thấy vai trò phù hợp.</p>}
            </div>
            <div className="training-pagination">
              <PageSizeInput value={pageSize} onChange={(value) => { setPageSize(value); setPage(1); setData(null); }} disabled={deleting} />
              <div className="training-pagination-controls" aria-label="Phân trang vai trò">
                <button type="button" className="training-page-direction" disabled={!data.pageInfo.hasPrevious || deleting} onClick={() => { setData(null); setPage((value) => Math.max(1, value - 1)); }}>« Trước</button>
                {paginationItems(page, totalPages).map((item, index) => item === "…" ? (
                  <span className="training-page-ellipsis" key={`ellipsis-${index}`}>…</span>
                ) : (
                  <button type="button" key={item} className={`training-page-number ${page === item ? "active" : ""}`} aria-current={page === item ? "page" : undefined} disabled={deleting} onClick={() => { setData(null); setPage(item); }}>{item}</button>
                ))}
                <button type="button" className="training-page-direction" disabled={!data.pageInfo.hasNext || deleting} onClick={() => { setData(null); setPage((value) => value + 1); }}>Sau »</button>
              </div>
            </div>
          </>
        )}
      </div>
      {modal && <RoleForm role={modal.role} permissions={permissions ?? []} onClose={() => setModal(null)} onSave={save} notify={notify} />}
    </section>
  );
}
