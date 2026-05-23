import React, { useCallback, useEffect, useState } from 'react';
import { Stethoscope } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { appointmentApi } from '@/api/appointmentApi';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import useDoctorDispatch from '@/features/appointment-management/hooks/useDoctorDispatch';
import useAppointmentOptions from '@/features/appointment-management/hooks/useAppointmentOptions';
import PendingAssignmentQueue from '@/features/appointment-management/components/PendingAssignmentQueue';
import DoctorWorkloadPanel from '@/features/appointment-management/components/DoctorWorkloadPanel';
import AssignDoctorDialog from '@/features/appointment-management/components/AssignDoctorDialog';
import ReassignDoctorDialog from '@/features/appointment-management/components/ReassignDoctorDialog';
import UnassignDoctorDialog from '@/features/appointment-management/components/UnassignDoctorDialog';
import AppointmentDetailDialog from '@/features/appointment-management/components/AppointmentDetailDialog';

/**
 * UC8 - Trang dieu phoi bac si (Receptionist / Admin).
 *
 * Layout: [Pending Queue 60%] [Workload Panel 40%]. Chon 1 lich hen tu queue
 * mo AppointmentDetailDialog ben tren - tu day moi assign/reassign/unassign.
 *
 * Workload panel chi de tham khao (status workload theo ngay duoc filter).
 */
const DoctorDispatch = () => {
  const { toast } = useToast();
  const { userRole, hasPermission } = useAuth();
  const canAssign = userRole === 'admin' || hasPermission?.('appointments.assign');
  const canReassign = userRole === 'admin' || hasPermission?.('appointments.reassign');
  const canUnassign = userRole === 'admin' || hasPermission?.('appointments.unassign');
  const canMutate = canAssign || canReassign || canUnassign;

  const dispatch = useDoctorDispatch();
  const { branches } = useAppointmentOptions('');

  const [activeAppointment, setActiveAppointment] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [unassignOpen, setUnassignOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState({});

  const handleError = useCallback((err, defaultMessage) => {
    const data = err?.response?.data;
    const messages = data?.errors || {};
    setServerErrors(Object.fromEntries(Object.entries(messages).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])));
    toast({
      variant: 'destructive',
      title: 'Co loi xay ra',
      description: data?.message || err?.message || defaultMessage,
    });
  }, [toast]);

  const loadDetail = useCallback(async (id) => {
    setDetailLoading(true);
    try {
      const apt = await appointmentApi.show(id);
      setActiveAppointment(apt);
    } catch (err) {
      handleError(err, 'Khong the tai chi tiet lich hen.');
    } finally {
      setDetailLoading(false);
    }
  }, [handleError]);

  const handleSelect = (apt) => {
    setActiveAppointment(apt);
    setDetailOpen(true);
    loadDetail(apt.id);
  };

  const handleAssign = async (payload) => {
    if (!activeAppointment) return;
    setSubmitting(true);
    setServerErrors({});
    try {
      const res = await appointmentApi.assignDoctor(activeAppointment.id, payload);
      toast({ title: 'Da phan cong bac si', description: res?.data?.assigned_doctor?.name });
      setAssignOpen(false);
      await Promise.all([loadDetail(activeAppointment.id), dispatch.refresh()]);
    } catch (err) {
      handleError(err, 'Khong the phan cong.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReassign = async (payload) => {
    if (!activeAppointment) return;
    setSubmitting(true);
    setServerErrors({});
    try {
      const res = await appointmentApi.reassignDoctor(activeAppointment.id, payload);
      toast({ title: 'Da doi bac si', description: res?.data?.assigned_doctor?.name });
      setReassignOpen(false);
      await Promise.all([loadDetail(activeAppointment.id), dispatch.refresh()]);
    } catch (err) {
      handleError(err, 'Khong the doi bac si.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnassign = async (payload) => {
    if (!activeAppointment) return;
    setSubmitting(true);
    setServerErrors({});
    try {
      const res = await appointmentApi.unassignDoctor(activeAppointment.id, payload);
      toast({ title: 'Da go phan cong', description: res?.data?.code });
      setUnassignOpen(false);
      await Promise.all([loadDetail(activeAppointment.id), dispatch.refresh()]);
    } catch (err) {
      handleError(err, 'Khong the go phan cong.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    document.title = 'Dieu phoi bac si | Dental Pro';
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <Stethoscope size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Dieu phoi bac si</h3>
            <p className="text-xs text-slate-500">Phan cong, doi va go bac si cho lich hen trong ngay.</p>
          </div>
        </div>
        <Button onClick={dispatch.refresh} variant="outline" size="sm">Lam moi</Button>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[180px_180px_1fr]">
          <div>
            <Label className="mb-1 block text-xs font-semibold text-slate-700">Chi nhanh</Label>
            <Select value={dispatch.filters.branch_id} onValueChange={(v) => dispatch.setFilter('branch_id', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Tat ca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tat ca</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>{b.label || b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block text-xs font-semibold text-slate-700">Ngay</Label>
            <Input
              type="date"
              value={dispatch.filters.date}
              onChange={(e) => dispatch.setFilter('date', e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs font-semibold text-slate-700">Tim kiem</Label>
            <Input
              placeholder="Ma lich hen / ten benh nhan / SDT"
              value={dispatch.filters.q}
              onChange={(e) => dispatch.setFilter('q', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <PendingAssignmentQueue
          items={dispatch.pending}
          loading={dispatch.loading}
          error={dispatch.error}
          onSelect={handleSelect}
          total={dispatch.pendingMeta?.total}
          page={dispatch.pendingMeta?.current_page || 1}
          setPage={dispatch.setPage}
          lastPage={dispatch.pendingMeta?.last_page || 1}
        />
        <DoctorWorkloadPanel
          items={dispatch.workload}
          loading={dispatch.loading}
          date={dispatch.filters.date}
        />
      </div>

      <AppointmentDetailDialog
        open={detailOpen}
        onOpenChange={(v) => { setDetailOpen(v); if (!v) setActiveAppointment(null); }}
        appointment={activeAppointment}
        loading={detailLoading}
        onAssign={canAssign ? () => setAssignOpen(true) : undefined}
        onReassign={canReassign ? () => setReassignOpen(true) : undefined}
        onUnassign={canUnassign ? () => setUnassignOpen(true) : undefined}
        canMutate={canMutate}
      />

      <AssignDoctorDialog
        open={assignOpen}
        onOpenChange={(v) => { setAssignOpen(v); if (!v) setServerErrors({}); }}
        appointment={activeAppointment}
        onSubmit={handleAssign}
        submitting={submitting}
        serverErrors={serverErrors}
      />

      <ReassignDoctorDialog
        open={reassignOpen}
        onOpenChange={(v) => { setReassignOpen(v); if (!v) setServerErrors({}); }}
        appointment={activeAppointment}
        onSubmit={handleReassign}
        submitting={submitting}
        serverErrors={serverErrors}
      />

      <UnassignDoctorDialog
        open={unassignOpen}
        onOpenChange={(v) => { setUnassignOpen(v); if (!v) setServerErrors({}); }}
        appointment={activeAppointment}
        onSubmit={handleUnassign}
        submitting={submitting}
        serverErrors={serverErrors}
      />
    </div>
  );
};

export default DoctorDispatch;
