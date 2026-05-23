import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { appointmentApi } from '@/api/appointmentApi';
import AppointmentFilters from '@/features/appointment-management/components/AppointmentFilters';
import AppointmentTable from '@/features/appointment-management/components/AppointmentTable';
import AppointmentSummary from '@/features/appointment-management/components/AppointmentSummary';
import AppointmentFormDialog from '@/features/appointment-management/components/AppointmentFormDialog';
import AppointmentDetailDialog from '@/features/appointment-management/components/AppointmentDetailDialog';
import RescheduleDialog from '@/features/appointment-management/components/RescheduleDialog';
import CancelDialog from '@/features/appointment-management/components/CancelDialog';
import AssignDoctorDialog from '@/features/appointment-management/components/AssignDoctorDialog';
import ReassignDoctorDialog from '@/features/appointment-management/components/ReassignDoctorDialog';
import UnassignDoctorDialog from '@/features/appointment-management/components/UnassignDoctorDialog';
import CalendarHeader from '@/features/appointment-management/components/CalendarHeader';
import DayCalendarGrid from '@/features/appointment-management/components/DayCalendarGrid';
import WeekCalendarGrid from '@/features/appointment-management/components/WeekCalendarGrid';
import MonthCalendarGrid from '@/features/appointment-management/components/MonthCalendarGrid';
import useAppointmentList from '@/features/appointment-management/hooks/useAppointmentList';
import useAppointmentOptions from '@/features/appointment-management/hooks/useAppointmentOptions';
import useAppointmentCalendar from '@/features/appointment-management/hooks/useAppointmentCalendar';

/**
 * UC7 - Trang quan ly lich hen chinh thuc (Receptionist / Admin).
 *
 * Quyen:
 *  - Chi tai khoan co `appointments.view` moi truy cap (router guard).
 *  - Cac action mutate yeu cau `appointments.create` (backend kiem tra).
 *
 * Out-of-scope:
 *  - Khong phan cong bac si (UC8) - BR3, VR12.
 *  - Khong check-in / hoan tat / khong den (UC9) - BR5, VR11.
 */
