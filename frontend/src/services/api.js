import axios from 'axios';
import { useAuthStore } from '../context/authStore';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

const showHandledError = (message) => {
  toast.error(message, { id: `app-error-${message}` });
};

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => {
    // Backend returns { success: true, data: ... } or { success: false, message: ... }
    if (response.data && typeof response.data === 'object' && Object.prototype.hasOwnProperty.call(response.data, 'success')) {
      if (response.data.success) {
        return response.data.data || response.data;
      } else {
        return Promise.reject(new Error(response.data.message || 'An error occurred'));
      }
    }
    // For other response formats, return as-is
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';

    // Handle specific error cases
    if (error.response?.status === 401) {
      // Unauthorized - logout user
      useAuthStore.getState().logout();
      showHandledError('Session expired. Please login again.');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      showHandledError('Access denied. Insufficient permissions.');
    } else if (error.response?.status === 404) {
      showHandledError('Resource not found.');
    } else if (error.response?.status >= 500) {
      showHandledError('Server error. Please try again later.\nIf this keeps happening, refresh the page or restart the backend.');
    } else if (!error.response) {
      showHandledError('Cannot reach server.\nCheck whether the backend is running and reachable.');
    } else {
      showHandledError(message);
    }

    error.__toastHandled = true;

    return Promise.reject(error);
  }
);

export default api;
