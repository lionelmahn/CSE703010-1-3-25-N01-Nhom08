import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { medicalRecordsApi } from '@/api/medicalRecordsApi';
import useExaminationSession from '@/features/medical-records/hooks/useExaminationSession';
import useAutoSave from '@/features/medical-records/hooks/useAutoSave';
import useToothChart from '@/features/medical-records/hooks/useToothChart';
import useServiceCatalog from '@/features/medical-records/hooks/useServiceCatalog';
import useExaminationOptions from '@/features/medical-records/hooks/useExaminationOptions';
import ExaminationHeader from '@/features/medical-records/components/ExaminationHeader';
import PatientSidebar from '@/features/medical-records/components/PatientSidebar';
import ExaminationForm from '@/features/medical-records/components/ExaminationForm';
import AutoSaveIndicator from '@/features/medical-records/components/AutoSaveIndicator';
import ClinicalRightPanel from '@/features/medical-records/components/ClinicalRightPanel';
import DentalChart from '@/features/medical-records/components/DentalChart';
import ToothNoteEditor from '@/features/medical-records/components/ToothNoteEditor';
import TreatmentPlanPanel from '@/features/medical-records/components/TreatmentPlanPanel';
import LockRecordDialog from '@/features/medical-records/components/LockRecordDialog';
import UnlockRecordDialog from '@/features/medical-records/components/UnlockRecordDialog';
import RecallSuggestionDialog from '@/features/medical-records/components/RecallSuggestionDialog';
import CompleteRecordDialog from '@/features/medical-records/components/CompleteRecordDialog';

const EDITABLE_STATUSES = ['dang_kham', 'nhap'];

const FORM_FIELDS = [
  'chief_complaint',
  'symptoms',
  'clinical_findings',
  'diagnosis',
  'clinical_notes',
  'treatment_outcome',
  'conclusion',
  'recall_date',
  'recall_note',
];

/**
 * UC12 - Workspace ghi nhan ho so benh an (3-column layout) + dental chart +
 * treatment plan + dialogs (phase 5 + 6 combined).
 */
