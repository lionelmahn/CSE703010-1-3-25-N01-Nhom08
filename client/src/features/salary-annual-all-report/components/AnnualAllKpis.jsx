import React from 'react';
import {
  Wallet,
  Users,
  FileText,
  Lock,
  Unlock,
  AlertTriangle,
  CalendarRange,
  Timer,
  BarChart3,
} from 'lucide-react';
import { formatVnd, formatNumber, percent } from '../utils';

const Card = ({ icon: Icon, label, value, sub, tone = 'slate' }) => {
  const tones = {
    slate: 'text-slate-800',
    emerald: 'text-emerald-700',
    blue: 'text-blue-700',
    amber: 'text-amber-700',
    rose: 'text-rose-700',
  };
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500">
          <Icon size={15} />
        </span>
        <div className="min-w-0">
          <p className="text-[9.5px] font-bold uppercase leading-tight tracking-wide text-slate-500">{label}</p>
          <p className={`mt-1 truncate text-[15px] font-extrabold ${tones[tone]}`}>{value}</p>
          {sub ? <p className="text-[10px] text-slate-400">{sub}</p> : null}
        </div>
      </div>
    </article>
  );
};

// UC19 - 9 KPI tong quan nam toan bo bac si (DR231-239).
const AnnualAllKpis = ({ summary }) => {
  if (!summary) return null;
  const s = summary;
  const base = s.total_slips || 0;

  return (
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
      <Card
        icon={Wallet}
        label="Tổng quỹ lương năm"
        value={formatVnd(s.total_payroll_official)}
        sub="Chỉ phiếu đã chốt"
        tone="emerald"
      />
      <Card
        icon={Users}
        label="Bác sĩ có lương"
        value={`${s.doctors_with_salary}/${s.doctors_total}`}
        sub={`${percent(s.doctors_with_salary, s.doctors_total)}%`}
        tone="blue"
      />
      <Card icon={FileText} label="Tổng số phiếu" value={formatNumber(s.total_slips)} sub="12 tháng" />
      <Card
        icon={Lock}
        label="Phiếu đã chốt"
        value={formatNumber(s.finalized_count)}
        sub={`${percent(s.finalized_count, base)}%`}
        tone="emerald"
      />
      <Card
        icon={Unlock}
        label="Phiếu chưa chốt"
        value={formatNumber(s.unfinalized_count)}
        sub={`${percent(s.unfinalized_count, base)}%`}
        tone="amber"
      />
      <Card
        icon={AlertTriangle}
        label="B.sĩ/tháng chưa lập"
        value={formatNumber(s.doctor_months_not_created)}
        sub={`${percent(s.doctor_months_not_created, base)}%`}
        tone="rose"
      />
      <Card icon={CalendarRange} label="Tổng ca làm" value={formatNumber(s.total_shifts)} />
      <Card icon={Timer} label="Tổng giờ quy đổi" value={formatNumber(s.total_converted_hours, 2)} />
      <Card icon={BarChart3} label="Tổng hệ số phức tạp" value={formatNumber(s.total_patient_coefficient, 2)} />
    </div>
  );
};

export default AnnualAllKpis;
