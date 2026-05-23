import React from 'react';
import { Clock, AlertTriangle, ChevronRight, Loader2 } from 'lucide-react';
import { useAppointmentLookups } from '../hooks/useAppointmentLookups';

/**
 * UC8 - Queue lich hen `cho_phan_cong_bac_si` cho trang dispatch.
 *
 * Compute priority UI-only theo (status + days_to_appointment):
 *  - Cao: appointment_date <= today + 1 OR overdue.
 *  - Trung binh: today+2 .. today+5.
 *  - Thap: > today+5.
 */
const PRIORITY_STYLE = {
  high: { className: 'bg-red-100 text-red-700 border-red-200', label: 'Uu tien cao' },
  medium: { className: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Trung binh' },
  low: { className: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Thap' },
};

const computePriority = (apt) => {
  if (!apt?.appointment_date) return 'medium';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const apptDate = new Date(apt.appointment_date);
  const diffDays = Math.ceil((apptDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) return 'high';
  if (diffDays <= 5) return 'medium';
  return 'low';
};

const formatDate = (d) => {
  if (!d) return '-';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString('vi-VN');
};

const PendingAssignmentQueue = ({ items, loading, error, onSelect, total, page, setPage, lastPage }) => {
  const { getBranchName } = useAppointmentLookups();
  return (
  <div className="rounded-xl border border-slate-200 bg-white">
    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
      <div>
        <h3 className="text-sm font-bold text-slate-900">Lich hen cho phan cong</h3>
        <p className="text-[11px] text-slate-500">Tong: {total ?? items.length} lich hen</p>
      </div>
      {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
    </div>

    <div className="max-h-[70vh] overflow-y-auto">
      {error ? (
        <div className="m-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
      ) : items.length === 0 && !loading ? (
        <div className="grid place-items-center px-4 py-10 text-center text-xs text-slate-500">
          Khong co lich hen cho phan cong.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((apt) => {
            const priority = computePriority(apt);
            const cfg = PRIORITY_STYLE[priority];
            return (
              <li key={apt.id}>
                <button
                  type="button"
                  onClick={() => onSelect?.(apt)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
                >
                  <span className={`grid h-10 w-10 place-items-center rounded-lg border ${cfg.className}`}>
                    {priority === 'high' ? <AlertTriangle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{apt.code}</span>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${cfg.className}`}>{cfg.label}</span>
                    </div>
                    <div className="mt-0.5 text-[12px] text-slate-700">
                      {apt.patient?.name || 'Khong xac dinh'} · {apt.patient?.phone || ''}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      {formatDate(apt.appointment_date)} · {apt.time_slot} · {getBranchName(apt.branch_id) || apt.branch_id || '-'}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>

    {lastPage > 1 && (
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-[11px]">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage?.(page - 1)}
          className="rounded border border-slate-200 px-2 py-1 disabled:opacity-50"
        >
          Truoc
        </button>
        <span className="text-slate-600">Trang {page} / {lastPage}</span>
        <button
          type="button"
          disabled={page >= lastPage}
          onClick={() => setPage?.(page + 1)}
          className="rounded border border-slate-200 px-2 py-1 disabled:opacity-50"
        >
          Sau
        </button>
      </div>
    )}
  </div>
  );
};

export default PendingAssignmentQueue;
