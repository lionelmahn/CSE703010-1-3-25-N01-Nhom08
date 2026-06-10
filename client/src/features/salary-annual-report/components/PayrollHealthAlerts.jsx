import React from 'react';
import { CalendarX, Unlock, RefreshCcw, FileQuestion } from 'lucide-react';

const countBy = (months, predicate) => (months || []).filter(predicate).length;

// PAYROLL HEALTH & ALERTS - cac canh bao suy ra tu months[]; "Xem" loc bang theo trang thai.
const PayrollHealthAlerts = ({ months, onFilter }) => {
  const alerts = [
    {
      icon: CalendarX,
      tone: 'text-rose-600 bg-rose-50',
      title: 'Tháng có ca nhưng chưa lập phiếu',
      desc: 'Có tháng phát sinh ca làm nhưng chưa lập phiếu lương.',
      count: countBy(months, (m) => m.status === 'not_created'),
      status: 'not_created',
    },
    {
      icon: Unlock,
      tone: 'text-amber-600 bg-amber-50',
      title: 'Phiếu chưa chốt',
      desc: 'Có phiếu đã tính nhưng chưa được chốt.',
      count: countBy(months, (m) => m.status === 'draft' || m.status === 'calculated'),
      status: 'calculated',
    },
    {
      icon: RefreshCcw,
      tone: 'text-blue-600 bg-blue-50',
      title: 'Phiếu cần tính lại',
      desc: 'Các phiếu cần tính lại do dữ liệu thay đổi.',
      count: countBy(months, (m) => m.status === 'needs_recalculate'),
      status: 'needs_recalculate',
    },
    {
      icon: FileQuestion,
      tone: 'text-slate-500 bg-slate-100',
      title: 'Tháng chưa phát sinh',
      desc: 'Một số tháng không có hoạt động hoặc dữ liệu lương.',
      count: countBy(months, (m) => m.status === 'no_shifts'),
      status: 'no_shifts',
    },
  ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-[12px] font-extrabold uppercase tracking-wide text-slate-700">
        Tình trạng &amp; cảnh báo
      </h3>
      <ul className="space-y-2">
        {alerts.map((a) => {
          const Icon = a.icon;
          return (
            <li
              key={a.status}
              className="flex items-center gap-3 rounded-lg border border-slate-100 p-2.5"
            >
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${a.tone}`}>
                <Icon size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-slate-800">{a.title}</p>
                <p className="truncate text-[10.5px] text-slate-500">{a.desc}</p>
              </div>
              <span className="grid h-6 min-w-6 shrink-0 place-items-center rounded-md bg-slate-100 px-1.5 text-[12px] font-bold text-slate-700">
                {a.count}
              </span>
              <button
                type="button"
                onClick={() => onFilter(a.status)}
                disabled={!a.count}
                className="shrink-0 rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Xem
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default PayrollHealthAlerts;
