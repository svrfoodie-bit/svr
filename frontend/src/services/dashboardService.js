import { get } from './apiHelpers';

export const dashboardService = {
  getTodayStats: () => get('/dashboard/today'),
};
