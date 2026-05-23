import axiosClient from './axiosClient';

/**
 * UC7 - Quan ly lich hen chinh thuc.
 *
 * Tat ca endpoint nam duoi `/api/appointments/*`, can Bearer token (Sanctum)
 * + permission `appointments.view` / `appointments.create` (xem
 * routes/api.php).
 *
 * Khong dung mock fallback - day la API that.
 */
export const appointmentApi = {
  /**
   * GET /api/appointments
   * @param {object} params - { status, branch_id, source, doctor_id, service_id, q, date, date_from, date_to, page, per_page }
   * @returns {Promise<{ data, meta, counts }>}
   */
  list: async (params = {}) => {
    const response = await axiosClient.get('/appointments', { params });
    return response.data;
  },

  /**
   * GET /api/appointments/options - patients (50 first), branches active,
   * sources, time-slots, statuses.
   */
  options: async (params = {}) => {
    const response = await axiosClient.get('/appointments/options', { params });
    return response.data;
  },

  /**
   * GET /api/appointments/counts - tom tat so luong theo status (cho summary).
   */
  counts: async (params = {}) => {
    const response = await axiosClient.get('/appointments/counts', { params });
    return response.data.counts || {};
  },

  /**
   * GET /api/appointments/calendar - du lieu Day/Week/Month view.
   * @param {object} params - { view: 'day'|'week'|'month', date, branch_id, doctor_id, status }
   */
  calendar: async (params = {}) => {
    const response = await axiosClient.get('/appointments/calendar', { params });
    return response.data;
  },

  /**
   * GET /api/appointments/{id} - chi tiet + history.
   */
  show: async (id) => {
    const response = await axiosClient.get(`/appointments/${id}`);
    return response.data.data;
  },

  /**
   * POST /api/appointments - tao moi (WF1).
   */
  create: async (payload) => {
    const response = await axiosClient.post('/appointments', payload);
    return response.data;
  },

  /**
   * PUT /api/appointments/{id} - cap nhat thong tin co ban (notes, services).
   */
  update: async (id, payload) => {
    const response = await axiosClient.put(`/appointments/${id}`, payload);
    return response.data;
  },

  /**
   * POST /api/appointments/{id}/reschedule (WF3).
   */
  reschedule: async (id, payload) => {
    const response = await axiosClient.post(`/appointments/${id}/reschedule`, payload);
    return response.data;
  },

  /**
   * POST /api/appointments/{id}/cancel (WF4).
   */
  cancel: async (id, reason) => {
    const response = await axiosClient.post(`/appointments/${id}/cancel`, { reason });
    return response.data;
  },

  /**
   * UC8 - Danh sach lich hen `cho_phan_cong_bac_si` cho dispatch queue.
   * @param {object} params - { branch_id, q, date, date_from, date_to, page, per_page }
   */
  pendingForAssignment: async (params = {}) => {
    const response = await axiosClient.get('/appointments/pending-assignment', { params });
    return response.data;
  },

  /**
   * UC8 - Bac si ung vien cho 1 lich hen (kem fit_score + blockers).
   */
  availableDoctors: async (id) => {
    const response = await axiosClient.get(`/appointments/${id}/available-doctors`);
    return response.data;
  },

  /**
   * UC8 - Phan cong bac si (status cho_phan_cong -> da_phan_cong).
   * @param {object} payload - { doctor_id, note? }
   */
  assignDoctor: async (id, payload) => {
    const response = await axiosClient.post(`/appointments/${id}/assign-doctor`, payload);
    return response.data;
  },

  /**
   * UC8 - Doi bac si (giu status, ghi history reassigned).
   * @param {object} payload - { doctor_id, reason, note? }
   */
  reassignDoctor: async (id, payload) => {
    const response = await axiosClient.post(`/appointments/${id}/reassign-doctor`, payload);
    return response.data;
  },

  /**
   * UC8 - Huy phan cong (status -> cho_phan_cong).
   * @param {object} payload - { reason, note? }
   */
  unassignDoctor: async (id, payload) => {
    const response = await axiosClient.post(`/appointments/${id}/unassign-doctor`, payload);
    return response.data;
  },
};

export default appointmentApi;
