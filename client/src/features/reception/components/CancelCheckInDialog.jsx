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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CANCEL_CHECK_IN_REASONS_FALLBACK } from '../constants';
import { validateCancelCheckInPayload } from '../validation';

/**
 * UC11 - Dialog huy check-in (A5, VR10, VR14). Chi user co quyen
 * `appointments.cancel_check_in` (mac dinh admin).
 */
const CancelCheckInDialog = ({
  open,
  onOpenChange,
  appointment,
  reasons = CANCEL_CHECK_IN_REASONS_FALLBACK,
  onSubmit,
  submitting,
  serverErrors = {},
}) => {
  const [reasonId, setReasonId] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReasonId('');
      setReasonText('');
      setNote('');
      setErrors({});
    }
  }, [open]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setErrors((prev) => ({ ...prev, ...serverErrors }));
  }, [serverErrors]);

  if (!appointment) return null;

  const handleSubmit = async () => {
    const reason = reasonId === 'khac' ? reasonText : (reasons.find((r) => r.id === reasonId)?.label || '');
    const payload = { reason: reason.trim(), note: note.trim() || undefined };
    const v = validateCancelCheckInPayload(payload);
    setErrors(v);
    if (Object.keys(v).length > 0) return;
    await onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Huy check-in - {appointment.code}</DialogTitle>
          <DialogDescription>
            Trang thai se duoc tra lai status truoc check-in. Action nay duoc luu vao lich su.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>Chi su dung khi check-in nham hoac benh nhan doi y. Khong dung de huy lich (dung "Huy lich" o UC7).</span>
          </div>
          <div>
            <Label className="mb-1 block text-xs font-semibold text-slate-700">Ly do *</Label>
            <Select value={reasonId} onValueChange={setReasonId}>
              <SelectTrigger>
                <SelectValue placeholder="Chon ly do..." />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {reasonId === 'khac' && (
            <div>
              <Label className="mb-1 block text-xs font-semibold text-slate-700">Mo ta ly do *</Label>
              <Textarea
                rows={2}
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder="Nhap ly do cu the..."
              />
            </div>
          )}
          {errors.reason && <p className="text-xs text-red-500">{errors.reason}</p>}

          <div>
            <Label className="mb-1 block text-xs font-semibold text-slate-700">Ghi chu</Label>
            <Textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chu noi bo..."
            />
            {errors.note && <p className="mt-1 text-xs text-red-500">{errors.note}</p>}
          </div>

          {errors.status && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{errors.status}</div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Khong</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-amber-600 text-white hover:bg-amber-700"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xac nhan huy check-in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelCheckInDialog;
