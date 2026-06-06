import axiosClient from './axiosClient';

/**
 * UC12 - Quan ly ho so benh an.
 *
 * Permission yeu cau:
 *  - dental_records.view: worklist, show, histories, tooth-chart GET.
 *  - dental_records.create: start.
 *  - dental_records.edit: update, save-draft, complete, recall, services CRUD,
 *    tooth-chart PUT.
 *  - dental_records.lock / dental_records.unlock.
 */
export const medicalRecordsApi = {
  // ---------------------------------------------------------------------
  // Worklist
  // ---------------------------------------------------------------------
  worklist: async (params = {}) => {
    const response = await axiosClient.get('/medical-records/worklist', { params });
    return response.data;
  },

  // ---------------------------------------------------------------------
  // Examination lifecycle
  // ---------------------------------------------------------------------
  show: async (id) => {
    const response = await axiosClient.get(`/examinations/${id}`);
    return response.data;
  },

  start: async (appointmentId) => {
    const response = await axiosClient.post('/examinations/start', {
      appointment_id: appointmentId,
    });
    return response.data;
  },

  /**
   * PATCH /api/examinations/{id} - auto-save.
   * Pass `last_updated_at` for optimistic locking (AC28).
   */
  update: async (id, payload) => {
    const response = await axiosClient.patch(`/examinations/${id}`, payload);
    return response.data;
  },

  saveDraft: async (id, note) => {
    const response = await axiosClient.post(`/examinations/${id}/save-draft`, { note });
    return response.data;
  },

  complete: async (id, payload = {}) => {
    const response = await axiosClient.post(`/examinations/${id}/complete`, payload);
    return response.data;
  },

  recall: async (id, payload) => {
    const response = await axiosClient.post(`/examinations/${id}/recall`, payload);
    return response.data;
  },

  lock: async (id, reason) => {
    const response = await axiosClient.post(`/examinations/${id}/lock`, { reason });
    return response.data;
  },

  unlock: async (id, reason) => {
    const response = await axiosClient.post(`/examinations/${id}/unlock`, { reason });
    return response.data;
  },

  // ---------------------------------------------------------------------
  // Service items
  // ---------------------------------------------------------------------
  addServiceItem: async (id, payload) => {
    const response = await axiosClient.post(`/examinations/${id}/services`, payload);
    return response.data;
  },

  updateServiceItem: async (id, itemId, payload) => {
    const response = await axiosClient.patch(`/examinations/${id}/services/${itemId}`, payload);
    return response.data;
  },

  removeServiceItem: async (id, itemId) => {
    const response = await axiosClient.delete(`/examinations/${id}/services/${itemId}`);
    return response.data;
  },

  // ---------------------------------------------------------------------
  // Tooth chart
  // ---------------------------------------------------------------------
  toothChart: async (id) => {
    const response = await axiosClient.get(`/examinations/${id}/tooth-chart`);
    return response.data;
  },

  upsertToothChart: async (id, entries) => {
    const response = await axiosClient.put(`/examinations/${id}/tooth-chart`, { entries });
    return response.data;
  },

  // ---------------------------------------------------------------------
  // Lookups
  // ---------------------------------------------------------------------
  options: async () => {
    const response = await axiosClient.get('/examinations/options');
    return response.data;
  },

  serviceComplexityPreview: async (params = {}) => {
    const response = await axiosClient.get('/examinations/options/service-complexity', { params });
    return response.data;
  },

  serviceCatalog: async (params = {}) => {
    const response = await axiosClient.get('/examinations/options/services', { params });
    return response.data;
  },

  toothStatuses: async () => {
    const response = await axiosClient.get('/examinations/options/tooth-statuses');
    return response.data;
  },

  histories: async (id, params = {}) => {
    const response = await axiosClient.get(`/examinations/${id}/histories`, { params });
    return response.data;
  },

  patientExaminations: async (patientId, params = {}) => {
    const response = await axiosClient.get(`/patients/${patientId}/examinations`, { params });
    return response.data;
  },
};

export default medicalRecordsApi;
