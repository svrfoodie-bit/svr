import { get, post, put, del } from './apiHelpers';

export const EXPENSE_CATEGORIES = {
  Factory: ['Electricity', 'Water', 'Rent', 'Repairs', 'Machine Service'],
  Operational: ['Transport', 'Packing Material', 'Fuel', 'Ice / Drying', 'Loading'],
  Administrative: ['Phone / Internet', 'Office Supplies', 'Miscellaneous'],
  Finance: ['Loan Interest'],
};

export const ALL_CATEGORIES = [
  ...EXPENSE_CATEGORIES.Factory,
  ...EXPENSE_CATEGORIES.Operational,
  ...EXPENSE_CATEGORIES.Administrative,
];

export const PAYMENT_MODES = ['Cash', 'PhonePe', 'Bank'];

export const expenseService = {
  getAll: (filters = {}) => get('/expenses', filters),
  getById: (id) => get(`/expenses/${id}`),
  create: (expenseData) => post('/expenses', expenseData),
  update: (id, expenseData) => put(`/expenses/${id}`, expenseData),
  delete: (id) => del(`/expenses/${id}`),
  getCategoryWiseSummary: (filters = {}) => get('/expenses/category-wise/summary', filters),
  getPaymentModeWiseSummary: (filters = {}) => get('/expenses/payment-mode-wise/summary', filters),
  getSummaryMetrics: (filters = {}) => get('/expenses/summary/metrics', filters),
  getCategories: () => get('/expenses/categories/list'),
};
