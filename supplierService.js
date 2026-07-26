import { get, post, put, del } from './apiHelpers';

export const supplierService = {
  getAll: (filters = {}) => get('/suppliers', filters),
  getById: (id) => get(`/suppliers/${id}`),
  create: (supplierData) => post('/suppliers', supplierData),
  update: (id, supplierData) => put(`/suppliers/${id}`, supplierData),
  delete: (id) => del(`/suppliers/${id}`),
  getSummary: (filters = {}) => get('/suppliers/summary/metrics', filters),
};
