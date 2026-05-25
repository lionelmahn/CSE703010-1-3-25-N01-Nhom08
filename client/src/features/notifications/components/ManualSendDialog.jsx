import React, { useState } from 'react';
import { Send } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { notificationApi } from '@/api/notificationApi';

import { MANUAL_DISPATCH_TYPES, NOTIFICATION_TYPE_LABEL } from '../constants';

/**
 * UC10 - Dialog gui thong bao thu cong. Cho phep gan vao appointment hoac
 * online_booking_request, kem ghi chu noi dung va recipient override khi
 * type = manual_generic.
 */
const ManualSendDialog = ({
  trigger,
  hasPermission = true,
  defaultAppointmentId = null,
  defaultOnlineBookingRequestId = null,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    type: MANUAL_DISPATCH_TYPES[0],
    appointment_id: defaultAppointmentId || '',
    online_booking_request_id: defaultOnlineBookingRequestId || '',
    note: '',
    recipient_email: '',
  });

  if (!hasPermission) return null;

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const submit = async () => {
    if (!form.type) {
      toast({ variant: 'destructive', title: 'Loi', description: 'Chua chon loai thong bao.' });
      return;
    }
    if (!form.appointment_id && !form.online_booking_request_id) {
      toast({ variant: 'destructive', title: 'Loi', description: 'Phai chon Appointment hoac Online Booking Request.' });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        type: form.type,
        appointment_id: form.appointment_id ? Number(form.appointment_id) : null,
        online_booking_request_id: form.online_booking_request_id ? Number(form.online_booking_request_id) : null,
        note: form.note || null,
        recipient_email: form.recipient_email || null,
      };
      const res = await notificationApi.sendManual(payload);
      toast({ title: 'Da gui', description: `Ma thong bao: ${res?.data?.code || ''}` });
      setOpen(false);
      onSuccess?.(res?.data);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Khong the gui thong bao.';
      toast({ variant: 'destructive', title: 'Loi', description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button type="button" variant="default">
            <Send className="mr-1 size-4" /> Gui thu cong
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Gui thong bao thu cong</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <Label>Loai thong bao</Label>
            <Select value={form.type} onValueChange={(v) => setField('type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MANUAL_DISPATCH_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{NOTIFICATION_TYPE_LABEL[t] || t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Appointment ID</Label>
              <Input
                type="number"
                value={form.appointment_id}
                onChange={(e) => setField('appointment_id', e.target.value)}
                placeholder="VD: 12"
                disabled={!!defaultAppointmentId}
              />
            </div>
            <div>
              <Label>Online Booking Request ID</Label>
              <Input
                type="number"
                value={form.online_booking_request_id}
                onChange={(e) => setField('online_booking_request_id', e.target.value)}
                placeholder="VD: 7"
                disabled={!!defaultOnlineBookingRequestId}
              />
            </div>
          </div>
          <div>
            <Label>Email nguoi nhan (tuy chon - override)</Label>
            <Input
              type="email"
              value={form.recipient_email}
              onChange={(e) => setField('recipient_email', e.target.value)}
              placeholder="Bo trong de dung email mac dinh"
            />
          </div>
          <div>
            <Label>Ghi chu noi dung (tuy chon)</Label>
            <Textarea
              rows={3}
              value={form.note}
              onChange={(e) => setField('note', e.target.value)}
              placeholder="Noi dung bo sung neu template ho tro bien {{note}}."
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Huy</Button>
          <Button type="button" onClick={submit} disabled={submitting}>{submitting ? 'Dang gui...' : 'Gui'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManualSendDialog;
