import React from 'react';
import { Phone, User, Stethoscope, Clock, Hash } from 'lucide-react';
import ArrivalBadge from './ArrivalBadge';
import StatusBadge from './StatusBadge';

/**
 * UC11 - 1 dong lich hen trong list "Lich hen hom nay" (UI2).
 */
const AppointmentRowCard = ({ appointment, active, onClick }) => {
  const a = appointment;
  return (
    <button
      type="button"
      onClick={() => onClick?.(a)}
      className={`group w-full rounded-xl border px-3 py-2.5 text-left transition hover:border-indigo-300 hover:shadow-sm focus:outline-none ${
        active
          ? 'border-indigo-500 bg-indigo-50 shadow-sm'
          : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <Clock size={14} className="text-slate-400" />
          {a.time_slot || '--'}
          <Hash size={12} className="ml-2 text-slate-300" />
          <span className="font-mono text-[11px] text-slate-400">{a.code}</span>
        </div>
        <div className="flex items-center gap-1">
          <StatusBadge status={a.status} />
          <ArrivalBadge value={a.arrival_flag} />
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
        <User size={14} className="text-slate-400" />
        {a.patient?.name || 'Chua co benh nhan'}
      </div>
      <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Phone size={12} /> {a.patient?.phone || '--'}
        </span>
        <span className="inline-flex items-center gap-1">
          <Stethoscope size={12} /> {a.assigned_doctor?.name || 'Chua phan cong'}
        </span>
      </div>
    </button>
  );
};

export default AppointmentRowCard;
