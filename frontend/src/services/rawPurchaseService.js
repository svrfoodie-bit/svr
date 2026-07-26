import { get, post, put, del } from './apiHelpers';

export const rawPurchaseService = {
  getAll: (filters = {}) => get('/raw-purchases', filters),
  getById: (id) => get(`/raw-purchases/${id}`),
  create: (purchaseData, paymentData = null) => {
    if (paymentData) {
      return post('/raw-purchases', { ...purchaseData, payment: paymentData });
    }
    return post('/raw-purchases', purchaseData);
  },
  update: (id, purchaseData) => put(`/raw-purchases/${id}`, purchaseData),
  delete: (id) => del(`/raw-purchases/${id}`),
  getSummary: (filters = {}) => get('/raw-purchases/summary/metrics', filters),
  // Backward-compatible alias used by pages expecting `getSummaryMetrics`
  getSummaryMetrics: (filters = {}) => get('/raw-purchases/summary/metrics', filters),
  // Supplier-wise summary derived from raw purchase rows
  getSupplierSummary: async (filters = {}) => {
    const purchases = await get('/raw-purchases', filters);
    const grouped = new Map();

    purchases.forEach((purchase) => {
      const supplierId = purchase.supplierId;
      const supplierName = purchase.supplierName || 'Unknown Supplier';
      const quantity = parseFloat(purchase.quantityKg ?? purchase.quantity ?? 0) || 0;
      const totalAmount = parseFloat(purchase.totalAmount ?? 0) || 0;
      const totalPaid = parseFloat(purchase.totalPaid ?? 0) || 0;
      const totalOutstanding = Math.max(0, totalAmount - totalPaid);

      if (!grouped.has(supplierId)) {
        grouped.set(supplierId, {
          supplierId,
          supplierName,
          totalQuantity: 0,
          totalAmount: 0,
          totalPaid: 0,
          totalOutstanding: 0,
          status: 'Paid',
        });
      }

      const acc = grouped.get(supplierId);
      acc.totalQuantity += quantity;
      acc.totalAmount += totalAmount;
      acc.totalPaid += totalPaid;
      acc.totalOutstanding += totalOutstanding;
      acc.status = acc.totalOutstanding > 0 ? 'Credit' : 'Paid';
    });

    return Array.from(grouped.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  },
  
  // Payment operations
  addPayment: (id, paymentData) => post('/raw-purchase-payments', { ...paymentData, rawPurchaseId: id }),
  getAllPayments: (filters = {}) => get('/raw-purchase-payments', filters),
  getPayments: (id) => get(`/raw-purchases/${id}/payments`),
  getPaymentById: (paymentId) => get(`/raw-purchase-payments/${paymentId}`),
  updatePayment: (paymentId, paymentData) => put(`/raw-purchase-payments/${paymentId}`, paymentData),
  deletePayment: (paymentId) => del(`/raw-purchase-payments/${paymentId}`),
  getPaymentsSummary: (filters = {}) => get('/raw-purchase-payments/summary/metrics', filters),
};
