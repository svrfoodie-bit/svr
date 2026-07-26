import api from './api';

const settingsService = {
  get: () => api.get('/settings'),
  save: (section, data) => api.put(`/settings/${section}`, data),
};

export default settingsService;
