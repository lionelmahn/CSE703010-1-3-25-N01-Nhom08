import axiosClient from './axiosClient';

const BASE = '/reports/salary-annual-all';

// UC19 - Bao cao tien luong tat ca bac si trong mot nam (doc tu UC16).
export const salaryAnnualAllReportApi = {
    options: () => axiosClient.get(`${BASE}/options`),
    summary: (params) => axiosClient.get(`${BASE}/summary`, { params }),
    doctors: (params) => axiosClient.get(`${BASE}/doctors`, { params }),
    months: (params) => axiosClient.get(`${BASE}/months`, { params }),
    matrix: (params) => axiosClient.get(`${BASE}/matrix`, { params }),
    export: (params) => axiosClient.get(`${BASE}/export`, { params, responseType: 'blob' }),
};

export default salaryAnnualAllReportApi;
