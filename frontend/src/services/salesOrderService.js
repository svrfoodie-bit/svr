import { get, post, put, del } from './apiHelpers';

export const PAYMENT_TYPES = ['Cash', 'Credit', 'UPI', 'Cheque'];
export const PAYMENT_STATUS = {
  PAID: 'Paid',
  PARTIAL: 'Partial',
  PENDING: 'Pending',
};
const STRICT_PRODUCTION = import.meta.env.PROD && import.meta.env.VITE_STRICT_PRODUCTION !== 'false';

export const salesOrderService = {
  getAll: (filters = {}) => get('/sales-orders', filters),
  getById: (id) => get(`/sales-orders/${id}`),
  create: (orderData) => post('/sales-orders', orderData),
  update: (id, orderData) => put(`/sales-orders/${id}`, orderData),
  delete: (id) => del(`/sales-orders/${id}`),
  getOutstanding: () => get('/sales-orders/outstanding/list'),
  getOutstandingOrders: async () => {
    const data = await get('/sales-orders/outstanding/list');
    return data.map(o => ({
      ...o,
      outstandingAmount: o.outstandingAmount ?? o.outstanding ?? 0,
    }));
  },
  getCustomerWiseSummary: async () => {
    try {
      return await get('/sales-orders/customer-wise/summary');
    } catch (error) {
      if (STRICT_PRODUCTION) {
        throw error;
      }
      // Derive from all orders if endpoint missing
      const orders = await get('/sales-orders');
      const map = {};
      orders.forEach(o => {
        if (!map[o.customerId]) {
          map[o.customerId] = {
            customerId: o.customerId,
            customerName: o.customerName,
            totalOrders: 0,
            totalSales: 0,
            totalPaid: 0,
            totalOutstanding: 0,
          };
        }
        map[o.customerId].totalOrders += 1;
        map[o.customerId].totalSales += parseFloat(o.totalAmount ?? 0);
        map[o.customerId].totalPaid += parseFloat(o.paidAmount ?? 0);
        map[o.customerId].totalOutstanding += parseFloat(o.outstandingAmount ?? o.balanceAmount ?? 0);
      });
      return Object.values(map);
    }
  },
  getSummaryMetrics: (filters = {}) => get('/sales-orders/summary/metrics', filters),
  getGradeWiseSummary: (filters = {}) => get('/sales-orders/grade-wise/summary', filters),
};
