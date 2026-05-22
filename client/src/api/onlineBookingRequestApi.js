import axiosClient from './axiosClient';
import {
  mockConfirmAppointment,
  mockCreatePatient,
  mockGetRequest,
  mockLinkPatient,
  mockListRequests,
  mockProposeAlternative,
  mockRejectRequest,
  mockReopenRequest,
  mockResendEmail,
  mockSendEmail,
  mockStartProcessing,
  mockUpdateInternalNote,
} from '@/features/online-booking-management/mockStore';

/**
 * UC6.2 - Service goi API quan ly yeu cau dat lich online.
 *
 * Laravel HIEN TAI chua expose /api/online-bookings (xem inspection trong PR).
 * Service nay van design API-first nhung mock fallback de demo flow.
 * Khi backend that san sang chi can dat USE_MOCK_FALLBACK = false.
 */

const USE_MOCK_FALLBACK = false;

const isMockableError = (error) => {
  if (!error) return false;
  if (error.response) return error.response.status === 404 || error.response.status === 405;
  return !!error.request;
};

const tryReal = async (fn) => {
  try {
    return await fn();
  } catch (error) {
    if (USE_MOCK_FALLBACK && isMockableError(error)) return null;
    throw error;
  }
};

/**
 * BE Laravel tra response envelope `{ data: {...} }` cho moi show/action.
 * Mock cu tra thang object - de hooks cu khong phai sua, ta unwrap o day.
 */
const unwrapDetail = (resp) => {
  if (!resp) return resp;
  if (resp.data && typeof resp.data === 'object' && !Array.isArray(resp.data)
      && (resp.data.id || resp.data.code)) {
    return resp.data;
  }
  return resp;
};