export default function MedicalRecordsWorkspace() {
  const { examinationId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userRole, hasPermission, user } = useAuth();

  const { session, setSession, loading, error, refresh } = useExaminationSession(examinationId);
  const { options } = useExaminationOptions();
  const tooth = useToothChart(examinationId);
  const catalog = useServiceCatalog();

  const [visitHistory, setVisitHistory] = useState([]);
  const [values, setValues] = useState({});
  const [savingDraft, setSavingDraft] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [serviceErrors, setServiceErrors] = useState({});
  const [serviceSaving, setServiceSaving] = useState(false);

  // Dialog states.
  const [lockOpen, setLockOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [recallOpen, setRecallOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [lockSaving, setLockSaving] = useState(false);
  const [recallSaving, setRecallSaving] = useState(false);

  // Dental chart selection.
  const [selectedTooth, setSelectedTooth] = useState(null);

  const canEdit = useMemo(() => {
    if (!session) return false;
    if (!EDITABLE_STATUSES.includes(session.status)) return false;
    if (userRole === 'admin') return true;
    if (!hasPermission?.('dental_records.edit')) return false;
    return Number(session.doctor_id) === Number(user?.id);
  }, [session, userRole, hasPermission, user]);

  const canLock = userRole === 'admin' || hasPermission?.('dental_records.lock');
  const canUnlock = userRole === 'admin' || hasPermission?.('dental_records.unlock');
  const canBilling = hasPermission?.('invoices.view');

  // Initialize form values from server snapshot (only when session.id changes).
  useEffect(() => {
    if (!session) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValues((prev) => {
      const next = { ...prev };
      FORM_FIELDS.forEach((k) => {
        if (next[k] == null) next[k] = session[k] ?? '';
      });
      return next;
    });
  }, [session]);

  // Load visit history.
  useEffect(() => {
    if (!session?.patient_id) return;
    let cancel = false;
    (async () => {
      try {
        const res = await medicalRecordsApi.patientExaminations(session.patient_id, { limit: 5 });
        if (!cancel) setVisitHistory(res?.data || []);
      } catch {
        // silent.
      }
    })();
    return () => { cancel = true; };
  }, [session?.patient_id]);

  const performSave = useCallback(async (vals) => {
    if (!session?.id) return;
    const payload = { ...vals };
    if (session.updated_at) payload.last_updated_at = session.updated_at;
    try {
      const res = await medicalRecordsApi.update(session.id, payload);
      const updated = res?.data;
      if (updated) setSession(updated);
      setServerErrors({});
    } catch (err) {
      const data = err?.response?.data;
      if (data?.errors) setServerErrors(data.errors);
      throw err;
    }
  }, [session, setSession]);

  const autoSave = useAutoSave({ saveFn: performSave, intervalMs: 30000, enabled: canEdit });

  const handleChange = useCallback((key, value) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      autoSave.markDirty(next);
      return next;
    });
  }, [autoSave]);

  const handleSaveDraft = useCallback(async () => {
    if (!session?.id) return;
    setSavingDraft(true);
    try {
      await autoSave.flush();
      const res = await medicalRecordsApi.saveDraft(session.id, values.completion_note || null);
      if (res?.data) setSession(res.data);
      toast({ title: 'Đã lưu nháp', description: `Hồ sơ ${session.code} chuyển sang trạng thái Bản nháp.` });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Không thể lưu nháp',
        description: err?.response?.data?.message || err?.message,
      });
    } finally {
      setSavingDraft(false);
    }
  }, [session, values, autoSave, setSession, toast]);

  // ----- Complete flow.
  const completionChecklist = useMemo(() => {
    if (!session) return [];
    const items = session.service_items || [];
    return [
      { key: 'chief_complaint', label: 'Lý do đến khám', ok: !!values.chief_complaint?.trim() },
      { key: 'diagnosis', label: 'Chẩn đoán', ok: !!values.diagnosis?.trim() },
      { key: 'conclusion', label: 'Kết luận', ok: !!values.conclusion?.trim() },
      { key: 'services', label: 'Ít nhất 1 dịch vụ đã chỉ định', ok: items.length > 0 },
    ];
  }, [session, values]);

  const handleConfirmComplete = useCallback(async (payload) => {
    if (!session?.id) return;
    setCompleting(true);
    try {
      await autoSave.flush();
      const res = await medicalRecordsApi.complete(session.id, payload);
      if (res?.data) setSession(res.data);
      setCompleteOpen(false);
      toast({ title: 'Đã hoàn tất bệnh án', description: `Hồ sơ ${session.code} chuyển sang Chờ thanh toán.` });
    } catch (err) {
      const data = err?.response?.data;
      if (data?.errors) {
        setServerErrors(data.errors);
        toast({
          variant: 'destructive',
          title: 'Còn thiếu dữ liệu để hoàn tất',
          description: Object.values(data.errors)[0]?.[0] || 'Vui lòng kiểm tra các trường bắt buộc.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Không thể hoàn tất',
          description: err?.response?.data?.message || err?.message,
        });
      }
    } finally {
      setCompleting(false);
    }
  }, [session, autoSave, setSession, toast]);

  // ----- Lock / Unlock.
  const handleConfirmLock = useCallback(async (reason) => {
    if (!session?.id) return;
    setLockSaving(true);
    try {
      const res = await medicalRecordsApi.lock(session.id, reason);
      if (res?.data) setSession(res.data);
      setLockOpen(false);
      toast({ title: 'Đã khoá hồ sơ' });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Không thể khoá hồ sơ',
        description: err?.response?.data?.message || err?.message,
      });
    } finally {
      setLockSaving(false);
    }
  }, [session, setSession, toast]);

  const handleConfirmUnlock = useCallback(async (reason) => {
    if (!session?.id) return;
    setLockSaving(true);
    try {
      const res = await medicalRecordsApi.unlock(session.id, reason);
      if (res?.data) setSession(res.data);
      setUnlockOpen(false);
      toast({ title: 'Đã mở khoá hồ sơ' });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Không thể mở khoá hồ sơ',
        description: err?.response?.data?.message || err?.message,
      });
    } finally {
      setLockSaving(false);
    }
  }, [session, setSession, toast]);

  // ----- Recall.
  const handleConfirmRecall = useCallback(async (payload) => {
    if (!session?.id) return;
    setRecallSaving(true);
    try {
      const res = await medicalRecordsApi.recall(session.id, payload);
      if (res?.data) setSession(res.data);
      setRecallOpen(false);
      toast({ title: 'Đã lưu đề xuất tái khám' });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Không thể lưu đề xuất tái khám',
        description: err?.response?.data?.message || err?.message,
      });
    } finally {
      setRecallSaving(false);
    }
  }, [session, setSession, toast]);

  // ----- Service items.
  const handleAddService = useCallback(async (payload) => {
    if (!session?.id) return;
    setServiceSaving(true);
    setServiceErrors({});
    try {
      await medicalRecordsApi.addServiceItem(session.id, payload);
      await refresh();
      toast({ title: 'Đã thêm dịch vụ' });
    } catch (err) {
      const data = err?.response?.data;
      if (data?.errors) setServiceErrors(data.errors);
      toast({
        variant: 'destructive',
        title: 'Không thể thêm dịch vụ',
        description: data?.message || err?.message,
      });
      throw err;
    } finally {
      setServiceSaving(false);
    }
  }, [session, refresh, toast]);

  const handleUpdateService = useCallback(async (itemId, payload) => {
    if (!session?.id) return;
    setServiceSaving(true);
    setServiceErrors({});
    try {
      await medicalRecordsApi.updateServiceItem(session.id, itemId, payload);
      await refresh();
      toast({ title: 'Đã cập nhật dịch vụ' });
    } catch (err) {
      const data = err?.response?.data;
      if (data?.errors) setServiceErrors(data.errors);
      toast({
        variant: 'destructive',
        title: 'Không thể cập nhật dịch vụ',
        description: data?.message || err?.message,
      });
      throw err;
    } finally {
      setServiceSaving(false);
    }
  }, [session, refresh, toast]);

  const handleRemoveService = useCallback(async (itemId) => {
    if (!session?.id) return;
    try {
      await medicalRecordsApi.removeServiceItem(session.id, itemId);
      await refresh();
      toast({ title: 'Đã xoá dịch vụ' });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Không thể xoá dịch vụ',
        description: err?.response?.data?.message || err?.message,
      });
    }
  }, [session, refresh, toast]);

  // ----- Tooth chart.
  const selectedToothEntry = useMemo(
    () => tooth.entries.find((e) => String(e.tooth_fdi) === String(selectedTooth)) || null,
    [tooth.entries, selectedTooth],
  );

  const handleSaveTooth = useCallback(async (entry) => {
    try {
      await tooth.upsert(entry);
      toast({ title: `Đã lưu răng ${entry.tooth_fdi}` });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Không thể lưu răng',
        description: err?.response?.data?.message || err?.message,
      });
    }
  }, [tooth, toast]);

  if (loading && !session) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
        Đang tải hồ sơ bệnh án...
      </div>
    );
  }
  if (error && !session) {
    return (
      <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center text-rose-600 text-sm">
        {error}
        <div className="mt-3">
          <button type="button" onClick={refresh} className="text-blue-600 underline">Thử lại</button>
        </div>
      </div>
    );
  }
  if (!session) return null;

  return (
    <div className="space-y-4 animate-in fade-in">
      <ExaminationHeader
        session={session}
        onBack={() => navigate('/medical-records')}
        onSaveDraft={handleSaveDraft}
        onComplete={() => setCompleteOpen(true)}
        onLock={() => setLockOpen(true)}
        onUnlock={() => setUnlockOpen(true)}
        onGoToBilling={() => navigate(`/invoices?examinationId=${session.id}`)}
        canEdit={canEdit}
        canLock={canLock}
        canUnlock={canUnlock}
        canBilling={canBilling}
        savingDraft={savingDraft}
        completing={completing}
      />

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="grid lg:grid-cols-[260px_1fr_300px]">
          <PatientSidebar session={session} visitHistory={visitHistory} />
          <div className="p-4 min-w-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                Ghi nhận lượt khám
              </h2>
              <AutoSaveIndicator
                pending={autoSave.pending}
                lastSavedAt={autoSave.lastSavedAt}
                error={autoSave.error}
              />
            </div>

            <ExaminationForm
              values={values}
              onChange={handleChange}
              disabled={!canEdit}
              errors={serverErrors}
            />

            <section>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800 mb-2">
                Sơ đồ răng (FDI)
              </h2>
              <div className="grid gap-4 md:grid-cols-[1fr_280px]">
                <DentalChart
                  entries={tooth.entries}
                  onSelect={setSelectedTooth}
                  selectedFdi={selectedTooth}
                  disabled={!canEdit && !selectedTooth}
                />
                <ToothNoteEditor
                  toothFdi={selectedTooth}
                  initial={selectedToothEntry}
                  statuses={tooth.statuses}
                  onSave={handleSaveTooth}
                  onCancel={() => setSelectedTooth(null)}
                  disabled={!canEdit}
                  saving={tooth.saving}
                />
              </div>
            </section>

            <TreatmentPlanPanel
              items={session.service_items || []}
              services={catalog.items}
              canEdit={canEdit}
              options={options}
              onAdd={handleAddService}
              onUpdate={handleUpdateService}
              onRemove={handleRemoveService}
              saving={serviceSaving}
              errors={serviceErrors}
            />
          </div>
          <ClinicalRightPanel session={session} onRecall={() => setRecallOpen(true)} />
        </div>
      </div>

      <CompleteRecordDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        onConfirm={handleConfirmComplete}
        loading={completing}
        checklist={completionChecklist}
      />
      <LockRecordDialog
        open={lockOpen}
        onOpenChange={setLockOpen}
        onConfirm={handleConfirmLock}
        loading={lockSaving}
      />
      <UnlockRecordDialog
        open={unlockOpen}
        onOpenChange={setUnlockOpen}
        onConfirm={handleConfirmUnlock}
        loading={lockSaving}
      />
      <RecallSuggestionDialog
        open={recallOpen}
        onOpenChange={setRecallOpen}
        onConfirm={handleConfirmRecall}
        loading={recallSaving}
        initial={{ recall_date: session.recall_date, recall_note: session.recall_note }}
      />
    </div>
  );
}
