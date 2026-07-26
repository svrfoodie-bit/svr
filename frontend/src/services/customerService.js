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
  restore: (id) => put(`/customers/${id}/restore`, {}),
  getSummaryMetrics: async (filters = {}) => {
    const data = await get('/customers', filters);
    return {
      totalCustomers: data.length,
      activeCustomers: data.filter(c => c.isActive || c.status === 'Active').length,
      retailCustomers: data.filter(c => c.type === 'Retail').length,
      wholesaleCustomers: data.filter(c => c.type === 'Wholesale').length,
    };
  },
  getOutstanding: () => get('/customers/outstanding/list'),
};
