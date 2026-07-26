import { get, post, put, del } from './apiHelpers';

export const seasonService = {
  getAll: () => get('/seasons'),
  getById: (id) => get(`/seasons/${id}`),
  create: (data) => post('/seasons', data),
  update: (id, data) => put(`/seasons/${id}`, data),
  delete: (id) => del(`/seasons/${id}`),
};

export const SEASON_STATUS = ['Planned', 'Active', 'Completed', 'Cancelled'];
