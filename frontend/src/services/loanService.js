import api from './api';

export const LOAN_TYPES = ['Bank', 'Hand'];
export const INTEREST_PAYMENT_TYPES = ['Monthly', 'EndOfTerm'];
export const REPAYMENT_TYPES = ['EMI', 'Custom'];
export const PAYMENT_MODES = ['Cash', 'Bank Transfer', 'PhonePe', 'Cheque'];
export const PAYMENT_TYPES = ['EMI', 'InterestOnly', 'PrincipalOnly', 'Prepayment', 'FullSettlement'];
export const LOAN_PURPOSES = [
  'Raw Material Purchase',
  'Machinery / Equipment',
  'Working Capital',
  'Seasonal Stock',
  'Infrastructure',
  'Other',
];

export const PAYMENT_TYPE_LABELS = {
  EMI: 'EMI',
  InterestOnly: 'Interest Only',
  PrincipalOnly: 'Principal Only',
  Prepayment: 'Prepayment',
  FullSettlement: 'Full Settlement',
};

// ==================== LOANS ====================
export const loanService = {
  getDashboard: () => api.get('/loans/dashboard'),

  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.loanType) params.append('loanType', filters.loanType);
    if (filters.status) params.append('status', filters.status);
    return api.get(`/loans?${params.toString()}`);
  },

  getById: (id) => api.get(`/loans/${id}`),
  create: (data) => api.post('/loans', data),
  update: (id, data) => api.put(`/loans/${id}`, data),
  delete: (id) => api.delete(`/loans/${id}`),
};

// ==================== LOAN PAYMENTS ====================
export const loanPaymentService = {
  getByLoan: (loanId) => api.get(`/loan-payments/loan/${loanId}`),
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.loanId) params.append('loanId', filters.loanId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    return api.get(`/loan-payments?${params.toString()}`);
  },
  create: (data) => api.post('/loan-payments', data),
  delete: (id) => api.delete(`/loan-payments/${id}`),
  getInterestBurden: () => api.get('/loan-payments/interest-burden'),
};

// ==================== CAPITAL INVESTMENTS ====================
export const capitalService = {
  getAll: () => api.get('/capital-investments'),
  getById: (id) => api.get(`/capital-investments/${id}`),
  create: (data) => api.post('/capital-investments', data),
  update: (id, data) => api.put(`/capital-investments/${id}`, data),
  delete: (id) => api.delete(`/capital-investments/${id}`),
};

// ==================== HELPERS ====================
export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

export const calcSimpleInterest = (principal, ratePercent, months) =>
  (principal * ratePercent * months) / (100 * 12);

export const calcMonthlyInterest = (principal, ratePercent) =>
  (principal * ratePercent) / (100 * 12);
