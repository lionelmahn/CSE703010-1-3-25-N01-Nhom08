import axiosClient from './axiosClient';

/**
 * Patient API (UC5 + UC6.2).
 *
 * UC5 - Quan ly ho so benh nhan: list, detail, CRUD, deactivate/reactivate,
 *       gop ho so, duplicate-check, audit history.
 * UC6.2 - lookup (giu nguyen) - phuc vu booking management.
 *
 * Tat ca endpoint deu goi REST Laravel that, khong dung mock store.
 */

const unwrap = (response) => response?.data?.data ?? response?.data ?? null;

export const patientsApi = {
  /** GET /api/patients - paginated list (UC5). */
  list: async (params = {}) => {
    const response = await axiosClient.get('/patients', { params });
    return {
      data: Array.isArray(response?.data?.data) ? response.data.data : [],
      meta: response?.data?.meta || { current_page: 1, per_page: 10, total: 0, last_page: 1 },
    };
  },

  /** GET /api/patients/{id} - chi tiet ho so. */
  show: async (id) => {
    const response = await axiosClient.get(`/patients/${id}`);
    return unwrap(response);
  },

  /** POST /api/patients - tao moi ho so. */
  create: async (payload) => {
    const response = await axiosClient.post('/patients', payload);
    return {
      data: unwrap(response),
      message: response?.data?.message || 'Tao ho so thanh cong.',
    };
  },

  /** PUT /api/patients/{id} - cap nhat ho so. */
  update: async (id, payload) => {
    const response = await axiosClient.put(`/patients/${id}`, payload);
    return {
      data: unwrap(response),
      message: response?.data?.message || 'Cap nhat thanh cong.',
    };
  },

  /** POST /api/patients/{id}/deactivate - chuyen sang Ngung hoat dong. */
  deactivate: async (id, reason) => {
    const response = await axiosClient.post(`/patients/${id}/deactivate`, { reason });
    return {
      data: unwrap(response),
      message: response?.data?.message || 'Da chuyen sang Ngung hoat dong.',
    };
  },

  /** POST /api/patients/{id}/reactivate - mo lai ho so. */
  reactivate: async (id) => {
    const response = await axiosClient.post(`/patients/${id}/reactivate`);
    return {
      data: unwrap(response),
      message: response?.data?.message || 'Da mo lai ho so.',
    };
  },

  /** POST /api/patients/merge - gop ho so. */
  merge: async ({ primary_id, secondary_ids, note }) => {
    const response = await axiosClient.post('/patients/merge', {
      primary_id,
      secondary_ids,
      note,
    });
    return {
      data: unwrap(response),
      message: response?.data?.message || 'Gop ho so thanh cong.',
    };
  },

  /** POST /api/patients/duplicate-check - tim ho so nghi trung. */
  duplicateCheck: async (payload) => {
    const response = await axiosClient.post('/patients/duplicate-check', payload);
    const data = Array.isArray(response?.data?.data) ? response.data.data : [];
    return {
      data,
      meta: response?.data?.meta || { count: data.length },
    };
  },

  /** GET /api/patients/{id}/history - lich su thay doi/truy cap. */
  history: async (id) => {
    const response = await axiosClient.get(`/patients/${id}/history`);
    return Array.isArray(response?.data?.data) ? response.data.data : [];
  },

  /** GET /api/patients/sources - danh sach nguon tiep nhan (cho filter / form). */
  sources: async () => {
    const response = await axiosClient.get('/patients/sources');
    return Array.isArray(response?.data?.data) ? response.data.data : [];
  },

  /** GET /api/patients/lookup - UC6.2 lookup theo phone/email/name/q. */
  lookup: async ({ phone, email, name, q, limit } = {}) => {
    const response = await axiosClient.get('/patients/lookup', {
      params: { phone, email, name, q, limit },
    });
    return Array.isArray(response?.data?.data) ? response.data.data : [];
  },
};

export default patientsApi;
