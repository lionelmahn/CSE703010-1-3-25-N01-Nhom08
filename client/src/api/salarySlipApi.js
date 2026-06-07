import axiosClient from './axiosClient';

export const salarySlipApi = {
    list: (params) => axiosClient.get('/payroll/salary-slips', { params }),
    doctors: (params) => axiosClient.get('/payroll/salary-slips/doctors', { params }),
    preview: (params) => axiosClient.get('/payroll/salary-slips/preview', { params }),
    show: (id) => axiosClient.get(`/payroll/salary-slips/${id}`),
    auditLogs: (id, params) => axiosClient.get(`/payroll/salary-slips/${id}/audit-logs`, { params }),
    create: (payload) => axiosClient.post('/payroll/salary-slips', payload),
    recalculate: (id) => axiosClient.post(`/payroll/salary-slips/${id}/recalculate`),
    finalize: (id) => axiosClient.post(`/payroll/salary-slips/${id}/finalize`),
};
