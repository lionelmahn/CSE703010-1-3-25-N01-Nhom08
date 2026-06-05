import axiosClient from './axiosClient';

export const hourlyRateApi = {
    list: (params) => axiosClient.get('/payroll/hourly-rates', { params }),
    current: (params) => axiosClient.get('/payroll/hourly-rates/current', { params }),
    show: (id) => axiosClient.get(`/payroll/hourly-rates/${id}`),
    create: (payload) => axiosClient.post('/payroll/hourly-rates', payload),
    stop: (id, payload) => axiosClient.post(`/payroll/hourly-rates/${id}/stop`, payload),
    auditLogs: (id, params) => axiosClient.get(`/payroll/hourly-rates/${id}/audit-logs`, { params }),
};
