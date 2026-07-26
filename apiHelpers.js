import api from './api';

export const buildQueryString = (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters || {}).forEach(([key, value]) => {
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
