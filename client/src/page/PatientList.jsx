import React, { useCallback, useState } from 'react';
import { GitMerge, Plus, RefreshCw, Users } from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { patientsApi } from '@/api/patientsApi';

import { usePatients } from '@/features/patient-management/hooks/usePatients';
import { usePatientDetail } from '@/features/patient-management/hooks/usePatientDetail';
import { usePatientSources } from '@/features/patient-management/hooks/usePatientSources';

import PatientFilters from '@/features/patient-management/components/PatientFilters';
import PatientListTable from '@/features/patient-management/components/PatientListTable';
import Pagination from '@/features/patient-management/components/Pagination';
import PatientDetailPanel from '@/features/patient-management/components/PatientDetailPanel';
import PatientFormDialog from '@/features/patient-management/components/PatientFormDialog';
import DuplicateCheckDialog from '@/features/patient-management/components/DuplicateCheckDialog';
import DeactivateDialog from '@/features/patient-management/components/DeactivateDialog';
import MergePatientsDialog from '@/features/patient-management/components/MergePatientsDialog';
import PatientHistoryDialog from '@/features/patient-management/components/PatientHistoryDialog';

import { cleanPayload } from '@/features/patient-management/utils';
import { extractServerErrors } from '@/features/patient-management/validation';

/**
 * UC5 - Quan ly ho so benh nhan.
 *
 * Page wiring: list + filters + pagination + detail panel + tat ca dialog.
 * Tat ca data deu lay tu Laravel API; khong dung mock.
 */
