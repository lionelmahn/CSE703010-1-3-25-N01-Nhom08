import React from 'react';
import { Users, Clock, Activity, CheckCircle2, AlertTriangle } from 'lucide-react';

const StatChip = ({ icon, label, value, tone = 'slate' }) => {
  const IconComp = icon;
  const toneMap = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    red: 'bg-red-50 text-red-700',
  };
  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${toneMap[tone]}`}>
      <IconComp size={14} />
      <span>{label}</span>
      <span className="ml-auto text-base font-bold">{value ?? 0}</span>
    </div>
  );
};

/**
 * UC11 - 5 chip KPI o dau tab "Theo doi hang cho" (UI12).
 */
const QueueSummaryStrip = ({ summary, avgWaitMin }) => {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
      <StatChip icon={Users} tone="indigo" label="Dang cho" value={summary?.total_active} />
      <StatChip icon={AlertTriangle} tone="amber" label="Chua BS" value={summary?.unassigned} />
      <StatChip icon={Clock} tone="blue" label="Cho kham" value={summary?.waiting} />
      <StatChip icon={Activity} tone="indigo" label="Dang kham" value={summary?.in_progress} />
      <StatChip icon={CheckCircle2} tone="emerald" label="TB cho (p)" value={avgWaitMin} />
    </div>
  );
};

export default QueueSummaryStrip;
