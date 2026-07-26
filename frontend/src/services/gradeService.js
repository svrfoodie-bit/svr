import { get, put } from './apiHelpers';

export const CASHEW_GRADES = ['Full Kaju', 'Split Kaju', '4 Pieces', '8 Pieces', 'Chura'];

export const GRADE_COLORS = {
  'Full Kaju': 'purple',
  'Split Kaju': 'blue',
  '4 Pieces': 'green',
  '8 Pieces': 'orange',
  Chura: 'red',
};

export const gradeService = {
  getAll: (includeInactive = false) => get('/grades', { includeInactive }),
  getById: (id) => get(`/grades/${id}`),
  update: (id, data) => put(`/grades/${id}`, data),
  getStockSummary: () => get('/grades/stock-summary'),
  getSalesSummary: (filters = {}) => get('/grades/sales-summary', filters),
};
