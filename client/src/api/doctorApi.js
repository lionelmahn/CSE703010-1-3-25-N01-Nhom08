import axiosClient from './axiosClient';

/**
 * UC8 - API doc thong tin bac si phuc vu dieu phoi.
 *
 * Yeu cau permission `appointments.view` (kem theo cac route /doctors trong
 * cung group). Doctor entity = User co role bac_si.
 */
export const doctorApi = {
  /**
   * GET /api/doctors - danh sach bac si (filter branch_id, q).
   * @param {object} params - { branch_id, q }
   */
  list: async (params = {}) => {
    const response = await axiosClient.get('/doctors', { params });
    return response.data.data || [];
  },

  /**
   * GET /api/doctors/{id}/availability?date=YYYY-MM-DD - lich kha dung
   * trong 1 ngay (work_schedule + appointments + leave).
   */
  availability: async (userId, date) => {
    const response = await axiosClient.get(`/doctors/${userId}/availability`, {
      params: { date },
    });
    return response.data;
  },

  /**
   * GET /api/doctors/workload?date=YYYY-MM-DD - workload tom tat
   * (utilization, free/used slots). Truyen user_ids="1,2,3" de filter.
   */
  workload: async (params = {}) => {
    const response = await axiosClient.get('/doctors/workload', { params });
    return response.data.data || [];
  },
};

export default doctorApi;
