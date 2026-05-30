import React, { useCallback, useState } from 'react';
import { ClipboardCheck, Activity, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { appointmentApi } from '@/api/appointmentApi';
import useTodayAppointments from '@/features/reception/hooks/useTodayAppointments';
import useReceptionQueue from '@/features/reception/hooks/useReceptionQueue';
import useCheckInActions from '@/features/reception/hooks/useCheckInActions';
import useAppointmentOptions from '@/features/appointment-management/hooks/useAppointmentOptions';
import TodayAppointmentList from '@/features/reception/components/TodayAppointmentList';
import WaitingQueueBoard from '@/features/reception/components/WaitingQueueBoard';
import QueueSummaryStrip from '@/features/reception/components/QueueSummaryStrip';
import PatientCheckInDrawer from '@/features/reception/components/PatientCheckInDrawer';
import NoShowDialog from '@/features/reception/components/NoShowDialog';
import CancelCheckInDialog from '@/features/reception/components/CancelCheckInDialog';
import QueueMonitoringPanel from '@/features/reception/components/QueueMonitoringPanel';

/**
 * UC11 - Trang Tiep nhan / Check-in benh nhan.
 *
 * 2 tab:
 *  - Tab 1: Tiep nhan - list lich hen + hang cho + drawer check-in.
 *  - Tab 2: Theo doi hang cho - KPI + alerts + bang BN cho qua han.
 */
const Reception = () => {
  const { toast } = useToast();
  const { userRole, hasPermission } = useAuth();
  const canCheckIn = userRole === 'admin' || hasPermission?.('appointments.check_in');
  const canCancelCheckIn = userRole === 'admin' || hasPermission?.('appointments.cancel_check_in');

  const list = useTodayAppointments();
  const queue = useReceptionQueue({ branchId: list.filters.branch_id || 'all' });
  const { branches } = useAppointmentOptions('');

  const [activeApt, setActiveApt] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [noShowOpen, setNoShowOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [serverErrors, setServerErrors] = useState({});

  const refreshAll = useCallback(async () => {
    await Promise.all([list.refresh(), queue.refresh()]);
  }, [list, queue]);

  const actions = useCheckInActions({
    onSuccess: async (_action, res) => {
      const updated = res?.data;
      if (updated) setActiveApt(updated);
      await refreshAll();
    },
  });

  const loadDetail = useCallback(async (id) => {
    setDetailLoading(true);
    try {
      const apt = await appointmentApi.show(id);
      setActiveApt(apt);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Khong the tai chi tiet lich hen',
        description: err?.response?.data?.message || err?.message,
      });
    } finally {
      setDetailLoading(false);
    }
  }, [toast]);

  const handleSelect = useCallback((apt) => {
    setServerErrors({});
    setActiveApt(apt);
    setDrawerOpen(true);
    loadDetail(apt.id);
  }, [loadDetail]);

  const handlePickQueue = useCallback((entry) => {
    if (!entry?.appointment?.id) return;
    handleSelect({ id: entry.appointment.id, code: entry.appointment.code });
  }, [handleSelect]);

  const handleCheckIn = useCallback(async (payload) => {
    if (!activeApt) return;
    try {
      const res = await actions.checkIn(activeApt.id, payload);
      toast({
        title: 'Da check-in',
        description: `Ma cho: ${res?.data?.queue_entry?.code || '--'}`,
      });
    } catch (err) {
      const errors = err?.response?.data?.errors || {};
      setServerErrors(Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])));
      toast({
        variant: 'destructive',
        title: 'Check-in that bai',
        description: err?.response?.data?.message || err?.message,
      });
    }
  }, [actions, activeApt, toast]);

  const handleNoShow = useCallback(async (payload) => {
    if (!activeApt) return;
    try {
      await actions.markNoShow(activeApt.id, payload);
      toast({ title: 'Da mark khong den' });
      setNoShowOpen(false);
    } catch (err) {
      const errors = err?.response?.data?.errors || {};
      setServerErrors(Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])));
      toast({
        variant: 'destructive',
        title: 'Khong the mark khong den',
        description: err?.response?.data?.message || err?.message,
      });
    }
  }, [actions, activeApt, toast]);

  const handleCancelCheckIn = useCallback(async (payload) => {
    if (!activeApt) return;
    try {
      await actions.cancelCheckIn(activeApt.id, payload);
      toast({ title: 'Da huy check-in' });
      setCancelOpen(false);
    } catch (err) {
      const errors = err?.response?.data?.errors || {};
      setServerErrors(Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])));
      toast({
        variant: 'destructive',
        title: 'Khong the huy check-in',
        description: err?.response?.data?.message || err?.message,
      });
    }
  }, [actions, activeApt, toast]);

  return (
    <div className="flex h-full flex-col p-4">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <ClipboardCheck size={20} className="text-indigo-600" />
            Tiep nhan / Check-in benh nhan
          </h1>
          <p className="text-xs text-slate-500">UC11 - Le tan check-in BN den kham + theo doi hang cho.</p>
        </div>
        <Button
          variant="outline"
          type="button"
          onClick={() => {
            toast({
              title: 'Walk-in: tao lich tu UC7',
              description: 'Vui long tao lich hen moi truoc, sau do quay lai day de check-in.',
            });
          }}
          className="hidden md:inline-flex"
        >
          <Plus size={14} className="mr-1" /> Walk-in moi
        </Button>
      </header>

      <Tabs defaultValue="reception" className="flex flex-1 flex-col">
        <TabsList className="self-start">
          <TabsTrigger value="reception" className="text-xs">
            <ClipboardCheck size={14} className="mr-1" /> Tiep nhan
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="text-xs">
            <Activity size={14} className="mr-1" /> Theo doi hang cho
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reception" className="mt-3 flex-1">
          <div className="grid h-[calc(100vh-220px)] grid-cols-1 gap-3 md:grid-cols-12">
            <section className="md:col-span-4 xl:col-span-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <TodayAppointmentList
                items={list.items}
                loading={list.loading}
                counts={list.counts}
                filters={list.filters}
                setFilter={list.setFilter}
                page={list.page}
                meta={list.meta}
                setPage={list.setPage}
                branches={branches}
                activeAppointmentId={activeApt?.id}
                onSelect={handleSelect}
                onRefresh={refreshAll}
              />
            </section>

            <section className="md:col-span-8 xl:col-span-9 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="mb-3">
                <QueueSummaryStrip
                  summary={queue.data?.summary}
                  avgWaitMin={queue.data?.avg_wait_min}
                />
              </div>
              <div className="h-[calc(100%-72px)]">
                <WaitingQueueBoard data={queue.data} onPick={handlePickQueue} />
              </div>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="mt-3 flex-1">
          <QueueMonitoringPanel
            summary={queue.data?.summary}
            stats={queue.stats}
            avgWaitMin={queue.data?.avg_wait_min}
          />
        </TabsContent>
      </Tabs>

      <PatientCheckInDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        appointment={activeApt}
        loading={detailLoading}
        submitting={actions.loadingAction === 'check_in'}
        onSubmit={handleCheckIn}
        onOpenNoShow={() => setNoShowOpen(true)}
        onOpenCancelCheckIn={() => setCancelOpen(true)}
        canCheckIn={canCheckIn}
        canCancelCheckIn={canCancelCheckIn}
      />

      <NoShowDialog
        open={noShowOpen}
        onOpenChange={setNoShowOpen}
        appointment={activeApt}
        onSubmit={handleNoShow}
        submitting={actions.loadingAction === 'no_show'}
        serverErrors={serverErrors}
      />

      <CancelCheckInDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        appointment={activeApt}
        onSubmit={handleCancelCheckIn}
        submitting={actions.loadingAction === 'cancel_check_in'}
        serverErrors={serverErrors}
      />
    </div>
  );
};

export default Reception;
