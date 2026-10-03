import { get, post, put, del } from './apiHelpers';
import api from './api';

// CashewFlowX — independent module; every call stays under /cashew-flow-x.
const BASE = '/cashew-flow-x';

export const cashewFlowXCustomerService = {
  getAll: (filters = {}) => get(`${BASE}/customers`, filters),
  getById: (id) => get(`${BASE}/customers/${id}`),
  // Customer + summary + type totals + stock + payments + activity in one call.
  getDetails: (id) => get(`${BASE}/customers/${id}/details`),
  create: (data) => post(`${BASE}/customers`, data),
  update: (id, data) => put(`${BASE}/customers/${id}`, data),
  setStatus: async (id, status) => (await api.patch(`${BASE}/customers/${id}/status`, { status })),
  delete: (id) => del(`${BASE}/customers/${id}`),
};

export const cashewFlowXCashewTypeService = {
  getAll: (includeInactive = false) => get(`${BASE}/cashew-types`, includeInactive ? { includeInactive: true } : {}),
  create: (data) => post(`${BASE}/cashew-types`, data),
  update: (id, data) => put(`${BASE}/cashew-types/${id}`, data),
  delete: (id) => del(`${BASE}/cashew-types/${id}`),
};

export const cashewFlowXStockEntryService = {
  create: (data) => post(`${BASE}/stock-entries`, data),
  update: (id, data) => put(`${BASE}/stock-entries/${id}`, data),
  delete: (id) => del(`${BASE}/stock-entries/${id}`),
};

export const cashewFlowXPaymentEntryService = {
  getPaymentModes: () => get(`${BASE}/payment-modes`),
  create: (data) => post(`${BASE}/payment-entries`, data),
  update: (id, data) => put(`${BASE}/payment-entries/${id}`, data),
  delete: (id) => del(`${BASE}/payment-entries/${id}`),
};
