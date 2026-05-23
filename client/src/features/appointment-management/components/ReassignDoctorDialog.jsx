import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
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

const REASON_PRESETS = [
  'Bac si hien tai vang dot xuat',
  'Yeu cau benh nhan',
  'Chuyen chuyen mon',
  'Quan ly dieu phoi',
  'Khac',
];

/**
 * UC8 - Dialog doi bac si (SR3, VR13, AC10).
 * - Hien current doctor (left) vs candidates (right).
 * - Bat buoc ly do (5+ ky tu).
 * - Status giu nguyen sau doi.
 */
const ReassignDoctorDialog = ({
  open,
  onOpenChange,
  appointment,
  onSubmit,
  submitting,
  serverErrors = {},
}) => {
  const { candidates, loading, error } = useAvailableDoctors(open ? appointment?.id : null);
  const { getBranchName } = useAppointmentLookups();
  const [selectedId, setSelectedId] = useState(null);
  const [reasonPreset, setReasonPreset] = useState('');
  const [reasonCustom, setReasonCustom] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setSelectedId(null);
      setReasonPreset('');
      setReasonCustom('');
      setNote('');
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open, appointment?.id]);

  const currentDoctorId = appointment?.assigned_doctor?.id;

  const sortedCandidates = useMemo(() => {
    const arr = candidates
      .filter((c) => c.user_id !== currentDoctorId)
      .sort((a, b) => {
        if (a.has_hard_blocker !== b.has_hard_blocker) {
          return a.has_hard_blocker ? 1 : -1;
        }
        return (b.fit_score || 0) - (a.fit_score || 0);
      });
    return arr;
  }, [candidates, currentDoctorId]);

  const selected = sortedCandidates.find((c) => c.user_id === selectedId) || null;

  const finalReason = reasonPreset === 'Khac' ? reasonCustom.trim() : reasonPreset;
  const reasonValid = finalReason.length >= 5;

  const handleSubmit = async () => {
    if (!selected || !reasonValid) return;
    await onSubmit?.({
      doctor_id: selected.user_id,
      reason: finalReason,
      note: note.trim() || null,
    });
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Doi bac si cho {appointment.code}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-[12px] text-slate-500">
          {appointment.code} · {appointment.appointment_date} · {appointment.time_slot} · {getBranchName(appointment.branch_id) || appointment.branch_id || '-'}
        </div>

        <div className="mt-3 grid gap-4 md:grid-cols-[1fr_28px_1fr]">
          <article className="rounded-xl border border-slate-200 p-3 text-[12px]">
            <h4 className="mb-2 font-bold text-slate-900">Bac si hien tai</h4>
            <div className="font-bold">{appointment.assigned_doctor?.name || 'Chua co'}</div>
            <div className="text-[11px] text-slate-500">{appointment.assigned_doctor?.email}</div>
          </article>
          <div className="grid place-items-center">
            <ArrowRight className="h-5 w-5 text-slate-400" />
          </div>
          <article className="rounded-xl border-2 border-dashed border-slate-300 p-3 text-[12px]">
            <h4 className="mb-2 font-bold text-slate-900">Bac si moi</h4>
            <div className={selected ? 'font-bold' : 'text-slate-400'}>
              {selected?.name || 'Chon bac si moi ben duoi'}
            </div>
            {selected && <div className="text-[11px] text-slate-500">{selected.specialty}</div>}
          </article>
        </div>

        <div className="mt-4">
          <h3 className="mb-2 text-[12px] font-extrabold text-slate-900">Danh sach bac si khac</h3>
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Dang tai...</div>
          ) : error ? (
            <div className="rounded bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
          ) : sortedCandidates.length === 0 ? (
            <div className="rounded bg-amber-50 px-3 py-2 text-xs text-amber-700">Khong co bac si khac kha dung.</div>
          ) : (
            <div className="space-y-2">
              {sortedCandidates.slice(0, 5).map((c, idx) => (
                <DoctorCandidateCard
                  key={c.user_id}
                  candidate={c}
                  rank={idx + 1}
                  selected={selectedId === c.user_id}
                  onSelect={(cd) => setSelectedId(cd.user_id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 grid gap-3">
          <div>
            <Label className="mb-1 block text-xs font-semibold text-slate-700">Ly do doi bac si *</Label>
            <select
              value={reasonPreset}
              onChange={(e) => setReasonPreset(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            >
              <option value="">-- Chon ly do --</option>
              {REASON_PRESETS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {reasonPreset === 'Khac' && (
              <Textarea
                className="mt-2"
                rows={2}
                value={reasonCustom}
                onChange={(e) => setReasonCustom(e.target.value)}
                placeholder="Mo ta ly do (it nhat 5 ky tu)..."
              />
            )}
            {!reasonValid && (reasonPreset || reasonCustom) && (
              <p className="mt-1 text-xs text-red-500">Ly do phai co it nhat 5 ky tu.</p>
            )}
          </div>
          <div>
            <Label className="mb-1 block text-xs font-semibold text-slate-700">Ghi chu (tuy chon)</Label>
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          {serverErrors?.status && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertTriangle className="h-4 w-4" /><span>{serverErrors.status}</span>
            </div>
          )}
          {serverErrors?.doctor_id && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertTriangle className="h-4 w-4" /><span>{serverErrors.doctor_id}</span>
            </div>
          )}
          {serverErrors?.reason && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertTriangle className="h-4 w-4" /><span>{serverErrors.reason}</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Huy</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !selected || !reasonValid}
            className="bg-slate-900 hover:bg-slate-800"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xac nhan doi bac si
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReassignDoctorDialog;
