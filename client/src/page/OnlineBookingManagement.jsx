import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

import RequestListPanel from '@/features/online-booking-management/components/RequestListPanel';
import RequestDetailPanel from '@/features/online-booking-management/components/RequestDetailPanel';
import PatientInfoPanel from '@/features/online-booking-management/components/PatientInfoPanel';
import ProcessingPanel from '@/features/online-booking-management/components/ProcessingPanel';
import RelatedInfoPanel from '@/features/online-booking-management/components/RelatedInfoPanel';

import { useOnlineBookingRequests } from '@/features/online-booking-management/hooks/useOnlineBookingRequests';
import { useOnlineBookingRequestDetail } from '@/features/online-booking-management/hooks/useOnlineBookingRequestDetail';
import { canProcessRequest, validateInternalNote } from '@/features/online-booking-management/validation';
import {
  EMAIL_STATUS,
  REQUEST_STATUS,
  REQUEST_STATUS_LABEL,
} from '@/features/online-booking-management/constants';
import { onlineBookingRequestApi } from '@/api/onlineBookingRequestApi';

/**
 * UC6.2 - Trang quan ly yeu cau dat lich online (le tan/admin).
 *
 * Layout:
 * - Row 1 (top, 60% chieu cao man hinh):
 *   - Danh sach yeu cau (filter + table + pagination)
 *   - Detail panel (thong tin yeu cau + ghi chu noi bo)
 * - Notice bar: yeu cau dang chuyen Cho xu ly -> Dang xu ly khi mo.
 * - Row 2 (bottom, 40% chieu cao):
 *   - PatientInfoPanel (tab Ho so hien co / Tao moi)
 *   - ProcessingPanel (tab Xac nhan / De xuat lich khac / Tu choi)
 *   - RelatedInfoPanel (Thong tin lien quan + Lich su xu ly + Footer actions)
 */
