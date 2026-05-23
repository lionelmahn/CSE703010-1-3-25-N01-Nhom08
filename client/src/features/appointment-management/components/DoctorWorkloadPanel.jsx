import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * UC8 - Panel workload bac si (trang dispatch).
 *
 * Hien utilization_percent + free_slots cho moi bac si. Co the click 1 hang
 * de filter timeline / pending queue theo bac si (chua wire o phase nay).
 */
const COLOR_FOR = (pct) => {
  if (pct >= 80) return 'bg-red-500';
  if (pct >= 50) return 'bg-amber-500';
  return 'bg-emerald-500';
};

const DoctorWorkloadPanel = ({ items, loading, date }) => (
  <div className="rounded-xl border border-slate-200 bg-white">
    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
      <div>
        <h3 className="text-sm font-bold text-slate-900">Workload bac si</h3>
        <p className="text-[11px] text-slate-500">{date || 'Hom nay'} · {items.length} bac si</p>
      </div>
      {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
    </div>

    <div className="max-h-[70vh] overflow-y-auto">
      {items.length === 0 && !loading ? (
        <div className="grid place-items-center px-4 py-10 text-center text-xs text-slate-500">
          Khong co bac si nao.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((w) => (
            <li key={w.user_id} className="px-4 py-3">
              <div className="flex items-center justify-between text-[12px]">
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">{w.name || `Bac si #${w.user_id}`}</div>
                  <div className="text-[11px] text-slate-500">
                    {w.on_leave ? 'Dang nghi phep' : !w.has_schedule ? 'Khong co lich' : `${w.free_slots}/${w.total_slots} slot trong`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{w.utilization_percent}%</div>
                  <div className="text-[10px] text-slate-500">utilization</div>
                </div>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                <div
                  className={`h-1.5 rounded-full ${w.on_leave ? 'bg-red-300' : !w.has_schedule ? 'bg-slate-300' : COLOR_FOR(w.utilization_percent)}`}
                  style={{ width: `${Math.min(100, w.utilization_percent || 0)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);

export default DoctorWorkloadPanel;
