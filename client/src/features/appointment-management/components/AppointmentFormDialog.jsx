import React, { useEffect, useMemo, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAppointmentOptions } from '../hooks/useAppointmentOptions';
import { validateCreateForm } from '../validation';
import { APPOINTMENT_SOURCE } from '../constants';

const EMPTY_FORM = {
  patient_id: '',
  appointment_date: '',
  time_slot: '',
  branch_id: '',
  source: APPOINTMENT_SOURCE.WALK_IN,
  service_ids: [],
  notes: '',
};

/**
 * UC7 - Dialog tao lich hen tai quay (AC5, AC6, AC7, AC8, AC10).
 *
 * Goi API that POST /api/appointments. Backend re-validate VR1-VR6/VR14.
 */
const AppointmentFormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  submitting,
  serverErrors = {},
  initialValues = null,
}) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [patientQuery, setPatientQuery] = useState('');
  const [errors, setErrors] = useState({});

  const { patients, branches, sources, time_slots: timeSlots, loading: optsLoading } = useAppointmentOptions(patientQuery);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({ ...EMPTY_FORM, ...(initialValues || {}) });
      setErrors({});
      setPatientQuery('');
    }
  }, [open, initialValues]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setErrors((prev) => ({ ...prev, ...serverErrors }));
  }, [serverErrors]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const selectedPatient = useMemo(() => patients.find((p) => String(p.id) === String(form.patient_id)) || null, [patients, form.patient_id]);

  const handleSubmit = async () => {
    const v = validateCreateForm(form, { timeSlots });
    setErrors(v.errors);
    if (!v.ok) return;
    await onSubmit({
      patient_id: Number(form.patient_id),
      appointment_date: form.appointment_date,
      time_slot: form.time_slot,
      branch_id: form.branch_id,
      source: form.source,
      service_ids: form.service_ids,
      notes: form.notes || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tao lich hen moi (UC7)</DialogTitle>
          <DialogDescription>
            Trang thai mac dinh khi tao moi la <b>Cho phan cong bac si</b>.
            Phan cong bac si se duoc thuc hien o UC8.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div>
            <Label className="mb-1 block text-xs font-semibold text-slate-700">Tim ho so benh nhan</Label>
            <Input
              placeholder="Nhap ten, SDT hoac ma benh nhan..."
              value={patientQuery}
              onChange={(e) => setPatientQuery(e.target.value)}
            />
          </div>

          <div>
            <Label className="mb-1 block text-xs font-semibold text-slate-700">Benh nhan *</Label>
            <Select value={form.patient_id ? String(form.patient_id) : ''} onValueChange={(v) => setField('patient_id', v)}>
              <SelectTrigger>
                <SelectValue placeholder={optsLoading ? 'Dang tai danh sach benh nhan...' : 'Chon benh nhan'} />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name} - {p.phone} ({p.code})
                  </SelectItem>
                ))}
                {patients.length === 0 && (
                  <div className="px-3 py-2 text-xs text-slate-500">Khong tim thay benh nhan phu hop.</div>
                )}
              </SelectContent>
            </Select>
            {errors.patient_id && <p className="mt-1 text-xs text-red-500">{errors.patient_id}</p>}
            {selectedPatient && (
              <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <div className="font-semibold text-slate-800">{selectedPatient.name}</div>
                <div>Ma: {selectedPatient.code} | SDT: {selectedPatient.phone}</div>
                {selectedPatient.email && <div>Email: {selectedPatient.email}</div>}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block text-xs font-semibold text-slate-700">Ngay hen *</Label>
              <Input
                type="date"
                value={form.appointment_date}
                onChange={(e) => setField('appointment_date', e.target.value)}
              />
              {errors.appointment_date && <p className="mt-1 text-xs text-red-500">{errors.appointment_date}</p>}
            </div>
            <div>
              <Label className="mb-1 block text-xs font-semibold text-slate-700">Khung gio *</Label>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block text-xs font-semibold text-slate-700">Chi nhanh *</Label>
              <Select value={form.branch_id} onValueChange={(v) => setField('branch_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chon chi nhanh" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.label || b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.branch_id && <p className="mt-1 text-xs text-red-500">{errors.branch_id}</p>}
            </div>
            <div>
              <Label className="mb-1 block text-xs font-semibold text-slate-700">Nguon</Label>
              <Select value={form.source} onValueChange={(v) => setField('source', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chon nguon" />
                </SelectTrigger>
                <SelectContent>
                  {sources.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="mb-1 block text-xs font-semibold text-slate-700">Ghi chu</Label>
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              placeholder="Ghi chu cho le tan/bac si neu can..."
            />
          </div>

          {errors.status && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              {errors.status}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Huy
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-slate-900 hover:bg-slate-800">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tao lich hen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentFormDialog;