export const onlineBookingRequestApi = {
  /**
   * GET /api/online-bookings
   * @param {object} params - filters: { status, branch_id, service_id, date_from, date_to, q, page, per_page }
   */
  list: async (params = {}) => {
    const real = await tryReal(() => axiosClient.get('/online-bookings', { params }).then((r) => r.data));
    if (real) return real;
    return mockListRequests(params);
  },

  /**
   * GET /api/online-bookings/{id}
   */
  show: async (id) => {
    const real = await tryReal(() => axiosClient.get(`/online-bookings/${id}`).then((r) => r.data));
    if (real) return unwrapDetail(real);
    const data = mockGetRequest(id);
    if (!data) throw new Error('Khong tim thay yeu cau');
    return data;
  },

  /**
   * POST /api/online-bookings/{id}/start-processing
   * Body: { actor }
   */
  startProcessing: async (id, actor) => {
    const real = await tryReal(() => axiosClient.post(`/online-bookings/${id}/start-processing`, { actor }).then((r) => r.data));
    if (real) return unwrapDetail(real);
    return mockStartProcessing(id, actor);
  },

  /**
   * POST /api/online-bookings/{id}/link-patient
   * Body: { patient_id, actor }
   */
  linkPatient: async (id, patientId, actor) => {
    const real = await tryReal(() => axiosClient.post(`/online-bookings/${id}/link-patient`, { patient_id: patientId, actor }).then((r) => r.data));
    if (real) return unwrapDetail(real);
    return mockLinkPatient(id, patientId, actor);
  },

  /**
   * POST /api/online-bookings/{id}/create-patient
   * Body: { patient: {...}, actor }
   *
   * BE Laravel tra envelope `{ data: <request>, patient: <patient> }`. Mock
   * cu cung tra `{ request, patient }`. Adapter chuan hoa ve `{ request,
   * patient }` de hook khong phai biet ve key `data`, va de KHONG mat field
   * `patient` (truoc day adapter dung unwrapDetail nen tra ra moi request
   * va lam vo hieu hoa logic setRequest(result.request) trong hook).
   */
  createPatient: async (id, patientData, actor) => {
    const real = await tryReal(() => axiosClient.post(`/online-bookings/${id}/create-patient`, { patient: patientData, actor }).then((r) => r.data));
    if (real) {
      return {
        request: real.data || null,
        patient: real.patient || null,
      };
    }
    return mockCreatePatient(id, patientData, actor);
  },

  /**
   * POST /api/online-bookings/{id}/confirm
   * FE goi voi { date, time_slot_id, service_id, service_ids, branch_id, patient_id, actor }
   * BE Laravel mong { appointment_date, time_slot, service_ids, branch_id, patient_id }
   * Adapter giu tuong thich nguoc tu mock cu (date/time_slot_id) sang spec moi.
   */
  confirm: async (id, payload, actor) => {
    const bePayload = {
      appointment_date: payload.appointment_date || payload.date,
      time_slot: payload.time_slot || payload.time_slot_id,
      service_ids: payload.service_ids
        || (payload.service_id ? [payload.service_id] : []),
      branch_id: payload.branch_id,
      patient_id: payload.patient_id,
      notes: payload.notes || null,
      actor,
    };
    const real = await tryReal(() => axiosClient.post(`/online-bookings/${id}/confirm`, bePayload).then((r) => r.data));
    if (real) return unwrapDetail(real);
    return mockConfirmAppointment(id, payload, actor);
  },

  /**
   * POST /api/online-bookings/{id}/propose-alternative
   * FE goi voi { slots: [{date, time_slot_id}], reason, actor }
   * BE Laravel mong { proposed_slots: [{date, time_slot}], message }
   */
  proposeAlternative: async (id, payload, actor) => {
    const slots = (payload.slots || payload.proposed_slots || []).map((s) => ({
      date: s.date,
      time_slot: s.time_slot || s.time_slot_id,
    }));
    const bePayload = {
      proposed_slots: slots,
      message: payload.reason || payload.message || null,
      actor,
    };
    const real = await tryReal(() => axiosClient.post(`/online-bookings/${id}/propose-alternative`, bePayload).then((r) => r.data));
    if (real) return unwrapDetail(real);
    return mockProposeAlternative(id, payload.slots, payload.reason, actor);
  },

  /**
   * POST /api/online-bookings/{id}/reject
   * Body: { reason, actor }
   */
  reject: async (id, reason, actor) => {
    const real = await tryReal(() => axiosClient.post(`/online-bookings/${id}/reject`, { reason, actor }).then((r) => r.data));
    if (real) return unwrapDetail(real);
    return mockRejectRequest(id, reason, actor);
  },

  /**
   * POST /api/online-bookings/{id}/reopen
   * Body: { reason, actor }
   * Chi admin (BR-19).
   */
  reopen: async (id, reason, actor) => {
    const real = await tryReal(() => axiosClient.post(`/online-bookings/${id}/reopen`, { reason, actor }).then((r) => r.data));
    if (real) return unwrapDetail(real);
    return mockReopenRequest(id, reason, actor);
  },

  /**
   * POST /api/online-bookings/{id}/send-email
   * Body: { kind: "ER-01" | "ER-02" | "ER-03" | "ER-04" }
   * VR9 - chi goi sau khi state update thanh cong.
   */
  sendEmail: async (id, kind, actor) => {
    const real = await tryReal(() => axiosClient.post(`/online-bookings/${id}/send-email`, { kind, actor }).then((r) => r.data));
    if (real) return unwrapDetail(real);
    return mockSendEmail(id, kind, actor);
  },

  /**
   * POST /api/online-bookings/{id}/resend-email
   * Body: { kind }
   * BR-18 - gui lai khi lan truoc failed.
   */
  resendEmail: async (id, kind, actor) => {
    const real = await tryReal(() => axiosClient.post(`/online-bookings/${id}/resend-email`, { kind, actor }).then((r) => r.data));
    if (real) return unwrapDetail(real);
    return mockResendEmail(id, kind, actor);
  },

  /**
   * PATCH /api/online-bookings/{id}/internal-note
   * Body: { internal_note }
   * VR10 enforced ngoai service.
   */
  updateInternalNote: async (id, note) => {
    const real = await tryReal(() => axiosClient.patch(`/online-bookings/${id}/internal-note`, { internal_note: note }).then((r) => r.data));
    if (real) return unwrapDetail(real);
    return mockUpdateInternalNote(id, note);
  },
};

export default onlineBookingRequestApi;
