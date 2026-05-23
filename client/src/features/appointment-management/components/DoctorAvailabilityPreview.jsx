import React from 'react';
import { Loader2 } from 'lucide-react';
import useDoctorAvailability from '../hooks/useDoctorAvailability';

/**
 * UC8 - Preview lich lam viec cua bac si trong 1 ngay (cot 3 cua AssignDoctorDialog
 * va dispatch timeline). Hien:
 *  - Danh sach work_schedule + chi nhanh
 *  - Workload bar
 *  - Slot da co appointment khac
 *  - Lich nghi (neu co)
 */
const HOURS = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17'];

const DoctorAvailabilityPreview = ({ userId, date, appointmentSlot, doctorName }) => {
  const { data, loading, error } = useDoctorAvailability(userId, date);

  const usedSlotsSet = new Set();
  (data?.appointments || []).forEach((a) => {
    if (a.time_slot) usedSlotsSet.add(a.time_slot.split('-')[0]);
  });

  return (
    <div className="text-[12px]">
      <div className="mb-3">
        <h4 className="font-extrabold text-slate-900">Xem truoc lich bac si</h4>
        <p className="text-[11px] text-slate-500">{doctorName || 'Bac si'} - {date}</p>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Dang tai lich...
        </div>
      ) : error ? (
        <div className="rounded bg-red-50 px-2 py-1 text-[11px] text-red-700">{error}</div>
      ) : !data || (!data.schedules?.length && !usedSlotsSet.size) ? (
        <div className="rounded bg-amber-50 px-2 py-1 text-[11px] text-amber-700">
          Khong co lich lam viec cho ngay nay.
        </div>
      ) : (
        <>
          <div className="mb-4 flex h-12 items-end gap-1 border-b border-slate-200 pb-1">
            {HOURS.map((h) => {
              const isUsed = usedSlotsSet.has(h);
              const isCurrent = appointmentSlot?.startsWith(h);
              const inSchedule = (data.schedules || []).some(
                (s) => s.start_time && s.end_time && s.start_time.slice(0, 2) <= h && h < s.end_time.slice(0, 2),
              );
              let cls = 'bg-slate-200';
              if (isCurrent) cls = 'bg-emerald-500';
              else if (isUsed) cls = 'bg-amber-400';
              else if (inSchedule) cls = 'bg-emerald-200';
              return <span key={h} title={`${h}:00`} className={`h-8 flex-1 rounded-t ${cls}`} />;
            })}
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="font-semibold text-slate-700">Lich lam viec</div>
            {(data.schedules || []).map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded border border-slate-100 bg-slate-50 px-2 py-1">
                <span className="truncate">{s.branch_name || `CN${s.branch_id}`}</span>
                <span className="font-mono text-[10px] text-slate-700">{s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}</span>
              </div>
            ))}
          </div>

          {data.appointments?.length > 0 && (
            <div className="mt-3 space-y-1.5 text-[11px]">
              <div className="font-semibold text-slate-700">Lich hen ngay nay ({data.appointments.length})</div>
              {data.appointments.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded border border-amber-100 bg-amber-50 px-2 py-1">
                  <span className="font-mono text-[10px]">{a.time_slot}</span>
                  <span className="truncate text-[10px] text-slate-600">{a.code}</span>
                </div>
              ))}
            </div>
          )}

          {data.leaves?.length > 0 && (
            <div className="mt-3 space-y-1.5 text-[11px]">
              <div className="font-semibold text-red-700">Nghi phep</div>
              {data.leaves.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded border border-red-100 bg-red-50 px-2 py-1">
                  <span>{l.from_time || ''} - {l.to_time || ''}</span>
                  <span className="text-[10px] text-red-700">{l.reason}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DoctorAvailabilityPreview;
