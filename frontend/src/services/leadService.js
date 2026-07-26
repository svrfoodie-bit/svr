import { get, post, put, del } from './apiHelpers';

const HISTORY_KEY = 'svr_lead_import_history';

export const LEAD_STATUSES = ['New', 'Contacted', 'Interested', 'Not Interested', 'Converted'];
export const STATUS_STYLE = {
  New: 'bg-blue-100 text-blue-700 border-blue-200',
  Contacted: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Interested: 'bg-green-100 text-green-700 border-green-200',
  'Not Interested': 'bg-red-100 text-red-700 border-red-200',
  Converted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export const normalisePhone = (raw = '') => {
  let d = String(raw).replace(/\D/g, '');
  if (d.startsWith('0')) d = '91' + d.slice(1);
  if (d.length === 10) d = '91' + d;
  return d;
};

export const isValidPhone = (raw) => normalisePhone(raw).length >= 10;

export const waLink = (phone, message = '') => {
  const p = normalisePhone(phone);
  const text = encodeURIComponent(message);
  return `https://wa.me/${p}${text ? `?text=${text}` : ''}`;
};

// Import history is kept in localStorage (it's UI-only metadata, not business data)
const loadHistory = () => {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
};
const saveHistory = (v) => localStorage.setItem(HISTORY_KEY, JSON.stringify(v));

export const leadService = {
  // ── CRUD ─────────────────────────────────────────────────────────────────
  getAll: () => get('/leads'),
  getById: (id) => get(`/leads/${id}`),
  create: (data) => post('/leads', data),
  update: (id, data) => put(`/leads/${id}`, data),
  updateContact: (id, data) => put(`/leads/${id}`, data),
  updateStatus: (id, status) => put(`/leads/${id}`, { status }),
  delete: (id) => del(`/leads/${id}`),
  deleteMany: (ids) => post('/leads/bulk-delete', { ids }),
  markSent: (ids) => post('/leads/mark-sent', { ids }),
  clearAll: () => del('/leads/clear-all'),

  // ── Templates ─────────────────────────────────────────────────────────────
  getTemplates: () => get('/lead-templates'),
  saveTemplate: (name, message) => post('/lead-templates', { name, content: message }),
  deleteTemplate: (id) => del(`/lead-templates/${id}`),

  // ── Campaigns ─────────────────────────────────────────────────────────────
  getCampaigns: () => get('/lead-campaigns'),
  createCampaign: (name, contactIds, template) => post('/lead-campaigns', { name, contactIds, template }),
  deleteCampaign: (id) => del(`/lead-campaigns/${id}`),
  markCampaignSent: (campaignId, contactId) => put(`/lead-campaigns/${campaignId}/mark-sent`, { contactId }),

  // ── Meta (derived from DB data) ───────────────────────────────────────────
  getMeta: async () => {
    const leads = await leadService.getAll();
    return {
      sources: [...new Set(leads.map((l) => l.source).filter(Boolean))],
      categories: [...new Set(leads.map((l) => l.category).filter(Boolean))],
      locations: [...new Set(leads.map((l) => l.location).filter(Boolean))],
    };
  },

  // ── Analyse before import (check duplicates against DB) ───────────────────
  analyse: async (rows, existingLeads = null) => {
    const existing = existingLeads ?? await leadService.getAll();
    const existingKeys = new Set(
      existing.map((l) => {
        const p = l.normalizedPhone || '';
        return p.length >= 10 ? p : String(l.phone || '').trim();
      }).filter(Boolean)
    );
    let duplicates = 0;
    let valid = 0;
    rows.forEach((r) => {
      const p = normalisePhone(r.phone || '');
      const raw = String(r.phone || '').trim();
      const key = p.length >= 10 ? p : raw;
      if (key && existingKeys.has(key)) duplicates++;
      else valid++;
    });
    return { valid, duplicates, total: rows.length };
  },

  // ── Import rows to DB via bulk-import API ─────────────────────────────────
  import: async (rows, platform, filename) => {
    const leads = rows.map((row) => ({
      name: (row.name || '').trim() || 'Unknown',
      phone: String(row.phone || '').trim(),
      normalizedPhone: normalisePhone(row.phone || ''),
      address: (row.address || '').trim(),
      location: (row.location || '').trim(),
      category: (row.category || '').trim(),
      notes: (row.notes || '').trim(),
      source: platform || 'Other',
      status: 'New',
      waSent: false,
    }));

    const result = await post('/leads/bulk-import', { leads });
    const imported = result.imported ?? result.count ?? leads.length;
    const skipped = result.skipped ?? 0;

    // Save import history to localStorage (UI metadata only)
    const history = loadHistory();
    history.unshift({
      id: `h_${Date.now()}`,
      filename: filename || 'Unknown file',
      platform,
      imported,
      skipped,
      total: rows.length,
      date: new Date().toISOString(),
    });
    saveHistory(history.slice(0, 30));

    return { imported, skipped };
  },

  // ── Import history (localStorage — UI only) ───────────────────────────────
  getHistory: () => Promise.resolve(loadHistory()),
  clearHistory: () => {
    localStorage.removeItem(HISTORY_KEY);
    return Promise.resolve();
  },
};
