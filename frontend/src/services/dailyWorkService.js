import { get, post, put, del } from './apiHelpers';

export const WORK_TYPES = {
  Roasting: { bonusEligible: true, defaultRate: 15 },
  Steaming: { bonusEligible: true, defaultRate: 12 },
  Shelling: { bonusEligible: true, defaultRate: 20 },
  Peeling: { bonusEligible: true, defaultRate: 18 },
  Grading: { bonusEligible: true, defaultRate: 16 },
  Flavoring: { bonusEligible: false, defaultRate: 10 },
  Packing: { bonusEligible: false, defaultRate: 10 },
  Cleaning: { bonusEligible: false, defaultRate: 8 },
  Drying: { bonusEligible: false, defaultRate: 8 },
};

const BONUS_THRESHOLD = 50;
const BONUS_RATE = 2;

const calculateBonus = (workType, quantity) => {
  const workTypeInfo = WORK_TYPES[workType];
  if (!workTypeInfo || !workTypeInfo.bonusEligible) return 0;
  if (quantity > BONUS_THRESHOLD) return (quantity - BONUS_THRESHOLD) * BONUS_RATE;
  return 0;
};

export const dailyWorkService = {
  getAll: (filters = {}) => get('/daily-work', filters),
  getById: (id) => get(`/daily-work/${id}`),
  create: (workData) => post('/daily-work', workData),
  update: (id, workData) => put(`/daily-work/${id}`, workData),
  delete: (id) => del(`/daily-work/${id}`),
  getSummaryMetrics: (filters = {}) => get('/daily-work/summary/metrics', filters),
  getMonthlySummary: (year, month) => get('/daily-work/monthly-summary', { year, month }),
  getWorkTypes: () => get('/daily-work/types/list'),
  getWorkTypeInfo: (workType) => WORK_TYPES[workType] || null,
  calculateBonus,
};
