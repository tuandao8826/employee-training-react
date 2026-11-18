import React, { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { roleError } from "../../services/rolesApi";

const resourceNames = { User: "Người dùng", Role: "Vai trò" };
const actionNames = { View: "Xem", Create: "Thêm", Update: "Sửa", Delete: "Xóa", Search: "Tìm kiếm" };

function permissionLabel(permission) {
  const match = /^(User|Role)(View|Create|Update|Delete|Search)$/.exec(permission.code || "");
  return match ? `${actionNames[match[2]]} ${resourceNames[match[1]].toLowerCase()}` : permission.name || permission.code;
}

export default function RoleForm({ role, permissions, onClose, onSave, notify }) {
  const [code, setCode] = useState(role?.code ?? "");
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [selected, setSelected] = useState(() => new Set(role?.permissions?.map((permission) => permission.code) ?? []));
  const [expandedGroups, setExpandedGroups] = useState(() => new Set(["Người dùng", "Vai trò", "Quyền khác"]));
  const [saving, setSaving] = useState(false);

  const togglePermission = (permissionCode) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(permissionCode)) next.delete(permissionCode);
      else next.add(permissionCode);
      return next;
    });
  };

  const toggleGroup = (group) => {
    const codes = group.items.map((permission) => permission.code);
    setSelected((current) => {
      const next = new Set(current);
      if (codes.every((code) => next.has(code))) codes.forEach((code) => next.delete(code));
      else codes.forEach((code) => next.add(code));
      return next;
    });
  };

  const toggleExpanded = (label) => {
    setExpandedGroups((current) => {
      const next = new Set(current);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (!code.trim() || !name.trim()) {
      notify("Mã và tên vai trò là bắt buộc.", "error");
      return;
    }
    if (selected.size === 0) {
      notify("Chọn ít nhất một quyền cho vai trò.", "error");
      return;
    }
    setSaving(true);
    try {
      await onSave({ code: code.trim(), name: name.trim(), description: description.trim(), permissionCodes: [...selected] });
    } catch (error) {
      notify(roleError(error, "Không lưu được vai trò. Vui lòng thử lại."), "error");
      setSaving(false);
    }
  };

  const groups = [
    { label: "Người dùng", items: permissions.filter((permission) => permission.code?.startsWith("User")) },
    { label: "Vai trò", items: permissions.filter((permission) => permission.code?.startsWith("Role")) },
    { label: "Quyền khác", items: permissions.filter((permission) => !/^(User|Role)/.test(permission.code || "")) },
  ].filter((group) => group.items.length);
  const allCodes = permissions.map((permission) => permission.code).filter(Boolean);
  const allSelected = allCodes.length > 0 && allCodes.every((permissionCode) => selected.has(permissionCode));
  const partiallySelected = !allSelected && allCodes.some((permissionCode) => selected.has(permissionCode));

  const toggleAll = () => {
    setSelected((current) => allCodes.every((permissionCode) => current.has(permissionCode))
      ? new Set()
      : new Set(allCodes));
  };

  return (
    <div className="modal-backdrop">
      <section className="modal role-modal" role="dialog" aria-modal="true" aria-labelledby="role-form-heading">
        <div className="modal-head">
          <h2 id="role-form-heading">{role ? "Chỉnh sửa vai trò" : "Thêm vai trò"}</h2>
          <button type="button" className="icon-button" disabled={saving} onClick={onClose} aria-label="Đóng"><X size={19} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-grid">
              <label className="form-field">
                <span>Mã vai trò<b className="required-marker" aria-hidden="true"> *</b></span>
                <input value={code} onChange={(event) => setCode(event.target.value)} maxLength={255} required disabled={saving} placeholder="Ví dụ: MANAGER" />
              </label>
              <label className="form-field">
                <span>Tên vai trò<b className="required-marker" aria-hidden="true"> *</b></span>
                <input value={name} onChange={(event) => setName(event.target.value)} maxLength={255} required disabled={saving} placeholder="Nhập tên vai trò" />
              </label>
              <label className="form-field role-description-field">
                <span>Mô tả</span>
                <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={255} rows={2} disabled={saving} placeholder="Mô tả vai trò" />
              </label>
            </div>
            <div className="role-permissions-heading">
              <strong>Quyền truy cập<b className="required-marker" aria-hidden="true"> *</b></strong>
              <span>Đã chọn {selected.size} quyền</span>
            </div>
            <div className="role-permissions">
              <label className="role-select-all">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(node) => { if (node) node.indeterminate = partiallySelected; }}
                  disabled={saving || allCodes.length === 0}
                  onChange={toggleAll}
                />
                <span>Chọn tất cả quyền</span>
              </label>
              {groups.map((group, index) => {
                const groupCodes = group.items.map((permission) => permission.code);
                const groupSelected = groupCodes.every((permissionCode) => selected.has(permissionCode));
                const groupPartial = !groupSelected && groupCodes.some((permissionCode) => selected.has(permissionCode));
                const expanded = expandedGroups.has(group.label);
                const groupId = `role-permission-group-${index}`;
                return (
                  <div className="role-permission-group" key={group.label}>
                    <div className="role-permission-group-head">
                      <label className="role-group-select">
                        <input
                          type="checkbox"
                          checked={groupSelected}
                          ref={(node) => { if (node) node.indeterminate = groupPartial; }}
                          disabled={saving}
                          onChange={() => toggleGroup(group)}
                        />
                        <span>{group.label}</span>
                      </label>
                      <span className="role-group-count">{groupCodes.filter((permissionCode) => selected.has(permissionCode)).length}/{groupCodes.length}</span>
                      <button
                        type="button"
                        className={`role-group-toggle${expanded ? " is-expanded" : ""}`}
                        aria-label={`${expanded ? "Thu gọn" : "Mở rộng"} nhóm ${group.label}`}
                        aria-expanded={expanded}
                        aria-controls={groupId}
                        onClick={() => toggleExpanded(group.label)}
                      ><ChevronDown size={18} /></button>
                    </div>
                    <div className="role-permission-children" id={groupId} hidden={!expanded}>
                      {group.items.map((permission) => (
                        <label className="role-permission-option" key={permission.code}>
                          <input type="checkbox" checked={selected.has(permission.code)} disabled={saving} onChange={() => togglePermission(permission.code)} />
                          <span>{permissionLabel(permission)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-secondary" disabled={saving} onClick={onClose}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={saving || permissions.length === 0}>{saving ? "Đang lưu…" : "Lưu vai trò"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
