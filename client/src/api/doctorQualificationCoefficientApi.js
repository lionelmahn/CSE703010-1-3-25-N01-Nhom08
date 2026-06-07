import axiosClient from './axiosClient';

export const doctorQualificationCoefficientApi = {
    list: (params) => axiosClient.get('/payroll/doctor-qualification-coefficients', { params }),
    options: () => axiosClient.get('/payroll/doctor-qualification-coefficients/options'),
    effective: (params) => axiosClient.get('/payroll/doctor-qualification-coefficients/effective', { params }),
    show: (id) => axiosClient.get(`/payroll/doctor-qualification-coefficients/${id}`),
    create: (payload) => axiosClient.post('/payroll/doctor-qualification-coefficients', payload),
    bulkCreate: (payload) => axiosClient.post('/payroll/doctor-qualification-coefficients/bulk', payload),
    stop: (id, payload) => axiosClient.post(`/payroll/doctor-qualification-coefficients/${id}/stop`, payload),
    auditLogs: (id, params) => axiosClient.get(`/payroll/doctor-qualification-coefficients/${id}/audit-logs`, { params }),
};

export default doctorQualificationCoefficientApi;
