import axiosClient from './axiosClient';

const BASE = '/reports/salary';

export const salaryReportApi = {
    options: () => axiosClient.get(`${BASE}/options`),
    summary: (params) => axiosClient.get(`${BASE}/summary`, { params }),
    doctors: (params) => axiosClient.get(`${BASE}/doctors`, { params }),
    export: (params) => axiosClient.get(`${BASE}/export`, { params, responseType: 'blob' }),
    bulkCreate: (payload) => axiosClient.post(`${BASE}/bulk-create`, payload),
    bulkRecalculate: (payload) => axiosClient.post(`${BASE}/bulk-recalculate`, payload),
};

export default salaryReportApi;
