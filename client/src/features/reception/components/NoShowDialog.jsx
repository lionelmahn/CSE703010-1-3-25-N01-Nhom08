import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
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
import { NO_SHOW_REASONS_FALLBACK } from '../constants';
import { validateNoShowPayload } from '../validation';

/**
 * UC11 - Dialog mark khong den (A4, AC14, VR12).
 */
const NoShowDialog = ({
  open,
  onOpenChange,
  appointment,
  reasons = NO_SHOW_REASONS_FALLBACK,
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
    const v = validateNoShowPayload(payload);
    setErrors(v);
    if (Object.keys(v).length > 0) return;
    await onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mark khong den - {appointment.code}</DialogTitle>
          <DialogDescription>
            Lich hen se chuyen sang trang thai "khong den" va khong the check-in lai. Vui long chon ly do.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
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
              rows={3}
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
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xac nhan khong den
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NoShowDialog;
