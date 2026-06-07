import axiosClient from './axiosClient';

export const branchApi = {
    list: () => axiosClient.get('/branches'),
};
