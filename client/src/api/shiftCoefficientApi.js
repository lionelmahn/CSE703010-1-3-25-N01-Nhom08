import axiosClient from './axiosClient';

export const shiftCoefficientApi = {
    list: (params) => axiosClient.get('/payroll/shift-coefficients', { params }),
    effective: (params) => axiosClient.get('/payroll/shift-coefficients/effective', { params }),
    show: (id) => axiosClient.get(`/payroll/shift-coefficients/${id}`),
    create: (payload) => axiosClient.post('/payroll/shift-coefficients', payload),
    bulkCreate: (payload) => axiosClient.post('/payroll/shift-coefficients/bulk', payload),
    stop: (id, payload) => axiosClient.post(`/payroll/shift-coefficients/${id}/stop`, payload),
    auditLogs: (id, params) => axiosClient.get(`/payroll/shift-coefficients/${id}/audit-logs`, { params }),
};
