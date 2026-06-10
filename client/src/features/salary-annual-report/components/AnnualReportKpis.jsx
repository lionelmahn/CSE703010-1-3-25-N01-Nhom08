import React from 'react';
import {
  Wallet,
  CalendarCheck,
  Lock,
  Unlock,
  AlertTriangle,
  Users,
  Clock,
  BarChart3,
  Activity,
} from 'lucide-react';
import { formatVnd, formatNumber } from '../utils';

const TONES = {
  slate: 'border-slate-200 text-slate-500',
  emerald: 'bg-emerald-50 text-emerald-600',
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
};

const Card = ({ icon: Icon, label, value, sub, tone = 'slate' }) => (
  <article className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
    <div className="flex items-start gap-2.5">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${TONES[tone]}`}>
        <Icon size={17} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase leading-tight tracking-wide text-slate-500">{label}</p>
        <p className="mt-0.5 truncate text-[17px] font-extrabold text-slate-900">{value}</p>
        {sub ? <p className="text-[10px] text-slate-400">{sub}</p> : null}
      </div>
    </div>
  </article>
);

const pct = (n) => `${Math.round((Number(n || 0) / 12) * 10000) / 100}%`;

// UI4 - dashboard tong quan luong nam (9 the KPI, khop thiet ke).
const AnnualReportKpis = ({ summary }) => {
  if (!summary) return null;
  const s = summary;
  const missing = 12 - Number(s.months_with_slip || 0);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      <Card
        icon={Wallet}
        label="Tổng lương năm"
        value={formatVnd(s.total_payroll_official)}
        sub={s.is_provisional ? `Tạm tính: ${formatVnd(s.total_payroll_provisional)}` : 'Chỉ tính phiếu đã chốt'}
        tone="emerald"
      />
      <Card icon={CalendarCheck} label="Tháng có phiếu" value={`${s.months_with_slip}/12`} sub={pct(s.months_with_slip)} tone="blue" />
      <Card icon={Lock} label="Phiếu đã chốt" value={s.months_finalized} sub={pct(s.months_finalized)} tone="emerald" />
      <Card icon={Unlock} label="Phiếu chưa chốt" value={s.months_unfinalized} sub={pct(s.months_unfinalized)} tone="amber" />
      <Card icon={AlertTriangle} label="Tháng thiếu phiếu" value={missing} sub={pct(missing)} tone="rose" />
      <Card icon={Users} label="Tổng ca làm" value={formatNumber(s.total_shifts)} />
      <Card icon={Clock} label="Tổng giờ làm" value={`${formatNumber(s.total_shift_hours, 2)} giờ`} />
      <Card icon={BarChart3} label="Tổng giờ quy đổi" value={`${formatNumber(s.total_converted_hours, 2)} giờ`} />
      <Card icon={Activity} label="Tổng hệ số bệnh nhân" value={formatNumber(s.total_patient_coefficient, 2)} />
    </div>
  );
};

export default AnnualReportKpis;
