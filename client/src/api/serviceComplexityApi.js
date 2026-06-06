import axiosClient from './axiosClient';

export const serviceComplexityApi = {
    list: (params) => axiosClient.get('/payroll/service-complexities', { params }),
    options: (params) => axiosClient.get('/payroll/service-complexities/options', { params }),
    effective: (params) => axiosClient.get('/payroll/service-complexities/effective', { params }),
    show: (id) => axiosClient.get(`/payroll/service-complexities/${id}`),
    create: (payload) => axiosClient.post('/payroll/service-complexities', payload),
    bulkCreate: (payload) => axiosClient.post('/payroll/service-complexities/bulk', payload),
    stop: (id, payload) => axiosClient.post(`/payroll/service-complexities/${id}/stop`, payload),
    auditLogs: (id, params) => axiosClient.get(`/payroll/service-complexities/${id}/audit-logs`, { params }),
};

export default serviceComplexityApi;
