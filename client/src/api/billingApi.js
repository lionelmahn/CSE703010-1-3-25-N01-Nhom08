import axiosClient from './axiosClient';

/**
 * UC13 - Thanh toan chi phi kham benh.
 *
 * Permission yeu cau:
 *  - invoices.view: queue, dashboard, audit-logs, list, show, patient invoices.
 *  - invoices.create: create from examination.
 *  - invoices.discount: discount, surcharge.
 *  - invoices.cancel: cancel.
 *  - invoices.adjust: adjust.
 *  - invoices.print: print invoice, receipt preview.
 *  - payments.create: create payments.
 *  - payments.refund: refund.
 */
export const billingApi = {
  // Queue & dashboard.
  queue: async (params = {}) => {
    const res = await axiosClient.get('/billing/queue', { params });
    return res.data;
  },
  dashboard: async () => {
    const res = await axiosClient.get('/billing/dashboard');
    return res.data;
  },
  auditLogs: async (params = {}) => {
    const res = await axiosClient.get('/billing/audit-logs', { params });
    return res.data;
  },

  // Invoices.
  list: async (params = {}) => {
    const res = await axiosClient.get('/invoices', { params });
    return res.data;
  },
  show: async (id) => {
    const res = await axiosClient.get(`/invoices/${id}`);
    return res.data;
  },
  create: async (examinationId) => {
    const res = await axiosClient.post('/invoices', { examination_id: examinationId });
    return res.data;
  },
  patientInvoices: async (patientId, params = {}) => {
    const res = await axiosClient.get(`/patients/${patientId}/invoices`, { params });
    return res.data;
  },

  // Invoice mutations.
  discount: async (id, payload) => {
    const res = await axiosClient.post(`/invoices/${id}/discount`, payload);
    return res.data;
  },
  surcharge: async (id, payload) => {
    const res = await axiosClient.post(`/invoices/${id}/surcharge`, payload);
    return res.data;
  },
  cancel: async (id, payload) => {
    const res = await axiosClient.post(`/invoices/${id}/cancel`, payload);
    return res.data;
  },
  adjust: async (id, payload) => {
    const res = await axiosClient.post(`/invoices/${id}/adjust`, payload);
    return res.data;
  },
  print: async (id) => {
    const res = await axiosClient.get(`/invoices/${id}/print`);
    return res.data;
  },

  // Payments + refunds.
  createPayments: async (invoiceId, payments) => {
    const res = await axiosClient.post(`/invoices/${invoiceId}/payments`, { payments });
    return res.data;
  },
  refund: async (invoiceId, payload) => {
    const res = await axiosClient.post(`/invoices/${invoiceId}/refunds`, payload);
    return res.data;
  },
  receipt: async (paymentId) => {
    const res = await axiosClient.get(`/payments/${paymentId}/receipt`);
    return res.data;
  },
};

export default billingApi;
