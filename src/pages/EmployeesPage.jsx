import React, { useEffect, useState } from 'react';
import { Empty } from '../components/common/UI';
import EmployeeForm from '../components/employees/EmployeeForm';
import EmployeeImport from '../components/employees/EmployeeImport';
import EmployeeList from '../components/employees/EmployeeList';
import { staffApi, staffError } from '../services/staffApi';

export default function EmployeesPage({ notify, ...tableProps }) {
  const [employees, setEmployees] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [loadVersion, setLoadVersion] = useState(0);
  const [modal, setModal] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    staffApi.list(controller.signal).then((records) => {
      if (controller.signal.aborted) return;
      setEmployees(records);
      setLoadState('ready');
    }).catch((error) => {
      if (controller.signal.aborted) return;
      setError(staffError(error, 'Không tải được danh sách. Hãy kiểm tra API và PostgreSQL.'));
      setLoadState('failed');
    });
    return () => controller.abort();
  }, [loadVersion]);

  const retry = () => {
    setError('');
    setLoadState('loading');
    setLoadVersion((version) => version + 1);
  };

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
    } catch (error) {
      setError(staffError(error, 'Không mở được hồ sơ nhân viên.'));
    } finally {
      setBusy(false);
    }
  };

  const addToList = (saved) => {
    setEmployees((current) => [
      ...current.filter((employee) => employee.id !== saved.id),
      saved,
    ].sort((left, right) => left.code.localeCompare(right.code, 'vi')));
  };

  const saveEmployee = async (form) => {
    const saved = await staffApi.save(form);
    addToList(saved);
    setModal(null);
    notify(form.id ? 'Đã cập nhật nhân viên' : 'Đã thêm nhân viên');
  };

  const removeEmployee = async (id) => {
    if (busy) return;
    const employee = employees.find((item) => item.id === id);
    if (!window.confirm(`Bạn có chắc muốn xóa nhân viên ${employee.name}?`)) return;
    setError('');
    setBusy(true);
    try {
      await staffApi.remove(id);
      setEmployees((current) => current.filter((item) => item.id !== id));
      notify('Đã xóa nhân viên');
    } catch (error) {
      setError(staffError(error, 'Không xóa được nhân viên. Vui lòng thử lại.'));
    } finally {
      setBusy(false);
    }
  };

  if (loadState !== 'ready') {
    return (
      <section className="panel" aria-busy={loadState === 'loading'}>
        {loadState === 'loading' ? (
          <Empty title="Đang tải danh sách nhân viên…" />
        ) : (
          <div className="modal-body">
            <p role="alert">{error}</p>
            <button type="button" className="btn btn-secondary" onClick={retry}>Tải lại</button>
          </div>
        )}
      </section>
    );
  }

  return (
    <>
      {error && <p className="error" role="alert">{error}</p>}
      <EmployeeList
        {...tableProps}
        employees={employees}
        openEmployee={openEmployee}
        openImport={() => setImportOpen(true)}
        viewEmployee={(employee) => openEmployee(employee, true)}
        removeEmployee={removeEmployee}
        notify={notify}
        busy={busy}
      />
      {modal && <EmployeeForm {...modal} onClose={() => setModal(null)} onSave={saveEmployee} />}
      {importOpen && (
        <EmployeeImport employees={employees} onClose={() => setImportOpen(false)} onImported={addToList} notify={notify} />
      )}
    </>
  );
}
