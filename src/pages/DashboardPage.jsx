import React, { useEffect, useState } from "react";
import { BookOpen, ClipboardList, Users } from "lucide-react";
import { Stat } from "../components/common/UI";
import CurrentDate from "../components/common/CurrentDate";
import { staffApi } from "../services/staffApi";

export default function DashboardPage({ subjects, setPage }) {
  const [staffCounts, setStaffCounts] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    staffApi.list(controller.signal)
      .then((records) => {
        if (!controller.signal.aborted) {
          setStaffCounts({
            total: records.length,
            active: records.filter((record) => record.status === "Đang làm việc").length,
          });
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <section>
      <div className="welcome">
        <div>
          <div className="eyebrow light"><CurrentDate long /></div>
          <h1>Xin chào, Admin <span>✦</span></h1>
          <p>Đây là tình hình nhân sự và đào tạo của bạn hôm nay.</p>
        </div>
      </div>

      <div className="stats-row">
        <Stat label="Tổng nhân viên" value={staffCounts?.total ?? "—"} note="Trong hệ thống" icon={Users} tone="blue" />
        <Stat label="Đang làm việc" value={staffCounts?.active ?? "—"} note="Nhân sự hiện tại" icon={Users} tone="green" />
        <Stat label="Môn học" value={subjects.length} note="Danh mục đào tạo" icon={BookOpen} tone="purple" />
      </div>

      <div className="panel quick-panel">
        <div className="panel-heading">
          <div>
            <h2>Quản lý đào tạo</h2>
            <p>Theo dõi hồ sơ nhân viên theo từng môn học.</p>
          </div>
        </div>
        <div className="quick-links">
          <button onClick={() => setPage("employees")}>
            <div className="quick-icon q-blue"><Users size={19} /></div>
            <span><b>Quản lý nhân viên</b><small>Hồ sơ nhân sự</small></span>
          </button>
          <button onClick={() => setPage("subjects")}>
            <div className="quick-icon q-purple"><BookOpen size={19} /></div>
            <span><b>Quản lý môn học</b><small>Danh mục chương trình đào tạo</small></span>
          </button>
          <button onClick={() => setPage("training")}>
            <div className="quick-icon q-green"><ClipboardList size={19} /></div>
            <span><b>Quản lý đào tạo</b><small>Ngày học và ngày hết hạn</small></span>
          </button>
        </div>
      </div>
    </section>
  );
}
