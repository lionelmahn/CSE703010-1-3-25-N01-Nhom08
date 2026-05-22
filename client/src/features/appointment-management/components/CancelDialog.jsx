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
import { validateCancelForm } from '../validation';

/**
 * UC7 - Dialog huy lich (WF4, VR9, VR10, AC13-AC15).
 */
const CancelDialog = ({ open, onOpenChange, appointment, onSubmit, submitting, serverErrors = {} }) => {
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReason('');
      setErrors({});
    }
  }, [open]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setErrors((prev) => ({ ...prev, ...serverErrors }));
  }, [serverErrors]);

  if (!appointment) return null;

  const handleSubmit = async () => {
    const v = validateCancelForm({ reason });
    setErrors(v.errors);
    if (!v.ok) return;
    await onSubmit(reason.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Huy lich hen {appointment.code}</DialogTitle>
          <DialogDescription>
            Lich hen sau khi huy KHONG the khoi phuc o UC7. Vui long ghi ro ly do.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div>
            <Label className="mb-1 block text-xs font-semibold text-slate-700">Ly do huy *</Label>
            <Textarea
              rows={4}
              value={reason}
              onChange={(e) => { setReason(e.target.value); setErrors((p) => ({ ...p, reason: undefined })); }}
              placeholder="Nhap ly do huy lich (it nhat 3 ky tu)..."
            />
            {errors.reason && <p className="mt-1 text-xs text-red-500">{errors.reason}</p>}
          </div>
          {errors.status && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{errors.status}</div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Khong huy</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-red-600 text-white hover:bg-red-700">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xac nhan huy lich
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelDialog;
