import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { QUEUE_BUCKET_LABELS, QUEUE_BUCKET_ORDER } from '../constants';
import { TONE_CLASSES } from './ArrivalBadge';

/**
 * UC11 - Tab 1 (hang cho) - 4 column bucket (UI8-UI11).
 */
const WaitingQueueBoard = ({ data, onPick }) => {
  const buckets = data?.buckets || {};
  return (
    <div className="grid h-full grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
      {QUEUE_BUCKET_ORDER.map((bucket) => {
        const meta = QUEUE_BUCKET_LABELS[bucket];
        const entries = buckets[bucket] || [];
        return (
          <div
            key={bucket}
            className="flex flex-col rounded-xl border border-slate-200 bg-slate-50/60"
          >
            <div className={`flex items-center justify-between rounded-t-xl border-b px-3 py-2 ${TONE_CLASSES[meta.tone] || ''}`}>
              <span className="text-xs font-semibold uppercase tracking-wide">{meta.title}</span>
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold">{entries.length}</span>
            </div>
            <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
              {entries.length === 0 ? (
                <p className="py-4 text-center text-[11px] text-slate-400">Trong</p>
              ) : (
                entries.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onPick?.(entry)}
                    className={`w-full rounded-lg border bg-white px-2.5 py-2 text-left text-xs shadow-sm transition hover:border-indigo-300 ${
                      entry.overdue ? 'border-red-300' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] text-slate-500">{entry.code}</span>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                        entry.overdue ? 'text-red-600' : 'text-slate-500'
                      }`}>
                        {entry.overdue && <AlertTriangle size={11} />}
                        <Clock size={11} /> {entry.wait_minutes}p
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-800">{entry.patient?.name || '--'}</p>
                    <p className="truncate text-[11px] text-slate-500">
                      {entry.assigned_doctor?.name || 'Chua co BS'} - {entry.appointment?.time_slot || '--'}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WaitingQueueBoard;
