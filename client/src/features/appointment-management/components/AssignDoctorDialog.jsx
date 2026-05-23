import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import useAvailableDoctors from '../hooks/useAvailableDoctors';
import { useAppointmentLookups } from '../hooks/useAppointmentLookups';
import DoctorCandidateCard from './DoctorCandidateCard';
import DoctorAvailabilityPreview from './DoctorAvailabilityPreview';

/**
 * UC8 - Dialog phan cong bac si (SR1, VR3-VR7, AC1).
 *
 * Layout 3 cot: thong tin lich hen (trai) - danh sach ung vien (giua) -
 * preview lich bac si chon (phai). Co the chon hide cot 3 tren mobile.
 */
const AssignDoctorDialog = ({
  open,
  onOpenChange,
  appointment,
  onSubmit,
  submitting,
  serverErrors = {},
}) => {
  const { candidates, loading, error } = useAvailableDoctors(open ? appointment?.id : null);
  const { getBranchName, getServiceNames } = useAppointmentLookups();
  const [selectedId, setSelectedId] = useState(null);
  const [note, setNote] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setSelectedId(null);
      setNote('');
      setShowAll(false);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open, appointment?.id]);

  const selected = candidates.find((c) => c.user_id === selectedId) || null;

  const sortedCandidates = useMemo(() => {
    const arr = [...candidates];
    arr.sort((a, b) => {
      if (a.has_hard_blocker !== b.has_hard_blocker) {
        return a.has_hard_blocker ? 1 : -1;
      }
      return (b.fit_score || 0) - (a.fit_score || 0);
    });
    return arr;
  }, [candidates]);

  const visibleCandidates = showAll ? sortedCandidates : sortedCandidates.slice(0, 5);

  const handleSubmit = async () => {
    if (!selected) return;
    await onSubmit?.({ doctor_id: selected.user_id, note: note.trim() || null });
  };

  if (!appointment) return null;

  const branchLabel = getBranchName(appointment.branch_id) || appointment.branch_id || '-';
  const serviceLabels = getServiceNames(appointment.service_ids);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[96vw] max-h-[92vh] overflow-hidden p-0">
        <DialogHeader className="border-b border-slate-200 px-5 py-3">
          <DialogTitle className="text-base font-bold">Phan cong bac si cho {appointment.code}</DialogTitle>
        </DialogHeader>

        <div className="grid max-h-[78vh] overflow-y-auto grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)_280px]">
          <aside className="border-b border-slate-200 p-4 text-[12px] lg:border-b-0 lg:border-r">
            <h3 className="mb-3 text-[11px] font-extrabold uppercase tracking-wide text-slate-600">Thong tin lich hen</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-slate-500">Ma lich hen</dt>
                <dd className="font-bold">{appointment.code}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Thoi gian</dt>
                <dd className="font-bold">
                  {appointment.appointment_date}<br />
                  {appointment.time_slot}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Dich vu</dt>
                <dd className="font-bold break-words">
                  {serviceLabels.length > 0 ? serviceLabels.join(', ') : 'Chua chon'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Chi nhanh</dt>
                <dd className="font-bold break-words">{branchLabel}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Benh nhan</dt>
                <dd className="font-bold break-words">{appointment.patient?.name}</dd>
                <dd className="text-[11px] text-slate-500">{appointment.patient?.phone}</dd>
              </div>
            </dl>
          </aside>

          <div className="min-w-0 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[12px] font-extrabold text-slate-900">
                Goi y bac si <span className="font-normal text-slate-500">({sortedCandidates.length} ung vien)</span>
              </h3>
              {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
            </div>

            {error ? (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
            ) : !loading && sortedCandidates.length === 0 ? (
              <div className="rounded-lg bg-amber-50 p-4 text-center text-xs text-amber-700">
                Khong tim thay bac si phu hop. Vui long kiem tra lich lam viec hoac chuyen mon.
              </div>
            ) : (
              <div className="space-y-2.5">
                {visibleCandidates.map((c, idx) => (
                  <DoctorCandidateCard
                    key={c.user_id}
                    candidate={c}
                    rank={idx + 1}
                    selected={selectedId === c.user_id}
                    onSelect={(cd) => setSelectedId(cd.user_id)}
                  />
                ))}
                {sortedCandidates.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setShowAll((v) => !v)}
                    className="w-full rounded-lg border border-dashed border-slate-300 py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {showAll ? 'Thu gon' : `Xem them ${sortedCandidates.length - 5} bac si`}
                  </button>
                )}
              </div>
            )}

            <div className="mt-4">
              <Label className="mb-1 block text-xs font-semibold text-slate-700">Ghi chu (tuy chon)</Label>
              <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chu bo sung..." />
            </div>

            {serverErrors?.status && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span>{serverErrors.status}</span>
              </div>
            )}
            {serverErrors?.doctor_id && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span>{serverErrors.doctor_id}</span>
              </div>
            )}
          </div>

          <aside className="border-t border-slate-200 p-4 lg:border-t-0 lg:border-l">
            {selected ? (
              <DoctorAvailabilityPreview
                userId={selected.user_id}
                date={appointment.appointment_date}
                appointmentSlot={appointment.time_slot}
                doctorName={selected.name}
              />
            ) : (
              <div className="grid h-full min-h-[120px] place-items-center text-center text-[11px] text-slate-500">
                Chon 1 bac si o cot giua de xem chi tiet lich.
              </div>
            )}
          </aside>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Huy</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !selected}
            className="bg-slate-900 hover:bg-slate-800"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xac nhan phan cong
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignDoctorDialog;
