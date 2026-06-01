import axiosClient from './axiosClient';

const BASE = '/reports/revenue';

export const revenueApi = {
    options: async () => {
        const res = await axiosClient.get(`${BASE}/options`);
        return res.data;
    },
    summary: async (params = {}) => {
        const res = await axiosClient.get(`${BASE}/summary`, { params });
        return res.data;
    },
    trend: async (params = {}) => {
        const res = await axiosClient.get(`${BASE}/trend`, { params });
        return res.data;
    },
    byMethod: async (params = {}) => {
        const res = await axiosClient.get(`${BASE}/by-method`, { params });
        return res.data;
    },
    byBranch: async (params = {}) => {
        const res = await axiosClient.get(`${BASE}/by-branch`, { params });
        return res.data;
    },
    byDoctor: async (params = {}) => {
        const res = await axiosClient.get(`${BASE}/by-doctor`, { params });
        return res.data;
    },
    byService: async (params = {}) => {
        const res = await axiosClient.get(`${BASE}/by-service`, { params });
        return res.data;
    },
    details: async (params = {}) => {
        const res = await axiosClient.get(`${BASE}/details`, { params });
        return res.data;
    },
    debtSummary: async (params = {}) => {
        const res = await axiosClient.get(`${BASE}/debt-summary`, { params });
        return res.data;
    },
    debtList: async (params = {}) => {
        const res = await axiosClient.get(`${BASE}/debt-list`, { params });
        return res.data;
    },
    export: async (params = {}) => {
        const res = await axiosClient.get(`${BASE}/export`, {
            params,
            responseType: 'blob',
        });
        return res;
    },
};

export default revenueApi;
