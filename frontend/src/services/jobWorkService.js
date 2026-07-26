import { get, post, put, del } from './apiHelpers';

export const jobWorkService = {
  getAll: (filters = {}) => get('/job-work', filters),
  getById: (id) => get(`/job-work/${id}`),
  create: (jobWorkData) => post('/job-work', jobWorkData),
  update: (id, jobWorkData) => put(`/job-work/${id}`, jobWorkData),
  delete: (id) => del(`/job-work/${id}`),
  getSummaryMetrics: (filters = {}) => get('/job-work/summary/metrics', filters),
  
  // Payment operations
  addPayment: (id, paymentData) => post('/job-work-payments', { ...paymentData, jobWorkId: id }),
  getAllPayments: (filters = {}) => get('/job-work-payments', filters),
  getPayments: (id) => get(`/job-work/${id}/payments`),
  getPaymentById: (paymentId) => get(`/job-work-payments/${paymentId}`),
  updatePayment: (paymentId, paymentData) => put(`/job-work-payments/${paymentId}`, paymentData),
  deletePayment: (paymentId) => del(`/job-work-payments/${paymentId}`),
  getPaymentsSummary: (filters = {}) => get('/job-work-payments/summary/metrics', filters),
};
