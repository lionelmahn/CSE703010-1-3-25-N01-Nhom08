import axiosClient from './axiosClient';

/**
 * UC10 - Quan ly thong bao lich hen.
 *
 * Tat ca endpoint nam duoi `/api/notifications/*`, can Bearer token (Sanctum)
 * + permission `notifications.view|resend|send_manual|cancel` (xem
 * routes/api.php). Khong dung mock fallback - day la API that.
 */
export const notificationApi = {
  /**
   * GET /api/notifications - danh sach thong bao.
   * @param {object} params - { status, type, channel, source, appointment_id,
   *   online_booking_request_id, patient_id, date_from, date_to, q,
   *   page, per_page, sort_by, sort_dir }
   */
  list: async (params = {}) => {
    const response = await axiosClient.get('/notifications', { params });
    return response.data;
  },

  /**
   * GET /api/notifications/counts - so luong theo status (cho tabs).
   */
  counts: async (params = {}) => {
    const response = await axiosClient.get('/notifications/counts', { params });
    return response.data.counts || {};
  },

  /**
   * GET /api/notifications/{id} - chi tiet + events + parent + children.
   */
  get: async (id) => {
    const response = await axiosClient.get(`/notifications/${id}`);
    return response.data.data;
  },

  /**
   * POST /api/notifications/{id}/resend - chi resend khi status failed.
   * @param {number} id
   * @param {object} payload - { override_email? }
   */
  resend: async (id, payload = {}) => {
    const response = await axiosClient.post(`/notifications/${id}/resend`, payload);
    return response.data;
  },

  /**
   * POST /api/notifications - gui thong bao thu cong.
   * @param {object} payload - { type, appointment_id?, online_booking_request_id?,
   *   note?, recipient_email? }
   */
  sendManual: async (payload) => {
    const response = await axiosClient.post('/notifications', payload);
    return response.data;
  },

  /**
   * POST /api/notifications/{id}/cancel - chi admin, chi cancel pending.
   */
  cancel: async (id) => {
    const response = await axiosClient.post(`/notifications/${id}/cancel`);
    return response.data;
  },
};

export default notificationApi;
