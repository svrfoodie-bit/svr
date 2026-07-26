import { useAuthStore } from '../context/authStore';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const authFetch = async (path) => {
  const token = useAuthStore.getState().token;
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Request failed');
  return json;
};

export const auditLogService = {
  // Returns { data: [...], pagination: { total, page, pages, limit } }
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return authFetch(`/audit-logs${q ? `?${q}` : ''}`);
  },

  // Returns { data: { week: {...}, topUsers: [...], recentActivity: [...] } }
  getSummary: () => authFetch('/audit-logs/summary'),
};
