import React from 'react';
import { Activity, Clock, Stethoscope, Users } from 'lucide-react';
import useReceptionQueue from '@/features/reception/hooks/useReceptionQueue';
import { QUEUE_BUCKET_LABELS, QUEUE_BUCKET_ORDER } from '@/features/reception/constants';
import { TONE_CLASSES } from '@/features/reception/components/ArrivalBadge';

/**
 * UC11 - Dashboard bac si voi widget "Hang cho cua toi".
 *
 * Goi /api/reception/queue?doctor_id=me - server resolve user.id tu auth.
 */
export default function DoctorDashboard() {
  const { data, loading } = useReceptionQueue({ doctorId: 'me' });
  const buckets = data?.buckets || {};
  const summary = data?.summary || {};

  return (
    <div className="space-y-4 p-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-teal-700">
        <Stethoscope size={22} /> Bang dieu khien bac si
      </h1>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800">
              <Users size={18} className="text-indigo-600" /> Hang cho cua toi
            </h2>
            <p className="text-xs text-slate-500">Cap nhat moi 15s. Bao gom BN dang cho + dang kham.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs md:flex md:items-center md:gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">
              <Clock size={11} className="mr-1 inline" /> Dang cho: {summary.waiting ?? 0}
            </span>
            <span className="rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-700">
              <Activity size={11} className="mr-1 inline" /> Dang kham: {summary.in_progress ?? 0}
            </span>
          </div>
        </div>

        {loading && (data?.summary?.total_active ?? 0) === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">Dang tai...</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
            {QUEUE_BUCKET_ORDER.map((bucket) => {
              const meta = QUEUE_BUCKET_LABELS[bucket];
              const entries = buckets[bucket] || [];
              return (
                <div key={bucket} className="rounded-xl border border-slate-200 bg-slate-50/60">
                  <div className={`flex items-center justify-between rounded-t-xl border-b px-3 py-2 ${TONE_CLASSES[meta.tone] || ''}`}>
                    <span className="text-xs font-semibold uppercase tracking-wide">{meta.title}</span>
                    <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold">{entries.length}</span>
                  </div>
                  <div className="max-h-72 space-y-1.5 overflow-y-auto p-2">
                    {entries.length === 0 ? (
                      <p className="py-4 text-center text-[11px] text-slate-400">Trong</p>
                    ) : (
                      entries.map((entry) => (
                        <div key={entry.id} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] text-slate-500">{entry.code}</span>
                            <span className="text-[11px] font-semibold text-slate-500">
                              {entry.wait_minutes}p
                            </span>
                          </div>
                          <p className="mt-1 truncate text-sm font-semibold text-slate-800">{entry.patient?.name}</p>
                          <p className="truncate text-[11px] text-slate-500">{entry.appointment?.time_slot}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <p className="text-slate-600">
          Cac chuc nang bat dau kham + ghi nhan benh an se duoc tich hop o UC3.2 trong cac iteration tiep theo.
        </p>
      </section>
    </div>
  );
}
