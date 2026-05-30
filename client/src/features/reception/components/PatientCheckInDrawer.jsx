import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Phone,
  Stethoscope,
  User,
  XCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import ArrivalBadge from './ArrivalBadge';
import StatusBadge from './StatusBadge';
import { ARRIVAL_FLAG_LIST } from '../constants';
import { computeArrivalFlag } from '../hooks/useArrivalFlag';
import { validateCheckInPayload } from '../validation';

/**
 * UC11 - Drawer (lon, side-like) hien thi chi tiet lich + canh bao + form check-in.
 *
 * Hien thi (UI3, UI5):
 *  - Patient info card.
 *  - Appointment info card (gio, dich vu, BS).
 *  - Warning list (chua BS, dau goi tre, no, di ung) - tu suy ra tu data.
 *  - Radio chon arrival_flag.
 *  - Note textarea.
 *  - Nut Check-in (chinh) + Cancel.
 *  - Neu da check-in: hien thi nut "Mark khong den" / "Huy check-in" (chi voi quyen).
 */
const PatientCheckInDrawer = ({
  open,
  onOpenChange,
  appointment,
  loading,
  submitting,
  onSubmit,
  onOpenNoShow,
  onOpenCancelCheckIn,
  canCheckIn = true,
  canCancelCheckIn = false,
}) => {
  const [arrivalFlag, setArrivalFlag] = useState('on_time');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});

  const inferred = useMemo(() => {
    if (!appointment) return 'on_time';
    return computeArrivalFlag(appointment);
  }, [appointment]);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setArrivalFlag(appointment?.arrival_flag || inferred);
      setNote('');
      setErrors({});
    }
  }, [open, appointment, inferred]);

  if (!appointment) return null;

  const a = appointment;
  const status = a.status;
  const allowed = a.allowed_actions || {};
  const warnings = [];
  if (!a.assigned_doctor?.id) {
    warnings.push({
      tone: 'warning',
      msg: 'Lich hen chua co bac si - se vao "Chua co bac si" trong hang cho.',
    });
  }
  if ((a.patient?.total_debt || 0) > 0) {
    warnings.push({
      tone: 'warning',
      msg: `Benh nhan dang co cong no: ${Number(a.patient.total_debt).toLocaleString('vi-VN')} d. Vui long thu ngan kiem tra.`,
    });
  }
  if (a.patient?.allergies) {
    warnings.push({
      tone: 'info',
      msg: `Di ung: ${a.patient.allergies}`,
    });
  }
  if (inferred === 'late' || inferred === 'very_late') {
    warnings.push({
      tone: inferred === 'very_late' ? 'danger' : 'warning',
      msg: inferred === 'very_late'
        ? 'Benh nhan den tre nhieu so voi lich.'
        : 'Benh nhan den tre vai phut.',
    });
  }

  const isCheckedIn = status === 'da_check_in';
  const canTransitionCheckIn = canCheckIn && allowed.check_in;
  const canTransitionNoShow = canCheckIn && allowed.no_show;
  const canTransitionCancelCheckIn = canCancelCheckIn && allowed.cancel_check_in;

  const handleSubmit = async () => {
    const payload = { arrival_flag: arrivalFlag, note: note.trim() || undefined };
    const v = validateCheckInPayload(payload);
    setErrors(v);
    if (Object.keys(v).length > 0) return;
    await onSubmit(payload);
  };

  const toneClasses = (tone) => {
    const map = {
      warning: 'border-amber-300 bg-amber-50 text-amber-800',
      danger: 'border-red-300 bg-red-50 text-red-800',
      info: 'border-blue-200 bg-blue-50 text-blue-800',
    };
    return map[tone] || map.info;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardCheck size={18} className="text-indigo-600" />
                Tiep nhan benh nhan
              </DialogTitle>
              <DialogDescription>
                Lich hen <span className="font-mono">{a.code}</span> - <StatusBadge status={status} />
              </DialogDescription>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p className="flex items-center justify-end gap-1">
                <Calendar size={12} /> {a.appointment_date} - {a.time_slot}
              </p>
              {a.checked_in_at && (
                <p className="mt-1 text-emerald-600">
                  Da check-in: {new Date(a.checked_in_at).toLocaleString('vi-VN')}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <p className="py-12 text-center text-sm text-slate-500">Dang tai chi tiet...</p>
        ) : (
          <div className="space-y-3">
            {/* Patient info */}
            <section className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Benh nhan</h3>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <User size={14} className="text-slate-400" /> {a.patient?.name}
                <span className="font-mono text-xs text-slate-400">({a.patient?.code})</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1"><Phone size={12} /> {a.patient?.phone || '--'}</span>
                {a.patient?.gender && <span>Gioi tinh: {a.patient.gender}</span>}
                {a.patient?.birthdate && <span>Sinh: {a.patient.birthdate}</span>}
              </div>
              {a.patient?.medical_history && (
                <p className="mt-1 text-xs text-slate-500">Tien su: {a.patient.medical_history}</p>
              )}
            </section>

            {/* Appointment info */}
            <section className="rounded-lg border border-slate-200 bg-white p-3">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Lich hen</h3>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700">
                <span className="inline-flex items-center gap-1"><Stethoscope size={12} /> {a.assigned_doctor?.name || 'Chua phan cong'}</span>
                {Array.isArray(a.service_ids) && a.service_ids.length > 0 && (
                  <span className="rounded bg-slate-100 px-2 py-0.5">{a.service_ids.length} dich vu</span>
                )}
              </div>
              {a.notes && <p className="mt-1 text-xs text-slate-500">Ghi chu lich: {a.notes}</p>}
            </section>

            {/* Warnings */}
            {warnings.length > 0 && (
              <section className="space-y-1.5">
                {warnings.map((w, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${toneClasses(w.tone)}`}
                  >
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    <span>{w.msg}</span>
                  </div>
                ))}
              </section>
            )}

            {/* Form check-in - chi hien thi khi chua check-in. */}
            {!isCheckedIn && canTransitionCheckIn && (
              <section className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-3">
                <Label className="mb-2 block text-xs font-semibold uppercase text-slate-600">Co thoi gian den</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ARRIVAL_FLAG_LIST.map((flag) => (
                    <label
                      key={flag.value}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-2.5 py-2 text-xs font-medium transition ${
                        arrivalFlag === flag.value
                          ? 'border-indigo-500 ring-2 ring-indigo-100'
                          : 'border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="arrival_flag"
                        value={flag.value}
                        checked={arrivalFlag === flag.value}
                        onChange={() => setArrivalFlag(flag.value)}
                      />
                      <ArrivalBadge value={flag.value} />
                      {arrivalFlag === flag.value && inferred === flag.value && (
                        <span className="ml-auto text-[10px] text-slate-400">(goi y)</span>
                      )}
                    </label>
                  ))}
                </div>
                {errors.arrival_flag && (
                  <p className="mt-1 text-xs text-red-500">{errors.arrival_flag}</p>
                )}

                <Label htmlFor="check-in-note" className="mt-3 mb-1 block text-xs font-semibold uppercase text-slate-600">
                  Ghi chu (khong bat buoc)
                </Label>
                <Textarea
                  id="check-in-note"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Vd: Benh nhan can kham theo yeu cau..."
                />
                {errors.note && <p className="mt-1 text-xs text-red-500">{errors.note}</p>}
              </section>
            )}

            {/* Sau check-in: hien thi info */}
            {isCheckedIn && (
              <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 size={14} /> Da check-in thanh cong
                </div>
                {a.queue_entry && (
                  <p className="mt-1">
                    Ma cho: <span className="font-mono text-sm">{a.queue_entry.code}</span> - Bucket: <strong>{a.queue_entry.bucket}</strong>
                  </p>
                )}
              </section>
            )}
          </div>
        )}

        <DialogFooter className="flex-wrap gap-2">
          {!isCheckedIn && canTransitionNoShow && (
            <Button
              variant="outline"
              type="button"
              onClick={onOpenNoShow}
              disabled={submitting}
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              <XCircle size={14} className="mr-1" /> Mark khong den
            </Button>
          )}
          {isCheckedIn && canTransitionCancelCheckIn && (
            <Button
              variant="outline"
              type="button"
              onClick={onOpenCancelCheckIn}
              disabled={submitting}
              className="border-amber-200 text-amber-700 hover:bg-amber-50"
            >
              Huy check-in
            </Button>
          )}
          <div className="ml-auto flex gap-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={submitting}>
              Dong
            </Button>
            {!isCheckedIn && canTransitionCheckIn && (
              <Button onClick={handleSubmit} disabled={submitting} className="bg-indigo-600 text-white hover:bg-indigo-700">
                {submitting && <Loader2 size={14} className="mr-2 animate-spin" />}
                Check-in
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PatientCheckInDrawer;
