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
import { Input } from '@/components/ui/input';
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
import { validateRescheduleForm } from '../validation';
import { useAppointmentOptions } from '../hooks/useAppointmentOptions';

/**
 * UC7 - Dialog doi lich (WF3, VR8, AC11, AC12, AC22).
 */
const RescheduleDialog = ({
  open,
  onOpenChange,
  appointment,
  onSubmit,
  submitting,
  serverErrors = {},
}) => {
  const { time_slots: timeSlots, branches } = useAppointmentOptions('');
  const [form, setForm] = useState({ appointment_date: '', time_slot: '', branch_id: '', reason: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open && appointment) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        appointment_date: appointment.appointment_date || '',
        time_slot: appointment.time_slot || '',
        branch_id: appointment.branch_id || '',
        reason: '',
      });
      setErrors({});
    }
  }, [open, appointment]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setErrors((prev) => ({ ...prev, ...serverErrors }));
  }, [serverErrors]);

  if (!appointment) return null;

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async () => {
    const v = validateRescheduleForm(form, { timeSlots });
    setErrors(v.errors);
    if (!v.ok) return;
    await onSubmit({
      appointment_date: form.appointment_date,
      time_slot: form.time_slot,
      branch_id: form.branch_id || null,
      reason: form.reason.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Doi lich hen {appointment.code}</DialogTitle>
          <DialogDescription>
            Sau khi doi lich, trang thai giu nguyen va he thong se luu lich su thay doi.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div>
            <Label className="mb-1 block text-xs font-semibold text-slate-700">Ngay hen moi *</Label>
            <Input
              type="date"
              value={form.appointment_date}
              onChange={(e) => setField('appointment_date', e.target.value)}
            />
            {errors.appointment_date && <p className="mt-1 text-xs text-red-500">{errors.appointment_date}</p>}
          </div>
          <div>
            <Label className="mb-1 block text-xs font-semibold text-slate-700">Khung gio moi *</Label>
            <Select value={form.time_slot} onValueChange={(v) => setField('time_slot', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Chon khung gio" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((s) => (
                  <SelectItem key={s.id} value={s.id} disabled={s.break}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.time_slot && <p className="mt-1 text-xs text-red-500">{errors.time_slot}</p>}
          </div>
          <div>
            <Label className="mb-1 block text-xs font-semibold text-slate-700">Chi nhanh</Label>
            <Select value={form.branch_id} onValueChange={(v) => setField('branch_id', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Giu nguyen chi nhanh" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.label || b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block text-xs font-semibold text-slate-700">Ly do doi lich *</Label>
            <Textarea
              rows={3}
              value={form.reason}
              onChange={(e) => setField('reason', e.target.value)}
              placeholder="Nhap ly do doi lich (it nhat 3 ky tu)..."
            />
            {errors.reason && <p className="mt-1 text-xs text-red-500">{errors.reason}</p>}
          </div>
          {errors.status && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{errors.status}</div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Huy</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-slate-900 hover:bg-slate-800">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xac nhan doi lich
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleDialog;
