import axiosClient from './axiosClient';

/**
 * UC11 - Tiep nhan / Check-in benh nhan.
 *
 * Tat ca endpoint can Bearer token + 1 trong cac permission:
 *  - appointments.view (read).
 *  - appointments.check_in (check-in / no-show).
 *  - appointments.cancel_check_in (huy check-in).
 */
export const receptionApi = {
  /**
   * GET /api/reception/today-appointments
   * @param {object} params - { date, branch_id, q, arrival_filter, per_page, page }
   * @returns {Promise<{data, meta, counts}>}
   */
  listTodayAppointments: async (params = {}) => {
    const response = await axiosClient.get('/reception/today-appointments', { params });
    return response.data;
  },

  /**
   * GET /api/reception/queue
   * @param {object} params - { date, branch_id, doctor_id, bucket }
   * @returns {Promise<{buckets, summary, avg_wait_min}>}
   */
  queue: async (params = {}) => {
    const response = await axiosClient.get('/reception/queue', { params });
    return response.data;
  },

  /**
   * GET /api/reception/queue-stats
   */
  queueStats: async (params = {}) => {
    const response = await axiosClient.get('/reception/queue-stats', { params });
    return response.data;
  },

  /**
   * GET /api/reception/reasons - danh sach ly do no-show / cancel-checkin /
   * label cho arrival_flag (UI hardcode-fallback co the dung neu loi).
   */
  reasons: async () => {
    const response = await axiosClient.get('/reception/reasons');
    return response.data;
  },

  /**
   * POST /api/appointments/{id}/check-in
   * @param {number} id
   * @param {object} payload - { arrival_flag?, note? }
   */
  checkIn: async (id, payload = {}) => {
    const response = await axiosClient.post(`/appointments/${id}/check-in`, payload);
    return response.data;
  },

  /**
   * POST /api/appointments/{id}/cancel-check-in - chi admin co quyen.
   * @param {object} payload - { reason, note? }
   */
  cancelCheckIn: async (id, payload) => {
    const response = await axiosClient.post(`/appointments/${id}/cancel-check-in`, payload);
    return response.data;
  },

  /**
   * POST /api/appointments/{id}/no-show
   * @param {object} payload - { reason, note? }
   */
  markNoShow: async (id, payload) => {
    const response = await axiosClient.post(`/appointments/${id}/no-show`, payload);
    return response.data;
  },
};

export default receptionApi;
