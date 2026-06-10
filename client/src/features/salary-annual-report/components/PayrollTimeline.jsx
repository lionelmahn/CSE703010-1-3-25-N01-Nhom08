import React from 'react';
import { Ban, AlertTriangle, FileEdit, Calculator, RefreshCcw, Lock } from 'lucide-react';

// Cau hinh icon/mau/nhan theo trang thai thang (PAYROLL TIMELINE).
const TIMELINE_STATUS = {
  no_shifts: { icon: Ban, label: 'Chưa phát sinh', cls: 'border-slate-200 bg-slate-50 text-slate-300' },
  not_created: { icon: AlertTriangle, label: 'Chưa lập phiếu', cls: 'border-rose-200 bg-rose-50 text-rose-500' },
  draft: { icon: FileEdit, label: 'Nháp', cls: 'border-slate-200 bg-slate-100 text-slate-500' },
  calculated: { icon: Calculator, label: 'Đã tính', cls: 'border-blue-200 bg-blue-50 text-blue-600' },
  needs_recalculate: { icon: RefreshCcw, label: 'Cần tính lại', cls: 'border-amber-200 bg-amber-50 text-amber-600' },
  finalized: { icon: Lock, label: 'Đã chốt', cls: 'border-emerald-200 bg-emerald-50 text-emerald-600' },
};

const fallback = TIMELINE_STATUS.no_shifts;

const PayrollTimeline = ({ months, year }) => {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-[12px] font-extrabold uppercase tracking-wide text-slate-700">
        Dòng thời gian ({year})
      </h3>

      <div className="grid grid-cols-6 gap-y-3">
        {(months || []).map((m) => {
          const cfg = TIMELINE_STATUS[m.status] || fallback;
          const Icon = cfg.icon;
          return (
            <div
              key={m.month}
              className="flex flex-col items-center gap-1"
              title={`Tháng ${String(m.month).padStart(2, '0')}/${m.year} — ${cfg.label}`}
            >
              <span className="text-[10px] font-semibold text-slate-500">T{m.month}</span>
              <span className={`grid h-8 w-8 place-items-center rounded-full border ${cfg.cls}`}>
                <Icon size={15} />
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-slate-100 pt-3">
        {Object.entries(TIMELINE_STATUS).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <span key={key} className="inline-flex items-center gap-1 text-[10px] text-slate-500">
              <span className={`grid h-4 w-4 place-items-center rounded-full border ${cfg.cls}`}>
                <Icon size={9} />
              </span>
              {cfg.label}
            </span>
          );
        })}
      </div>
    </section>
  );
};

export default PayrollTimeline;
