import api from './api';

const getExpandedDateFilters = (filters = {}) => {
  if (filters.startDate || filters.endDate || !filters.timeRange) {
    return filters;
  }

  const now = new Date();
  const start = new Date(now);

  switch (filters.timeRange) {
    case 'DAY':
      break;
    case 'WEEK': {
      const day = start.getDay();
      const diff = day === 0 ? 6 : day - 1;
      start.setDate(start.getDate() - diff);
      break;
    }
    case 'MONTH':
      start.setDate(1);
      break;
    case 'YEAR':
      start.setMonth(0, 1);
      break;
    default:
      return filters;
  }

  return {
    ...filters,
    startDate: start.toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10),
  };
};

export const buildQueryString = (filters = {}) => {
  const params = new URLSearchParams();
  const expandedFilters = getExpandedDateFilters(filters);

  Object.entries(expandedFilters || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  return params.toString();
};

export const unwrapResponse = (payload) => {
  if (payload && typeof payload === 'object' && Object.prototype.hasOwnProperty.call(payload, 'data')) {
    return payload.data;
  }
  return payload;
};

export const get = async (url, filters = {}) => {
  const queryString = buildQueryString(filters);
  const response = await api.get(queryString ? `${url}?${queryString}` : url);
  return unwrapResponse(response);
};

export const post = async (url, data) => {
  const response = await api.post(url, data);
  return unwrapResponse(response);
};

export const put = async (url, data) => {
  const response = await api.put(url, data);
  return unwrapResponse(response);
};

export const del = async (url) => {
  const response = await api.delete(url);
  return unwrapResponse(response);
};