export default function PatientList() {
  const { toast } = useToast();
  const {
    filters,
    setFilter,
    resetFilters,
    page,
    setPage,
    perPage,
    setPerPage,
    items,
    meta,
    loading,
    error,
    refresh,
  } = usePatients();

  const { sources } = usePatientSources();

  const [selectedId, setSelectedId] = useState(null);
  const {
    patient: detail,
    history,
    loading: detailLoading,
    historyLoading,
    error: detailError,
    refresh: refreshDetail,
  } = usePatientDetail(selectedId);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [formPatient, setFormPatient] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formServerErrors, setFormServerErrors] = useState({});
  const [formDuplicateWarning, setFormDuplicateWarning] = useState(null);
  const [formPendingValues, setFormPendingValues] = useState(null);

  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const [duplicates, setDuplicates] = useState([]);

  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateSubmitting, setDeactivateSubmitting] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState(null);

  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeSubmitting, setMergeSubmitting] = useState(false);
  const [mergePrimary, setMergePrimary] = useState(null);

  const [historyOpen, setHistoryOpen] = useState(false);

  const showError = useCallback((err, fallback) => {
    const parsed = extractServerErrors(err);
    toast({
      title: parsed.message || fallback,
      description: parsed.errors && Object.keys(parsed.errors).length > 0
        ? Object.values(parsed.errors).join(' • ')
        : undefined,
      variant: 'destructive',
    });
    return parsed;
  }, [toast]);

  const openCreate = () => {
    setFormMode('create');
    setFormPatient(null);
    setFormServerErrors({});
    setFormDuplicateWarning(null);
    setFormPendingValues(null);
    setFormOpen(true);
  };

  const openEdit = (patient) => {
    setFormMode('edit');
    setFormPatient(patient);
    setFormServerErrors({});
    setFormDuplicateWarning(null);
    setFormPendingValues(null);
    setFormOpen(true);
  };

  const handleSelect = (patient) => {
    setSelectedId(patient.id);
  };

  const handleSubmitForm = async (values) => {
    setFormSubmitting(true);
    setFormServerErrors({});
    setFormDuplicateWarning(null);

    const payload = cleanPayload(values);

    try {
      if (formMode === 'create') {
        if (!payload.force_create_reason) {
          const { data: dups } = await patientsApi.duplicateCheck({
            phone: payload.phone,
            email: payload.email,
            id_number: payload.id_number,
            full_name: payload.full_name,
            dob: payload.dob,
          });
          if (dups.length > 0) {
            setDuplicates(dups);
            setDuplicateOpen(true);
            setFormPendingValues(payload);
            setFormSubmitting(false);
            return;
          }
        }
        const { data, message } = await patientsApi.create(payload);
        toast({ title: message || 'Tạo hồ sơ thành công.' });
        setFormOpen(false);
        setFormPendingValues(null);
        if (data?.id) setSelectedId(data.id);
        await refresh();
      } else if (formPatient?.id) {
        const { data, message } = await patientsApi.update(formPatient.id, payload);
        toast({ title: message || 'Cập nhật thành công.' });
        setFormOpen(false);
        if (data?.id) setSelectedId(data.id);
        await Promise.all([refresh(), refreshDetail()]);
      }
    } catch (err) {
      const parsed = extractServerErrors(err);
      if (parsed.code === 'duplicate_detected' && Array.isArray(parsed.duplicates)) {
        setDuplicates(parsed.duplicates);
        setDuplicateOpen(true);
        setFormPendingValues(payload);
      } else {
        setFormServerErrors(parsed.errors || {});
        toast({
          title: parsed.message,
          description: parsed.errors && Object.keys(parsed.errors).length > 0
            ? Object.values(parsed.errors).join(' • ')
            : undefined,
          variant: 'destructive',
        });
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleLinkDuplicate = (target) => {
    setDuplicateOpen(false);
    setFormOpen(false);
    setFormPendingValues(null);
    setSelectedId(target.id);
    toast({ title: `Đã chọn hồ sơ ${target.patient_code} - ${target.full_name}.` });
  };

  const handleForceCreate = async (reason) => {
    if (!formPendingValues) {
      setDuplicateOpen(false);
      return;
    }
    setDuplicateLoading(true);
    try {
      const payload = { ...formPendingValues, force_create_reason: reason };
      const { data, message } = await patientsApi.create(payload);
      toast({ title: message || 'Đã tạo hồ sơ trùng có lý do.' });
      setDuplicateOpen(false);
      setFormOpen(false);
      setFormPendingValues(null);
      if (data?.id) setSelectedId(data.id);
      await refresh();
    } catch (err) {
      showError(err, 'Không thể tạo hồ sơ.');
    } finally {
      setDuplicateLoading(false);
    }
  };

  const handleDeactivate = (patient) => {
    setDeactivateTarget(patient);
    setDeactivateOpen(true);
  };

  const submitDeactivate = async (reason) => {
    if (!deactivateTarget) return;
    setDeactivateSubmitting(true);
    try {
      const { message } = await patientsApi.deactivate(deactivateTarget.id, reason);
      toast({ title: message || 'Đã chuyển sang Ngừng hoạt động.' });
      setDeactivateOpen(false);
      setDeactivateTarget(null);
      await Promise.all([refresh(), refreshDetail()]);
    } catch (err) {
      showError(err, 'Không thể chuyển trạng thái.');
    } finally {
      setDeactivateSubmitting(false);
    }
  };

  const handleReactivate = async (patient) => {
    try {
      const { message } = await patientsApi.reactivate(patient.id);
      toast({ title: message || 'Đã mở lại hồ sơ.' });
      await Promise.all([refresh(), refreshDetail()]);
    } catch (err) {
      showError(err, 'Không thể mở lại hồ sơ.');
    }
  };

  const openMerge = (patient) => {
    setMergePrimary(patient || detail || null);
    setMergeOpen(true);
  };

  const submitMerge = async ({ primary_id, secondary_ids, note }) => {
    setMergeSubmitting(true);
    try {
      const { message } = await patientsApi.merge({ primary_id, secondary_ids, note });
      toast({ title: message || 'Gộp hồ sơ thành công.' });
      setMergeOpen(false);
      setMergePrimary(null);
      setSelectedId(primary_id);
      await Promise.all([refresh(), refreshDetail()]);
    } catch (err) {
      showError(err, 'Không thể gộp hồ sơ.');
    } finally {
      setMergeSubmitting(false);
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      {/* Page header card: title + global page-level actions. */}
      <div className="flex min-w-0 flex-col gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Users size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-xl font-bold text-slate-800">Quản lý hồ sơ bệnh nhân</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Tổng cộng <strong>{meta.total}</strong> hồ sơ • UC5
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => refresh()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={12} /> Tải lại
          </button>
          {detail && detail.status !== 'merged' && (
            <button
              type="button"
              onClick={() => openMerge(detail)}
              className="flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <GitMerge size={12} /> Gộp hồ sơ
            </button>
          )}
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
          >
            <Plus size={12} /> Thêm hồ sơ
          </button>
        </div>
      </div>

      {/*
        Master-detail grid:
        - <xl: single column, detail panel stacks under the table.
        - xl+: 2 columns, detail panel locked at a stable 420px so it
          stays readable while the table column gets the rest of the
          width via `minmax(0, 1fr)`.
        `min-w-0` on both columns is required so flex/grid descendants
        (notably the table's `min-w-[900px]`) can scroll inside their own
        container instead of pushing the layout horizontally.
      */}
      <div className="grid w-full min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex min-h-[520px] min-w-0 flex-col rounded-lg border bg-white shadow-sm">
          <PatientFilters
            filters={filters}
            onFilterChange={setFilter}
            onReset={resetFilters}
            sources={sources}
            loading={loading}
          />
          {error && (
            <div className="border-b border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
          )}
          <PatientListTable
            patients={items}
            selectedId={selectedId}
            onSelect={handleSelect}
            onEdit={openEdit}
            onMore={(patient) => setSelectedId(patient.id)}
            loading={loading}
          />
          <Pagination
            meta={meta}
            page={page}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(value) => { setPerPage(value); setPage(1); }}
          />
        </div>

        <div className="min-h-[520px] min-w-0">
          <PatientDetailPanel
            patient={detail}
            loading={detailLoading}
            error={detailError}
            onClose={() => setSelectedId(null)}
            onEdit={openEdit}
            onDeactivate={handleDeactivate}
            onReactivate={handleReactivate}
            onMerge={openMerge}
            onShowHistory={() => setHistoryOpen(true)}
            onRefresh={refreshDetail}
          />
        </div>
      </div>

      <PatientFormDialog
        open={formOpen}
        mode={formMode}
        patient={formPatient}
        sources={sources}
        submitting={formSubmitting}
        serverErrors={formServerErrors}
        duplicateWarning={formDuplicateWarning}
        onClose={() => { setFormOpen(false); setFormPendingValues(null); }}
        onSubmit={handleSubmitForm}
      />

      <DuplicateCheckDialog
        open={duplicateOpen}
        duplicates={duplicates}
        inputSummary={formPendingValues || {}}
        loading={duplicateLoading}
        onClose={() => setDuplicateOpen(false)}
        onLink={handleLinkDuplicate}
        onForceCreate={handleForceCreate}
      />

      <DeactivateDialog
        open={deactivateOpen}
        patient={deactivateTarget}
        submitting={deactivateSubmitting}
        onClose={() => setDeactivateOpen(false)}
        onSubmit={submitDeactivate}
      />

      <MergePatientsDialog
        open={mergeOpen}
        primary={mergePrimary}
        submitting={mergeSubmitting}
        onClose={() => setMergeOpen(false)}
        onSubmit={submitMerge}
      />

      <PatientHistoryDialog
        open={historyOpen}
        history={history}
        loading={historyLoading}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
  );
}
