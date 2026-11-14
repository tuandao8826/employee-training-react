import React, { useEffect, useState } from "react";

export default function PageSizeInput({ value, onChange, disabled = false }) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => setDraft(String(value)), [value]);

  const commit = () => {
    const parsed = Number.parseInt(draft, 10);
    const next = Number.isFinite(parsed) ? Math.max(1, Math.min(100, parsed)) : value;
    setDraft(String(next));
    if (next !== value) onChange(next);
  };

  return (
    <label className="page-size-control">
      <span>Hiển thị</span>
      <input
        type="number"
        min="1"
        max="100"
        step="1"
        inputMode="numeric"
        aria-label="Số bản ghi mỗi trang"
        value={draft}
        disabled={disabled}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
      />
      <span>bản ghi/trang (tối đa 100)</span>
    </label>
  );
}
