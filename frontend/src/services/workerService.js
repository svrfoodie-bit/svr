import { get, post, put, del } from './apiHelpers';

export const workerService = {
  getAll: (filters = {}) => {
    const apiFilters = {
      search: filters.search,
      areaOfWork: filters.type || undefined,
      status:
        filters.isActive === true ? 'Active' :
        filters.isActive === false ? 'Inactive' :
        undefined,
    };
    return get('/workers', apiFilters);
  },
  getActive: () => get('/workers/active'),
  getById: (id) => get(`/workers/${id}`),
  create: (workerData) => post('/workers', workerData),
  update: (id, workerData) => put(`/workers/${id}`, workerData),
  delete: (id) => del(`/workers/${id}`),
  toggleStatus: async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    return put(`/workers/${id}`, { status: newStatus });
  },
};
