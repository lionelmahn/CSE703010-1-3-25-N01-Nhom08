import axiosClient from './axiosClient';

const BASE = '/reports/salary-annual';

export const salaryAnnualReportApi = {
    options: () => axiosClient.get(`${BASE}/options`),
    summary: (params) => axiosClient.get(`${BASE}/summary`, { params }),
    months: (params) => axiosClient.get(`${BASE}/months`, { params }),
    export: (params) => axiosClient.get(`${BASE}/export`, { params, responseType: 'blob' }),
};

export default salaryAnnualReportApi;