const Appointments = () => {
  const { toast } = useToast();
  const { userRole, hasPermission } = useAuth();
  const canMutate = userRole === 'admin' || hasPermission?.('appointments.create');
  const canAssign = userRole === 'admin' || hasPermission?.('appointments.assign');
  const canReassign = userRole === 'admin' || hasPermission?.('appointments.reassign');
  const canUnassign = userRole === 'admin' || hasPermission?.('appointments.unassign');

  const list = useAppointmentList();
  const { branches, statuses, sources } = useAppointmentOptions('');
  const calendar = useAppointmentCalendar();

  const doctorOptions = useMemo(() => {
    if (!calendar.data) return [];
    if (calendar.data.view === 'day' && Array.isArray(calendar.data.chairs)) {
      return calendar.data.chairs.map((c) => c.doctor).filter(Boolean);
    }
    return [];
  }, [calendar.data]);

  const [createOpen, setCreateOpen] = useState(false);
  const [createInitial, setCreateInitial] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  // UC8 - dispatch dialogs.
  const [assignOpen, setAssignOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [unassignOpen, setUnassignOpen] = useState(false);

  const [activeId, setActiveId] = useState(null);
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
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
    if (!id) return;
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (activeId) loadDetail(activeId);
  }, [activeId, loadDetail]);

  const openDetail = (apt) => {
    setActiveId(apt.id);
    setActiveAppointment(apt);
    setDetailOpen(true);
  };

  const handleCreate = async (payload) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      const res = await appointmentApi.create(payload);
      toast({ title: 'Da tao lich hen', description: res?.data?.code });
      setCreateOpen(false);
      setCreateInitial(null);
      await Promise.all([list.refresh(), calendar.refresh()]);
    } catch (err) {
      handleError(err, 'Khong the tao lich hen.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmptySlotClick = ({ appointment_date, time_slot }) => {
    if (!canMutate) return;
    setCreateInitial({ appointment_date, time_slot });
    setCreateOpen(true);
  };

  const handleCalendarDayClick = (dateStr) => {
    calendar.setDate(dateStr);
    calendar.setView('day');
  };

  const handleReschedule = async (payload) => {
    if (!activeAppointment) return;
    setSubmitting(true);
    setServerErrors({});
    try {
      const res = await appointmentApi.reschedule(activeAppointment.id, payload);
      toast({ title: 'Da doi lich hen', description: res?.data?.code });
      setRescheduleOpen(false);
      await Promise.all([loadDetail(activeAppointment.id), list.refresh(), calendar.refresh()]);
    } catch (err) {
      handleError(err, 'Khong the doi lich hen.');
    } finally {
      setSubmitting(false);
    }
  };

  // UC8 - Phan cong bac si.
  const handleAssign = async (payload) => {
    if (!activeAppointment) return;
    setSubmitting(true);
    setServerErrors({});
    try {
      const res = await appointmentApi.assignDoctor(activeAppointment.id, payload);
      toast({ title: 'Da phan cong bac si', description: res?.data?.assigned_doctor?.name });
      setAssignOpen(false);
      await Promise.all([loadDetail(activeAppointment.id), list.refresh(), calendar.refresh()]);
    } catch (err) {
      handleError(err, 'Khong the phan cong bac si.');
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
      await Promise.all([loadDetail(activeAppointment.id), list.refresh(), calendar.refresh()]);
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
      await Promise.all([loadDetail(activeAppointment.id), list.refresh(), calendar.refresh()]);
    } catch (err) {
      handleError(err, 'Khong the go phan cong.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (reason) => {
    if (!activeAppointment) return;
    setSubmitting(true);
    setServerErrors({});
    try {
      const res = await appointmentApi.cancel(activeAppointment.id, reason);
      toast({ title: 'Da huy lich hen', description: res?.data?.code });
      setCancelOpen(false);
      await Promise.all([loadDetail(activeAppointment.id), list.refresh(), calendar.refresh()]);
    } catch (err) {
      handleError(err, 'Khong the huy lich hen.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Calendar size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Quan ly lich hen</h3>
            <p className="text-xs text-slate-500">Tao, doi lich, huy lich va theo doi trang thai tat ca lich hen chinh thuc cua phong kham.</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="space-y-3">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="calendar">Lich hen (Calendar)</TabsTrigger>
          <TabsTrigger value="list">Danh sach</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-3">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
            <AppointmentSummary counts={calendar.data?.status_counts || {}} />
            <div className="rounded-xl border border-slate-200 bg-white">
              <CalendarHeader
                view={calendar.view}
                setView={calendar.setView}
                date={calendar.date}
                shift={calendar.shift}
                goToday={calendar.goToday}
                branches={branches}
                branchId={calendar.branchId}
                setBranchId={calendar.setBranchId}
                doctors={doctorOptions}
                doctorId={calendar.doctorId}
                setDoctorId={calendar.setDoctorId}
                status={calendar.status}
                setStatus={calendar.setStatus}
                loading={calendar.loading}
              />
              <div className="p-3">
                {calendar.error && (
                  <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {calendar.error}
                  </div>
                )}
                {calendar.view === 'day' && (
                  <DayCalendarGrid
                    data={calendar.data}
                    loading={calendar.loading}
                    onAppointmentClick={openDetail}
                    onEmptyClick={handleEmptySlotClick}
                  />
                )}
                {calendar.view === 'week' && (
                  <WeekCalendarGrid
                    data={calendar.data}
                    loading={calendar.loading}
                    onAppointmentClick={openDetail}
                    onEmptyClick={handleEmptySlotClick}
                  />
                )}
                {calendar.view === 'month' && (
                  <MonthCalendarGrid
                    data={calendar.data}
                    loading={calendar.loading}
                    onDayClick={handleCalendarDayClick}
                  />
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-3">
          <AppointmentFilters
            filters={list.filters}
            setFilter={list.setFilter}
            setFilters={list.setFilters}
            resetFilters={list.resetFilters}
            branches={branches}
            statuses={statuses}
            sources={sources}
            canCreate={canMutate}
            onCreateClick={() => { setCreateInitial(null); setCreateOpen(true); }}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
            <AppointmentSummary counts={list.counts} />
            <AppointmentTable
              items={list.items}
              loading={list.loading}
              error={list.error}
              onRowClick={openDetail}
              meta={list.meta}
              page={list.page}
              setPage={list.setPage}
            />
          </div>
        </TabsContent>
      </Tabs>

      <AppointmentFormDialog
        open={createOpen}
        onOpenChange={(v) => { setCreateOpen(v); if (!v) { setServerErrors({}); setCreateInitial(null); } }}
        onSubmit={handleCreate}
        submitting={submitting}
        serverErrors={serverErrors}
        initialValues={createInitial}
      />

      <AppointmentDetailDialog
        open={detailOpen}
        onOpenChange={(v) => { setDetailOpen(v); if (!v) { setActiveId(null); setActiveAppointment(null); } }}
        appointment={activeAppointment}
        loading={detailLoading}
        onReschedule={() => setRescheduleOpen(true)}
        onCancel={() => setCancelOpen(true)}
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

      <RescheduleDialog
        open={rescheduleOpen}
        onOpenChange={(v) => { setRescheduleOpen(v); if (!v) setServerErrors({}); }}
        appointment={activeAppointment}
        onSubmit={handleReschedule}
        submitting={submitting}
        serverErrors={serverErrors}
      />

      <CancelDialog
        open={cancelOpen}
        onOpenChange={(v) => { setCancelOpen(v); if (!v) setServerErrors({}); }}
        appointment={activeAppointment}
        onSubmit={handleCancel}
        submitting={submitting}
        serverErrors={serverErrors}
      />
    </div>
  );
};

export default Appointments;