const OnlineBookingManagement = () => {
  const { toast } = useToast();
  const { userRole, userName } = useAuth();
  const isAdmin = userRole === 'admin';
  const isReceptionist = userRole === 'le_tan' || isAdmin;

  const [selectedId, setSelectedId] = useState(null);

  const list = useOnlineBookingRequests();
  const detail = useOnlineBookingRequestDetail(selectedId, userName || userRole || 'le_tan', list.refresh);

  // Auto select first item khi list co ket qua va chua chon.
  useEffect(() => {
    if (!selectedId && list.items.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedId(list.items[0].id);
    } else if (selectedId && !list.items.find((it) => it.id === selectedId)) {
      // Item bi loai khoi list do filter; clear chon.
       
      setSelectedId(list.items[0]?.id || null);
    }
  }, [list.items, selectedId]);

  const headerCounts = useMemo(() => {
    const counts = list.counts || {};
    return {
      pending: counts[REQUEST_STATUS.PENDING] || 0,
      processing: counts[REQUEST_STATUS.PROCESSING] || 0,
      proposeOther: counts[REQUEST_STATUS.PROPOSE_OTHER] || 0,
      appointment: counts[REQUEST_STATUS.APPOINTMENT_CREATED] || 0,
      rejected: counts[REQUEST_STATUS.REJECTED] || 0,
      canceled: counts[REQUEST_STATUS.CANCELED] || 0,
    };
  }, [list.counts]);

  // Run action with guard (VR1/VR7).
  const guardAndRun = useCallback(async (label, runner) => {
    if (!detail.request) {
      toast({ variant: 'destructive', title: 'Loi', description: 'Khong tim thay yeu cau.' });
      return;
    }
    const v = canProcessRequest(detail.request, { isAdmin });
    if (!v.ok) {
      toast({ variant: 'destructive', title: 'Khong the xu ly', description: Object.values(v.errors)[0] });
      return;
    }
    try {
      await runner();
      toast({ title: 'Thanh cong', description: label });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Loi',
        description: err?.response?.data?.message || err?.message || `Khong the ${label.toLowerCase()}`,
      });
    }
  }, [detail.request, isAdmin, toast]);

  const handleLinkPatient = async (patientId) => {
    await guardAndRun('Da lien ket ho so benh nhan', () => detail.linkPatient(patientId));
  };
  const handleCreatePatient = async (patientData) => {
    await guardAndRun('Da tao ho so benh nhan moi', () => detail.createPatient(patientData));
  };
  const handleConfirm = async (payload) => {
    if (!detail.request?.patient_id) {
      toast({ variant: 'destructive', title: 'Thieu ho so', description: 'Vui long chon hoac tao ho so benh nhan truoc khi xac nhan.' });
      return;
    }
    await guardAndRun('Da xac nhan va tao lich hen chinh thuc', async () => {
      const updated = await detail.confirmAppointment({
        ...payload,
        patient_id: detail.request.patient_id,
      });
      if (updated?.appointment_code) {
        toast({ title: 'Lich hen ' + updated.appointment_code, description: 'Trang thai: Cho phan cong bac si' });
      }
    });
  };
  const handlePropose = async (slots, reason) => {
    await guardAndRun('Da de xuat lich khac va gui email khach hang', () => detail.proposeAlternative(slots, reason));
  };
  const handleReject = async (reason) => {
    await guardAndRun('Da tu choi yeu cau', () => detail.rejectRequest(reason));
  };
  const handleReopen = async (reason) => {
    if (!isAdmin) {
      toast({ variant: 'destructive', title: 'Khong co quyen', description: 'Chi admin moi co the mo lai yeu cau (BR-19).' });
      return;
    }
    try {
      await detail.reopenRequest(reason);
      toast({ title: 'Da mo lai yeu cau', description: 'Trang thai: Dang xu ly' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Loi', description: err?.message || 'Khong the mo lai yeu cau' });
    }
  };
  const handleStartProcessing = async () => {
    try {
      const updated = await onlineBookingRequestApi.startProcessing(detail.request.id, userName || userRole || 'le_tan');
      detail.refresh();
      list.refresh();
      if (updated) {
        toast({ title: 'Cap nhat trang thai', description: 'Yeu cau da chuyen sang Dang xu ly.' });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Loi', description: err?.message || 'Khong the cap nhat trang thai' });
    }
  };
  const handleResendEmail = async (status) => {
    const kind = status === REQUEST_STATUS.APPOINTMENT_CREATED
      ? 'ER-01'
      : status === REQUEST_STATUS.PROPOSE_OTHER
        ? 'ER-02'
        : status === REQUEST_STATUS.REJECTED
          ? 'ER-03'
          : status === REQUEST_STATUS.CANCELED
            ? 'ER-04'
            : 'ER-XX';
    try {
      await detail.resendEmail(kind);
      toast({ title: 'Da gui lai email', description: `Email loai ${kind} da gui lai cho khach hang.` });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Loi', description: err?.message || 'Khong the gui lai email' });
    }
  };
  const handleUpdateInternalNote = async (note) => {
    const v = validateInternalNote(note);
    if (!v.ok) {
      toast({ variant: 'destructive', title: 'Khong hop le', description: Object.values(v.errors)[0] });
      return;
    }
    try {
      await detail.updateInternalNote(note);
      toast({ title: 'Da luu ghi chu', description: 'Ghi chu noi bo da duoc cap nhat.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Loi', description: err?.message || 'Khong the luu ghi chu' });
    }
  };

  if (!isReceptionist) {
    return (
      <div className="p-10 text-center font-medium text-red-500">
        Ban khong co quyen xu ly yeu cau dat lich online (BR-01).
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 min-h-screen bg-slate-50">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Yeu cau dat lich online</h1>
          <p className="text-gray-500 text-xs mt-0.5">
            Quan ly va xu ly cac yeu cau dat lich gui tu landing page (UC6.1) - {list.meta.total} yeu cau tong cong
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          {Object.entries(headerCounts).map(([key, value]) => (
            <span
              key={key}
              className="inline-flex items-center gap-1 px-2 py-1 rounded border bg-white text-gray-700"
            >
              <strong className="text-gray-900">{value}</strong>
              <span className="text-gray-500">
                {key === 'pending' && REQUEST_STATUS_LABEL[REQUEST_STATUS.PENDING]}
                {key === 'processing' && REQUEST_STATUS_LABEL[REQUEST_STATUS.PROCESSING]}
                {key === 'proposeOther' && REQUEST_STATUS_LABEL[REQUEST_STATUS.PROPOSE_OTHER]}
                {key === 'appointment' && REQUEST_STATUS_LABEL[REQUEST_STATUS.APPOINTMENT_CREATED]}
                {key === 'rejected' && REQUEST_STATUS_LABEL[REQUEST_STATUS.REJECTED]}
                {key === 'canceled' && REQUEST_STATUS_LABEL[REQUEST_STATUS.CANCELED]}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 min-h-[420px]">
        <RequestListPanel
          items={list.items}
          loading={list.loading}
          error={list.error}
          meta={list.meta}
          filters={list.filters}
          page={list.page}
          perPage={list.perPage}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onFilterChange={list.setFilter}
          onRefresh={list.refresh}
          onPageChange={list.setPage}
          onPerPageChange={list.setPerPage}
        />
        <RequestDetailPanel
          request={detail.request}
          onClose={() => setSelectedId(null)}
          onUpdateInternalNote={handleUpdateInternalNote}
          onResendEmail={handleResendEmail}
          submitting={detail.submitting}
        />
      </div>

      {detail.request && detail.request.status === REQUEST_STATUS.PENDING && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-lg flex items-center gap-2 text-[11px]">
          <span>!</span>
          <span>Yeu cau se duoc chuyen sang trang thai <strong>"Dang xu ly"</strong> khi ban bat dau thao tac xu ly.</span>
        </div>
      )}

      {detail.request && (
        <div className="flex flex-col lg:flex-row gap-4 min-h-[400px]">
          <PatientInfoPanel
            request={detail.request}
            onLinkPatient={handleLinkPatient}
            onCreatePatient={handleCreatePatient}
            submitting={detail.submitting}
            disabled={!canProcessRequest(detail.request, { isAdmin }).ok}
          />
          <ProcessingPanel
            request={detail.request}
            isAdmin={isAdmin}
            onConfirm={handleConfirm}
            onPropose={handlePropose}
            onReject={handleReject}
            onReopen={handleReopen}
            submitting={detail.submitting}
          />
          <RelatedInfoPanel
            request={detail.request}
            isAdmin={isAdmin}
            onStartProcessing={handleStartProcessing}
            onResendEmail={handleResendEmail}
            submitting={detail.submitting}
          />
        </div>
      )}

      {detail.request && detail.request.email_status === EMAIL_STATUS.FAILED && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg flex items-center justify-between gap-2 text-[11px]">
          <span>Email phan hoi lan truoc gui that bai. Vui long gui lai thu cong (BR-18, AC22).</span>
          <button
            type="button"
            onClick={() => handleResendEmail(detail.request.status)}
            disabled={detail.submitting}
            className="px-3 py-1 border border-red-300 bg-white text-red-700 rounded hover:bg-red-100 font-medium disabled:opacity-50"
          >
            Gui lai ngay
          </button>
        </div>
      )}
    </div>
  );
};

export default OnlineBookingManagement;
