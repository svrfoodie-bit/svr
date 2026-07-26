import { get, post, del } from './apiHelpers';

export const PAYMENT_MODES = ['Cash', 'UPI', 'Cheque', 'Bank Transfer'];
const STRICT_PRODUCTION = import.meta.env.PROD && import.meta.env.VITE_STRICT_PRODUCTION !== 'false';

export const salesPaymentService = {
  getAll: (filters = {}) => get('/sales-payments', filters),
  getById: (id) => get(`/sales-payments/${id}`),
  getByOrderId: (orderId) => get('/sales-payments', { orderId }),
  create: (paymentData) => post('/sales-payments', paymentData),
  delete: (id) => del(`/sales-payments/${id}`),
  getSummary: (filters = {}) => get('/sales-payments/summary/metrics', filters),
  getSummaryMetrics: async (filters = {}) => {
    try {
      return await get('/sales-payments/summary/metrics', filters);
    } catch (error) {
      if (STRICT_PRODUCTION) {
        throw error;
      }
      const payments = await get('/sales-payments', filters);
      return {
        totalPayments: payments.length,
        totalAmount: payments.reduce((s, p) => s + parseFloat(p.amount ?? 0), 0),
        cashPayments: payments.filter(p => p.paymentMode === 'Cash').reduce((s, p) => s + parseFloat(p.amount ?? 0), 0),
        upiPayments: payments.filter(p => p.paymentMode === 'PhonePe' || p.paymentMode === 'UPI').reduce((s, p) => s + parseFloat(p.amount ?? 0), 0),
        bankPayments: payments.filter(p => p.paymentMode === 'Bank').reduce((s, p) => s + parseFloat(p.amount ?? 0), 0),
        chequePayments: payments.filter(p => p.paymentMode === 'Cheque').reduce((s, p) => s + parseFloat(p.amount ?? 0), 0),
      };
    }
  },
};
