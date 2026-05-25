import axiosClient from './axiosClient';

/**
 * UC10 - Mau email he thong (admin only).
 *
 * Tat ca endpoint nam duoi `/api/notification-templates/*`, can Bearer token
 * (Sanctum) + permission `notification_templates.view|update`.
 */
export const notificationTemplateApi = {
  /**
   * GET /api/notification-templates - danh sach template.
   * @param {object} params - { is_active, q, page, per_page }
   */
  list: async (params = {}) => {
    const response = await axiosClient.get('/notification-templates', { params });
    return response.data;
  },

  /**
   * GET /api/notification-templates/{id} - chi tiet template.
   */
  get: async (id) => {
    const response = await axiosClient.get(`/notification-templates/${id}`);
    return response.data.data;
  },

  /**
   * PUT /api/notification-templates/{id} - cap nhat template.
   * @param {number} id
   * @param {object} payload - { name?, subject, body_html, body_text?,
   *   required_vars?, is_active? }
   */
  update: async (id, payload) => {
    const response = await axiosClient.put(`/notification-templates/${id}`, payload);
    return response.data;
  },

  /**
   * PATCH /api/notification-templates/{id}/toggle - bat/tat template.
   * @param {number} id
   * @param {object} payload - { is_active }
   */
  toggle: async (id, payload) => {
    const response = await axiosClient.patch(`/notification-templates/${id}/toggle`, payload);
    return response.data;
  },

  /**
   * POST /api/notification-templates/{id}/preview - preview render template.
   * @param {number} id
   * @param {object} payload - { vars: { ...sample } }
   */
  preview: async (id, payload = {}) => {
    const response = await axiosClient.post(`/notification-templates/${id}/preview`, payload);
    return response.data;
  },
};

export default notificationTemplateApi;
