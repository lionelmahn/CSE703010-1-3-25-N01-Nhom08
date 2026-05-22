import { useCallback, useEffect, useRef, useState } from 'react';
import { onlineBookingRequestApi } from '@/api/onlineBookingRequestApi';
import { REQUEST_STATUS } from '../constants';

/**
 * Hook chi tiet yeu cau cho receptionist (UC6.2).
 *
 * - Tu dong chuyen tu cho_xu_ly -> dang_xu_ly khi mo (Main Flow buoc 6).
 * - Expose cac action: link/create patient, confirm, propose, reject, reopen,
 *   resend email, update internal note.
 * - VR9 - backend tu dong gui email phan hoi ngay trong handler
 *   confirm/proposeAlternative/reject (xem OnlineBookingController), do do
 *   FE KHONG goi sendEmail() lan nua sau khi action thanh cong - neu khong
 *   khach hang nhan email 2 lan. Resend thu cong van di qua resendEmail().
 *
 * @param {number|null} requestId - id yeu cau dang chon
 * @param {string} actor - role/name nguoi xu ly (dung cho audit)
 * @param {function} onChange - callback de parent refresh list.
 */
export const useOnlineBookingRequestDetail = (requestId, actor, onChange) => {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const autoStartedRef = useRef(new Set());

  const fetchOne = useCallback(async (id) => {
    if (!id) {
      setRequest(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await onlineBookingRequestApi.show(id);
      setRequest(data);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Khong the tai chi tiet yeu cau');
      setRequest(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOne(requestId);
  }, [fetchOne, requestId]);

  // Auto-transition Cho xu ly -> Dang xu ly khi mo detail lan dau (SR1).
  useEffect(() => {
    if (!request) return;
    if (request.status !== REQUEST_STATUS.PENDING) return;
    if (autoStartedRef.current.has(request.id)) return;
    autoStartedRef.current.add(request.id);
    (async () => {
      try {
        const updated = await onlineBookingRequestApi.startProcessing(request.id, actor);
        if (updated) setRequest(updated);
        onChange && onChange();
      } catch {
        // Khong block UI neu loi - se thu lai khi user thuc hien action ke tiep.
        autoStartedRef.current.delete(request.id);
      }
    })();
  }, [request, actor, onChange]);

  const refresh = useCallback(() => fetchOne(requestId), [fetchOne, requestId]);

  const wrap = useCallback(async (fn) => {
    setSubmitting(true);
    try {
      const result = await fn();
      return result;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const linkPatient = useCallback((patientId) => wrap(async () => {
    const updated = await onlineBookingRequestApi.linkPatient(request.id, patientId, actor);
    if (updated) setRequest(updated);
    onChange && onChange();
    return updated;
  }), [wrap, request, actor, onChange]);

  const createPatient = useCallback((patientData) => wrap(async () => {
    const result = await onlineBookingRequestApi.createPatient(request.id, patientData, actor);
    if (result?.request) setRequest(result.request);
    onChange && onChange();
    return result;
  }), [wrap, request, actor, onChange]);

  const confirmAppointment = useCallback((payload) => wrap(async () => {
    // VR9: backend (OnlineBookingController::confirm) da safeSendMail ER-01
    // ngay trong transaction xac nhan, do do KHONG goi sendEmail() o day.
    const updated = await onlineBookingRequestApi.confirm(request.id, payload, actor);
    if (updated) setRequest(updated);
    onChange && onChange();
    return updated;
  }), [wrap, request, actor, onChange]);

  const proposeAlternative = useCallback((slots, reason) => wrap(async () => {
    // VR9: backend tu dong gui ER-02 khi de xuat lich khac thanh cong.
    const updated = await onlineBookingRequestApi.proposeAlternative(request.id, { slots, reason }, actor);
    if (updated) setRequest(updated);
    onChange && onChange();
    return updated;
  }), [wrap, request, actor, onChange]);

  const rejectRequest = useCallback((reason) => wrap(async () => {
    // VR9: backend tu dong gui ER-03 khi tu choi thanh cong.
    const updated = await onlineBookingRequestApi.reject(request.id, reason, actor);
    if (updated) setRequest(updated);
    onChange && onChange();
    return updated;
  }), [wrap, request, actor, onChange]);

  const reopenRequest = useCallback((reason) => wrap(async () => {
    const updated = await onlineBookingRequestApi.reopen(request.id, reason, actor);
    if (updated) setRequest(updated);
    onChange && onChange();
    return updated;
  }), [wrap, request, actor, onChange]);

  const resendEmail = useCallback((kind) => wrap(async () => {
    const updated = await onlineBookingRequestApi.resendEmail(request.id, kind, actor);
    if (updated) setRequest(updated);
    onChange && onChange();
    return updated;
  }), [wrap, request, actor, onChange]);

  const updateInternalNote = useCallback((note) => wrap(async () => {
    const updated = await onlineBookingRequestApi.updateInternalNote(request.id, note);
    if (updated) setRequest(updated);
    return updated;
  }), [wrap, request]);

  return {
    request,
    loading,
    error,
    submitting,
    refresh,
    linkPatient,
    createPatient,
    confirmAppointment,
    proposeAlternative,
    rejectRequest,
    reopenRequest,
    resendEmail,
    updateInternalNote,
  };
};
