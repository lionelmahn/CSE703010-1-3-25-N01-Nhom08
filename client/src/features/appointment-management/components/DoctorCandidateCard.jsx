import React from 'react';
import { User, AlertTriangle, CheckCircle2 } from 'lucide-react';
import AssignmentFitBadge from './AssignmentFitBadge';

/**
 * UC8 - Card 1 bac si ung vien trong AssignDoctorDialog cot 2.
 */
const REASON_LABEL = {
  in_schedule: 'Co lich lam viec',
  time_free: 'Slot trong',
  specialty_match: 'Khop chuyen mon',
  low_workload: 'Workload thap',
};

const BLOCKER_LABEL = {
  no_schedule: 'Khong co lich lam viec',
  on_leave: 'Dang nghi phep',
  time_conflict: 'Trung khung gio',
  specialty_mismatch: 'Khong dung chuyen mon',
};

const DoctorCandidateCard = ({ candidate, rank, selected, onSelect, disabled = false }) => {
  const hardBlocker = candidate.has_hard_blocker;
  const canSelect = !hardBlocker && !disabled;

  return (
    <button
      type="button"
      onClick={() => canSelect && onSelect?.(candidate)}
      disabled={!canSelect}
      className={`grid w-full grid-cols-[28px_1fr_90px] gap-3 rounded-xl border p-3 text-left text-[12px] transition ${
        selected
          ? 'border-green-400 bg-green-50 ring-2 ring-green-400'
          : hardBlocker
            ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <span
        className={`mt-1 grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
          selected ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700'
        }`}
      >
        {rank}
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-200 text-slate-700">
            <User className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 truncate">{candidate.name}</div>
            <div className="text-[11px] text-slate-500 truncate">
              {candidate.specialty || 'Chua co chuyen mon'}
              {candidate.branch_name ? ` · ${candidate.branch_name}` : ''}
            </div>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {candidate.reasons?.slice(0, 3).map((r) => (
            <span key={r} className="inline-flex items-center gap-1 rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
              <CheckCircle2 className="h-3 w-3" />
              {REASON_LABEL[r] || r}
            </span>
          ))}
          {candidate.blockers?.map((b) => (
            <span key={b} className="inline-flex items-center gap-1 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
              <AlertTriangle className="h-3 w-3" />
              {BLOCKER_LABEL[b] || b}
            </span>
          ))}
        </div>
      </div>
      <div className="text-right">
        <div className="text-base font-bold text-slate-900">{candidate.workload_percent ?? 0}%</div>
        <div className="text-[11px] text-slate-500">Con {candidate.free_slots ?? 0} slot</div>
        <div className="mt-1">
          <AssignmentFitBadge fitLabel={candidate.fit_label} score={candidate.fit_score} blockers={candidate.blockers} />
        </div>
      </div>
    </button>
  );
};

export default DoctorCandidateCard;
