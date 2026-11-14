import React, { useEffect, useState } from 'react';
import EmployeeForm from '../components/employees/EmployeeForm';
import EmployeeImport from '../components/employees/EmployeeImport';
import EmployeeList from '../components/employees/EmployeeList';
import { staffApi, staffError } from '../services/staffApi';

export default function EmployeesPage({ notify, confirmDelete, query, setQuery, filter, setFilter }) {
  const [employees, setEmployees] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadVersion, setLoadVersion] = useState(0);
  const [modal, setModal] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importEmployees, setImportEmployees] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError('');
      staffApi.search(page, pageSize, query, filter, controller.signal)
        .then((result) => {
          if (controller.signal.aborted) return;
          setEmployees(result.pageItems);
          setTotalCount(result.pageInfo.totalCount);
          setTotalPages(Math.max(1, result.pageInfo.totalPages ?? Math.ceil(result.pageInfo.totalCount / pageSize)));
          setLoading(false);
        })
        .catch((requestError) => {
          if (controller.signal.aborted) return;
          setError(staffError(requestError, 'Không tải được danh sách. Hãy kiểm tra API và PostgreSQL.'));
          setLoading(false);
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [page, pageSize, query, filter, loadVersion]);

  const retry = () => setLoadVersion((version) => version + 1);

  const openEmployee = async (employee, viewing = false) => {
    if (busy) return;
    setError('');
    if (!employee) {
      setModal({ employee: null });
      return;
    }
    setBusy(true);
    try {
      setModal({ employee: await staffApi.detail(employee.id), viewing });
    } catch (requestError) {
      setError(staffError(requestError, 'Không mở được hồ sơ nhân viên.'));
    } finally {
      setBusy(false);
    }
  };

  const saveEmployee = async (form) => {
    await staffApi.save(form);
    setModal(null);
    setLoadVersion((version) => version + 1);
    notify(form.id ? 'Đã cập nhật nhân viên' : 'Đã thêm nhân viên');
  };

  const removeEmployee = async (id) => {
    if (busy) return;
    const employee = employees.find((item) => item.id === id);
    if (!employee) return;
    const confirmed = await confirmDelete({
      title: "Xóa nhân viên",
      message: `Bạn có chắc muốn xóa nhân viên ${employee.name} (${employee.code})? Thao tác này không thể hoàn tác.`,
    });
    if (!confirmed) return;
    setError('');
    setBusy(true);
    try {
      await staffApi.remove(id);
      setLoadVersion((version) => version + 1);
      notify('Đã xóa nhân viên');
    } catch (requestError) {
      setError(staffError(requestError, 'Không xóa được nhân viên. Vui lòng thử lại.'));
    } finally {
      setBusy(false);
    }
  };

  const handleImported = () => setLoadVersion((version) => version + 1);

  const openImport = async () => {
    try {
      setImportEmployees(await staffApi.list());
      setImportOpen(true);
    } catch (requestError) {
      setError(staffError(requestError, 'Không tải được danh sách nhân viên để đối chiếu khi nhập Excel.'));
    }
  };

  return (
    <>
      {error && <p className="error" role="alert">{error} <button type="button" className="btn btn-secondary" onClick={retry}>Tải lại</button></p>}
      <EmployeeList
        employees={employees}
        query={query}
        setQuery={(value) => { setQuery(value); setPage(1); }}
        filter={filter}
        setFilter={(value) => { setFilter(value); setPage(1); }}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        setPageSize={(value) => { setPageSize(value); setPage(1); }}
        totalCount={totalCount}
        totalPages={totalPages}
        loading={loading}
        openEmployee={openEmployee}
        openImport={openImport}
        viewEmployee={(employee) => openEmployee(employee, true)}
        removeEmployee={removeEmployee}
        notify={notify}
        busy={busy}
      />
      {modal && <EmployeeForm {...modal} onClose={() => setModal(null)} onSave={saveEmployee} notify={notify} />}
      {importOpen && (
        <EmployeeImport employees={importEmployees} onClose={() => setImportOpen(false)} onImported={handleImported} notify={notify} />
      )}
    </>
  );
}
