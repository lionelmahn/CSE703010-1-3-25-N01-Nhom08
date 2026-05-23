import React, { useEffect, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
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

const REASON_PRESETS = [
  'Bac si khong the lam',
  'Sai phan cong',
  'Yeu cau benh nhan',
  'Chuyen sang dieu phoi tay',
  'Khac',
];

/**
 * UC8 - Dialog huy phan cong bac si (SR4, AC13).
 *
 * Status quay ve `cho_phan_cong_bac_si`. Bat buoc ly do (5+ ky tu).
 */
const UnassignDoctorDialog = ({
  open,
  onOpenChange,
  appointment,
  onSubmit,
  submitting,
  serverErrors = {},
}) => {
  const [reasonPreset, setReasonPreset] = useState('');
  const [reasonCustom, setReasonCustom] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setReasonPreset('');
      setReasonCustom('');
      setNote('');
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open, appointment?.id]);

  const finalReason = reasonPreset === 'Khac' ? reasonCustom.trim() : reasonPreset;
  const reasonValid = finalReason.length >= 5;

  const handleSubmit = async () => {
    if (!reasonValid) return;
    await onSubmit?.({ reason: finalReason, note: note.trim() || null });
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Huy phan cong bac si</DialogTitle>
          <DialogDescription>
            Lich hen <b>{appointment.code}</b> se quay ve trang thai "Cho phan cong bac si".
          </DialogDescription>
        </DialogHeader>

        <div className="my-3 rounded-lg bg-amber-50 p-3 text-[12px] text-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <div className="font-bold">Luu y</div>
              <ul className="mt-1 list-disc pl-4">
                <li>Bac si <b>{appointment.assigned_doctor?.name || 'hien tai'}</b> se duoc go khoi lich.</li>
                <li>Hanh dong duoc ghi vao lich su dieu phoi.</li>
                <li>Lich hen co the duoc phan cong lai sau do.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <div>
            <Label className="mb-1 block text-xs font-semibold text-slate-700">Ly do huy phan cong *</Label>
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
            <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{serverErrors.status}</div>
          )}
          {serverErrors?.reason && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{serverErrors.reason}</div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Huy</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !reasonValid}
            className="bg-red-600 hover:bg-red-700"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xac nhan go phan cong
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UnassignDoctorDialog;
