import { get, post, put, del } from './apiHelpers';

export const CUSTOMER_TYPES = ['Retail', 'Wholesale'];

export const customerService = {
  getAll: (filters = {}) => get('/customers', filters),
  getById: (id) => get(`/customers/${id}`),
  getActive: () => get('/customers', { isActive: true }),
  create: (customerData) => post('/customers', customerData),
  update: (id, customerData) => put(`/customers/${id}`, customerData),
  toggleStatus: async (id) => {
    const customer = await customerService.getById(id);
    if (!customer) {
      throw new Error('Customer not found');
    }
    return customerService.update(id, { isActive: !customer.isActive });
  },
  delete: (id) => del(`/customers/${id}`),
  getSummaryMetrics: (filters = {}) => get('/customers/summary/metrics', filters),
  getOutstanding: () => get('/customers/outstanding/list'),
};
