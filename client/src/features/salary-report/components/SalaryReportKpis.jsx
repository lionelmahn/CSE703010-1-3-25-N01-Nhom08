import React from 'react';
import {
  Wallet,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CalendarRange,
  Timer,
  RefreshCcw,
  HeartPulse,
} from 'lucide-react';
import { formatVnd, formatNumber } from '../utils';

const Card = ({ icon: Icon, label, value, sub, tone = 'slate' }) => {
  const tones = {
    slate: 'text-slate-700',
    emerald: 'text-emerald-700',
    blue: 'text-blue-700',
    amber: 'text-amber-700',
    rose: 'text-rose-700',
  };
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-500">
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
          <p className={`mt-0.5 truncate text-[18px] font-extrabold ${tones[tone]}`}>{value}</p>
          {sub ? <p className="text-[10.5px] text-slate-400">{sub}</p> : null}
        </div>
      </div>
    </article>
  );
};

const SalaryReportKpis = ({ summary }) => {
  if (!summary) return null;
  const s = summary;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card
          icon={Wallet}
          label="Tổng quỹ lương (đã chốt)"
          value={formatVnd(s.total_payroll_official)}
          sub={s.is_provisional ? `Tạm tính: ${formatVnd(s.total_payroll_provisional)}` : 'Chỉ tính phiếu đã chốt'}
          tone="emerald"
        />
        <Card icon={Users} label="Bác sĩ có lương" value={`${s.doctors_with_salary}/${s.doctors_total}`} tone="blue" />
        <Card icon={CheckCircle2} label="Phiếu đã chốt" value={s.finalized_count} tone="emerald" />
        <Card icon={Clock} label="Phiếu chưa chốt" value={s.unfinalized_count} tone="amber" />
        <Card icon={AlertTriangle} label="Chưa lập phiếu" value={s.doctors_without_slip} tone="rose" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card icon={CalendarRange} label="Tổng ca làm" value={formatNumber(s.total_shifts)} />
        <Card icon={Timer} label="Tổng giờ làm" value={formatNumber(s.total_shift_hours, 2)} />
        <Card icon={RefreshCcw} label="Tổng giờ quy đổi" value={formatNumber(s.total_converted_hours, 2)} />
        <Card icon={HeartPulse} label="Tổng hệ số bệnh nhân" value={formatNumber(s.total_patient_coefficient, 2)} />
      </div>
    </div>
  );
};

export default SalaryReportKpis;
