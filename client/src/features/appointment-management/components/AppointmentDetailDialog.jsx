import React from 'react';
import { Loader2, CalendarClock, Phone, Mail, MapPin, Stethoscope, FileText, History } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import StatusBadge from './StatusBadge';
import {
  APPOINTMENT_SOURCE_LABEL,
  HISTORY_ACTION_LABEL,
  APPOINTMENT_STATUS_LABEL,
} from '../constants';
import { canCancel, canReschedule } from '../validation';
import { useAppointmentLookups } from '../hooks/useAppointmentLookups';

const formatDate = (d) => {
  if (!d) return '-';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString('vi-VN');
};

const formatDateTime = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('vi-VN');
};

const formatSlot = (slot) => {
  if (!slot) return '-';
  if (slot === '17-1730') return '17:00 - 17:30';
  const [a, b] = slot.split('-');
  return `${a}:00 - ${b}:00`;
};

/**
 * UC7 + UC8 - Dialog chi tiet lich hen + lich su (AC4, AC17).
 * Bo sung 3 nut UC8 (assign/reassign/unassign) khi `allowed_actions` cho phep.
 */
const AppointmentDetailDialog = ({
  open,
  onOpenChange,
  appointment,
  loading,
  onReschedule,
  onCancel,
  onAssign,
  onReassign,
  onUnassign,
  canMutate = true,
}) => {
  const { getBranchName, getServiceNames } = useAppointmentLookups();
  const branchLabel = appointment ? (getBranchName(appointment.branch_id) || appointment.branch_id || '-') : '-';
  const serviceLabels = appointment ? getServiceNames(appointment.service_ids) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Chi tiet lich hen
            {appointment && <span className="font-mono text-xs text-slate-500">{appointment.code}</span>}
          </DialogTitle>
          <DialogDescription>
            Xem thong tin chi tiet, lich su thay doi. Cac hanh dong cho phep duoc kiem soat theo trang thai.
          </DialogDescription>
        </DialogHeader>

        {loading || !appointment ? (
          <div className="flex items-center justify-center py-10 text-sm text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Dang tai...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="flex items-center gap-3 text-sm">
                <CalendarClock className="h-5 w-5 text-slate-500" />
                <div>
                  <div className="font-semibold text-slate-800">
                    {formatDate(appointment.appointment_date)} | {formatSlot(appointment.time_slot)}
                  </div>
                  <div className="text-xs text-slate-500">
                    Chi nhanh: {branchLabel} | Nguon: {APPOINTMENT_SOURCE_LABEL[appointment.source] || appointment.source}
                  </div>
                  {serviceLabels.length > 0 && (
                    <div className="text-xs text-slate-500">
                      Dich vu: {serviceLabels.join(', ')}
                    </div>
                  )}
                </div>
              </div>
              <StatusBadge status={appointment.status} size="md" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <section className="rounded-xl border border-slate-200 p-3">
                <h4 className="mb-2 text-xs font-bold uppercase text-slate-500">Benh nhan</h4>
                {appointment.patient ? (
                  <div className="space-y-1 text-sm text-slate-700">
                    <div className="font-semibold text-slate-800">{appointment.patient.name}</div>
                    <div className="text-xs text-slate-500">Ma: {appointment.patient.code}</div>
                    <div className="flex items-center gap-2 text-xs"><Phone className="h-3 w-3" /> {appointment.patient.phone || '-'}</div>
                    {appointment.patient.email && <div className="flex items-center gap-2 text-xs"><Mail className="h-3 w-3" /> {appointment.patient.email}</div>}
                    {appointment.patient.address && <div className="flex items-center gap-2 text-xs"><MapPin className="h-3 w-3" /> {appointment.patient.address}</div>}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Chua co ho so benh nhan gan voi lich hen.</p>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 p-3">
                <h4 className="mb-2 text-xs font-bold uppercase text-slate-500">Phan cong & ghi chu</h4>
                <div className="space-y-1 text-sm text-slate-700">
                  <div className="flex items-center gap-2 text-xs">
                    <Stethoscope className="h-3 w-3" />
                    Bac si: {appointment.assigned_doctor?.name || <span className="text-slate-400">Chua phan cong</span>}
                  </div>
                  {appointment.online_booking_request_code && (
                    <div className="text-xs">Yeu cau online lien quan: <span className="font-mono">{appointment.online_booking_request_code}</span></div>
                  )}
                  {appointment.notes && (
                    <div className="flex items-start gap-2 text-xs"><FileText className="h-3 w-3 mt-0.5" /> {appointment.notes}</div>
                  )}
                  {appointment.reschedule_reason && (
                    <div className="text-xs text-amber-700">Ly do doi gan nhat: {appointment.reschedule_reason}</div>
                  )}
                  {appointment.cancel_reason && (
                    <div className="text-xs text-red-700">Ly do huy: {appointment.cancel_reason}</div>
                  )}
                </div>
              </section>
            </div>

            <section className="rounded-xl border border-slate-200 p-3">
              <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
                <History className="h-3.5 w-3.5" /> Lich su thay doi
              </h4>
              {(appointment.history || []).length === 0 ? (
                <p className="text-xs text-slate-500">Chua co thao tac nao.</p>
              ) : (
                <ol className="space-y-2">
                  {(appointment.history || []).map((h) => (
                    <li key={h.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">
                          {HISTORY_ACTION_LABEL[h.action] || h.action}
                        </span>
                        <span className="text-slate-500">{formatDateTime(h.at)}</span>
                      </div>
                      <div className="text-slate-600">
                        Boi: <b>{h.actor || 'He thong'}</b>
                        {h.from_status && h.to_status && h.from_status !== h.to_status && (
                          <> | {APPOINTMENT_STATUS_LABEL[h.from_status] || h.from_status} -&gt; {APPOINTMENT_STATUS_LABEL[h.to_status] || h.to_status}</>
                        )}
                      </div>
                      {h.reason && <div className="mt-1 italic text-slate-500">Ly do: {h.reason}</div>}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        )}

        <DialogFooter className="flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Dong</Button>
          {appointment && canMutate && appointment.allowed_actions?.assign && onAssign && (
            <Button size="sm" onClick={onAssign} className="bg-emerald-600 text-white hover:bg-emerald-700">
              Phan cong bac si
            </Button>
          )}
          {appointment && canMutate && appointment.allowed_actions?.reassign && onReassign && (
            <Button variant="outline" size="sm" onClick={onReassign} className="border-indigo-300 text-indigo-700 hover:bg-indigo-50">
              Doi bac si
            </Button>
          )}
          {appointment && canMutate && appointment.allowed_actions?.unassign && onUnassign && (
            <Button variant="outline" size="sm" onClick={onUnassign} className="border-orange-300 text-orange-700 hover:bg-orange-50">
              Go phan cong
            </Button>
          )}
          {appointment && canMutate && canReschedule(appointment) && onReschedule && (
            <Button variant="outline" size="sm" onClick={onReschedule} className="border-amber-300 text-amber-700 hover:bg-amber-50">
              Doi lich
            </Button>
          )}
          {appointment && canMutate && canCancel(appointment) && onCancel && (
            <Button size="sm" onClick={onCancel} className="bg-red-600 text-white hover:bg-red-700">
              Huy lich
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDetailDialog;
