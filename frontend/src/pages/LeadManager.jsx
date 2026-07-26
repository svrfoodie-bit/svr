import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Upload, Users, MessageCircle, Search, Trash2, CheckSquare, Square,
  Send, ExternalLink, X, FileSpreadsheet, AlertTriangle, CheckCircle,
  MapPin, RefreshCw, Download, Phone, Edit2, Save, BarChart3,
  Clock, FileText, Bookmark, Plus, ChevronDown, TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  leadService, waLink, normalisePhone,
  LEAD_STATUSES, STATUS_STYLE,
} from '../services/leadService';
import useDebounce from '../hooks/useDebounce';
import { useCompanyStore } from '../context/companyStore';

// ── Constants ─────────────────────────────────────────────────────────────────
const PLATFORMS = ['Google Forms', 'Facebook', 'Instagram', 'WhatsApp', 'Manual', 'Other'];

const AUTO_DETECT = {
  name:     /name|naam|customer|client|contact name/i,
  phone:    /phone|mobile|cell|contact|number|ph\b|whatsapp/i,
  address:  /address|addr|street|house/i,
  location: /^location$|city|area|district|place|town|state/i,
  category: /category|categor|type|product|interest|service|segment/i,
  notes:    /note|remark|comment|message|feedback|desc|social|link/i,
};

const FIELD_LABELS = {
  name: 'Name', phone: 'Phone Number', address: 'Address',
  location: 'Location / City', category: 'Category', notes: 'Notes / Social Links',
};

const CHART_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6', '#EC4899'];
const defaultLeadTemplate = (companyName) =>
  `Hello {{name}}, this is ${companyName}. We have exciting offers for you! Please reply to know more.`;

// ── Helpers ───────────────────────────────────────────────────────────────────
const autoMap = (headers) => {
  const mapping = { name: '', phone: '', address: '', location: '', category: '', notes: '' };
  headers.forEach((h) => {
    Object.keys(AUTO_DETECT).forEach((field) => {
      if (!mapping[field] && AUTO_DETECT[field].test(h)) mapping[field] = h;
    });
  });
  return mapping;
};

const applyMapping = (rows, mapping) =>
  rows.map((row) => ({
    name:     String(row[mapping.name]     || ''),
    phone:    String(row[mapping.phone]    || ''),
    address:  String(row[mapping.address]  || ''),
    location: String(row[mapping.location] || ''),
    category: String(row[mapping.category] || ''),
    notes:    String(row[mapping.notes]    || ''),
  }));

const statusBadge = (status) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLE[status] || STATUS_STYLE['New']}`}>
    {status || 'New'}
  </span>
);

const platformColor = (p) =>
  ({ 'Google Forms': 'bg-blue-100 text-blue-700', Facebook: 'bg-blue-100 text-blue-700',
     Instagram: 'bg-purple-100 text-purple-700', WhatsApp: 'bg-green-100 text-green-700' }[p]
    || 'bg-gray-100 text-gray-600');

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

// ── Pagination ────────────────────────────────────────────────────────────────
const Pagination = ({ page, totalPages, onPage }) => {
  if (totalPages <= 1) return null;
  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }
  const btn = 'w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all';
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onPage(page - 1)} disabled={page === 1}
        className={`${btn} ${page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}>‹</button>
      {pages.map((p, i) =>
        p === '…'
          ? <span key={`e${i}`} className="w-8 text-center text-gray-400 text-sm">…</span>
          : <button key={p} onClick={() => onPage(p)}
              className={`${btn} ${p === page ? 'bg-primary-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>{p}</button>
      )}
      <button onClick={() => onPage(page + 1)} disabled={page === totalPages}
        className={`${btn} ${page === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}>›</button>
    </div>
  );
};

// ── Edit Modal ────────────────────────────────────────────────────────────────
const EditModal = ({ contact, onSave, onClose }) => {
  const [form, setForm] = useState({ ...contact });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    await leadService.updateContact(contact.id, form);
    onSave();
    toast.success('Contact updated');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">Edit Contact</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Name', key: 'name', full: true },
            { label: 'Phone', key: 'phone' },
            { label: 'Category', key: 'category' },
            { label: 'Location / City', key: 'location' },
            { label: 'Address', key: 'address', full: true },
            { label: 'Social / Notes', key: 'notes', full: true },
          ].map(({ label, key, full }) => (
            <div key={key} className={full ? 'col-span-2' : ''}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input value={form[key] || ''} onChange={(e) => set(key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400" />
            </div>
          ))}

          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select value={form.status || 'New'} onChange={(e) => set('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500/30">
              {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold text-sm hover:from-primary-700 hover:to-primary-800 transition-all shadow">
            <Save className="w-4 h-4" /> Save Changes
          </button>
          <button onClick={onClose}
            className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-all">
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MANUAL ENTRY FORM
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_FORM = { name: '', phone: '', address: '', location: '', category: '', notes: '', source: 'Manual' };

const ManualEntryForm = ({ onSaved }) => {
  const [form, setForm]       = useState(EMPTY_FORM);
  const [saving, setSaving]   = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (andNew = false) => {
    if (!form.name.trim() && !form.phone.trim()) {
      toast.error('Enter at least a name or phone number'); return;
    }
    setSaving(true);
    const { imported, skipped } = await leadService.import([form], form.source, 'Manual Entry');
    setSaving(false);
    if (skipped > 0) { toast.error('This phone number already exists'); return; }
    toast.success('Contact added');
    if (andNew) setForm(EMPTY_FORM);
    else onSaved();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5">
      <h3 className="font-semibold text-gray-800 mb-4">Add Contact Manually</h3>

      {/* Source */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-2">Source Platform</label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <button key={p} onClick={() => set('source', p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                form.source === p ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'
              }`}>{p}</button>
          ))}
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {[
          { label: 'Name',              key: 'name',     placeholder: 'Full name',           full: false },
          { label: 'Phone Number',      key: 'phone',    placeholder: '9876543210',          full: false },
          { label: 'Category',          key: 'category', placeholder: 'e.g. Caterer, Hotel', full: false },
          { label: 'Location / City',   key: 'location', placeholder: 'e.g. Hyderabad',     full: false },
          { label: 'Address',           key: 'address',  placeholder: 'Full address',        full: true  },
          { label: 'Notes / Social Links', key: 'notes', placeholder: 'Website, Instagram URL, or notes…', full: true },
        ].map(({ label, key, placeholder, full }) => (
          <div key={key} className={full ? 'sm:col-span-2' : ''}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <input
              value={form[key]}
              onChange={(e) => set(key, e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all"
            />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => handleSave(false)} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold text-sm hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 shadow">
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Contact
        </button>
        <button onClick={() => handleSave(true)} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all disabled:opacity-50">
          <Plus className="w-4 h-4" />
          Save &amp; Add Another
        </button>
        <button onClick={() => setForm(EMPTY_FORM)}
          className="px-4 py-2.5 text-gray-400 hover:text-gray-600 text-sm transition-colors">
          Clear
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1 — IMPORT
// ─────────────────────────────────────────────────────────────────────────────
const ImportTab = ({ onImported, existingContacts = [] }) => {
  const [mode, setMode]       = useState('file');   // 'file' | 'manual'
  const [file, setFile] = useState(null);
  const [platform, setPlatform] = useState('Google Forms');
  const [headers, setHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [preview, setPreview] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [importing, setImporting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [history, setHistory] = useState([]);
  const fileRef = useRef();

  useEffect(() => { leadService.getHistory().then(setHistory); }, []);

  const parseFile = async (f) => {
    try {
      const buf = await f.arrayBuffer();
      const wb  = XLSX.read(buf, { type: 'array' });
      const ws  = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (!rows.length) { toast.error('File is empty'); return; }
      const hdrs = Object.keys(rows[0]);
      const mp   = autoMap(hdrs);
      setHeaders(hdrs); setRawRows(rows); setMapping(mp); setFile(f);
      toast.success(`Detected ${rows.length} rows from "${f.name}"`);
    } catch { toast.error('Could not read file — make sure it is .xlsx or .csv'); }
  };

  // Recompute preview + analysis when mapping changes
  useEffect(() => {
    if (!rawRows.length) { setPreview([]); setAnalysis(null); return; }
    const mapped = applyMapping(rawRows, mapping);
    setPreview(mapped.slice(0, 8));
    leadService.analyse(mapped, existingContacts.length ? existingContacts : null).then(setAnalysis);
  }, [mapping, rawRows]);

  const handleImport = async () => {
    if (!mapping.phone) { toast.error('Map the Phone Number column first'); return; }
    setImporting(true);
    const mapped = applyMapping(rawRows, mapping);
    const { imported, skipped } = await leadService.import(mapped, platform, file.name);
    setImporting(false);
    toast.success(`Imported ${imported}${skipped ? `, skipped ${skipped} duplicates` : ''}`);
    setFile(null); setRawRows([]); setHeaders([]); setMapping({}); setPreview([]); setAnalysis(null);
    leadService.getHistory().then(setHistory);
    onImported();
  };

  const reset = () => { setFile(null); setRawRows([]); setHeaders([]); setMapping({}); setPreview([]); setAnalysis(null); };

  return (
    <div className="space-y-5">

      {/* Mode toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { id: 'file',   label: 'Upload File',    icon: FileSpreadsheet },
          { id: 'manual', label: 'Manual Entry',   icon: Plus },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setMode(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              mode === id ? 'bg-white text-primary-700 shadow' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* Manual entry form */}
      {mode === 'manual' && (
        <ManualEntryForm onSaved={() => { onImported(); }} />
      )}

      {/* File upload mode */}
      {mode === 'file' && <>

      {/* Platform */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Source Platform</h3>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <button key={p} onClick={() => setPlatform(p)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                platform === p ? 'bg-primary-600 text-white border-primary-600 shadow' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'
              }`}>{p}</button>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      {!file && (
        <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); e.dataTransfer.files[0] && parseFile(e.dataTransfer.files[0]); }}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
            dragging ? 'border-primary-400 bg-primary-50' : 'border-gray-200 bg-gray-50 hover:border-primary-300 hover:bg-primary-50/40'
          }`}>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
            onChange={(e) => e.target.files[0] && parseFile(e.target.files[0])} />
          <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Drop your Excel / CSV file here</p>
          <p className="text-gray-400 text-sm mt-1">or click to browse — supports .xlsx, .xls, .csv</p>
        </div>
      )}

      {/* Analysis banner — duplicates only */}
      {analysis && analysis.duplicates > 0 && (
        <div className="rounded-xl p-4 flex flex-wrap gap-4 border bg-amber-50 border-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <span className="text-sm text-amber-700 font-medium">
            ⊘ {analysis.duplicates} duplicate phone numbers will be skipped
          </span>
        </div>
      )}

      {/* Column mapping */}
      {file && headers.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-800">Map Columns</h3>
              <p className="text-xs text-gray-500 mt-0.5">File: <strong>{file.name}</strong> · {rawRows.length} rows</p>
            </div>
            <button onClick={reset} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.keys(FIELD_LABELS).map((field) => (
              <div key={field}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {FIELD_LABELS[field]}{field === 'phone' && <span className="text-red-500 ml-1">*</span>}
                </label>
                <select value={mapping[field] || ''} onChange={(e) => setMapping((m) => ({ ...m, [field]: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 bg-gray-50">
                  <option value="">— skip —</option>
                  {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview table */}
      {preview.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Preview (first 8 rows)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {Object.values(FIELD_LABELS).map((l) => (
                    <th key={l} className="text-left py-2 px-3 text-gray-500 font-medium text-xs whitespace-nowrap">{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium text-gray-800">{row.name || <span className="text-gray-400">—</span>}</td>
                    <td className="py-2 px-3">
                      <span className="font-mono text-xs text-gray-700">{row.phone || <span className="text-gray-400">—</span>}</span>
                    </td>
                    <td className="py-2 px-3 text-gray-600 max-w-[140px] truncate">{row.address || '—'}</td>
                    <td className="py-2 px-3 text-gray-600">{row.location || '—'}</td>
                    <td className="py-2 px-3 text-gray-600">{row.category || '—'}</td>
                    <td className="py-2 px-3 text-gray-500 max-w-[120px] truncate">{row.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <button onClick={handleImport} disabled={importing || !mapping.phone}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow">
              {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Import {analysis?.valid ?? rawRows.length} Contacts
            </button>
            {!mapping.phone && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Map the Phone Number column first</p>}
          </div>
        </div>
      )}

      </>}

      {/* Import History — always visible */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <h3 className="font-semibold text-gray-800">Import History</h3>
            </div>
            <button onClick={async () => { await leadService.clearHistory(); setHistory([]); toast.success('History cleared'); }}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors">Clear</button>
          </div>
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-sm">
                <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-700 truncate">{h.filename}</p>
                  <p className="text-xs text-gray-400">{fmtDate(h.date)} · {h.platform}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-green-600 font-semibold">+{h.imported}</p>
                  {h.skipped > 0 && <p className="text-xs text-gray-400">skipped {h.skipped}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2 — CONTACTS
// ─────────────────────────────────────────────────────────────────────────────
const ContactsTab = ({ contacts, meta, loading, onReload, onSendSelected, selectedIds, setSelectedIds }) => {
  const [search, setSearch]               = useState('');
  const debouncedSearch                   = useDebounce(search, 300);
  const [filterSource, setFilterSource]   = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus]   = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterWaSent, setFilterWaSent]   = useState('');
  const [sortKey, setSortKey]             = useState('importedAt');
  const [sortDir, setSortDir]             = useState('desc');
  const [page, setPage]                   = useState(1);
  const [pageSize, setPageSize]           = useState(20);
  const [editContact, setEditContact]     = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filtered = useMemo(() => {
    let list = contacts;
    if (debouncedSearch) list = list.filter((c) =>
      c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (c.phone || '').includes(debouncedSearch) || (c.normalizedPhone || c._phone || '').includes(debouncedSearch)
    );
    if (filterSource)   list = list.filter((c) => c.source === filterSource);
    if (filterCategory) list = list.filter((c) => (c.category || '').trim().toLowerCase() === filterCategory.trim().toLowerCase());
    if (filterStatus)   list = list.filter((c) => (c.status || 'New') === filterStatus);
    if (filterLocation) list = list.filter((c) => (c.location || '').trim().toLowerCase() === filterLocation.trim().toLowerCase());
    if (filterWaSent === 'yes') list = list.filter((c) => c.waSent);
    if (filterWaSent === 'no')  list = list.filter((c) => !c.waSent);
    list = [...list].sort((a, b) => {
      let av = a[sortKey] || '', bv = b[sortKey] || '';
      if (sortKey === 'status') { av = a.status || 'New'; bv = b.status || 'New'; }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [contacts, debouncedSearch, filterSource, filterCategory, filterStatus, filterLocation, filterWaSent, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  useEffect(() => setPage(1), [debouncedSearch, filterSource, filterCategory, filterStatus, filterLocation, filterWaSent, pageSize]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);
  const start      = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const end        = Math.min(page * pageSize, filtered.length);

  const allSelected = filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));
  const toggleAll   = () => {
    if (allSelected) setSelectedIds((p) => { const n = new Set(p); filtered.forEach((c) => n.delete(c.id)); return n; });
    else             setSelectedIds((p) => { const n = new Set(p); filtered.forEach((c) => n.add(c.id));    return n; });
  };
  const toggle = (id) => setSelectedIds((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const deleteSelected = async () => {
    if (!selectedIds.size) return;
    if (!confirm(`Delete ${selectedIds.size} contacts?`)) return;
    await leadService.deleteMany([...selectedIds]);
    setSelectedIds(new Set()); toast.success('Deleted'); onReload();
  };

  const batchSetStatus = async (status) => {
    await Promise.all([...selectedIds].map((id) => leadService.updateStatus(id, status)));
    toast.success(`${selectedIds.size} contacts marked as ${status}`);
    onReload();
  };

  const changeStatus = async (id, status) => {
    await leadService.updateStatus(id, status); onReload();
  };

  const exportContacts = () => {
    const rows = filtered.map((c) => ({
      Name: c.name, Phone: c.phone, Address: c.address,
      Location: c.location, Category: c.category, Source: c.source,
      Status: c.status || 'New', 'Social / Notes': c.notes,
      'WA Sent': c.waSent ? 'Yes' : 'No',
      'Imported On': fmtDate(c.importedAt),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contacts');
    XLSX.writeFile(wb, `leads_${Date.now()}.xlsx`);
    toast.success(`Exported ${rows.length} contacts`);
  };

  if (loading) return <div className="flex items-center justify-center py-24"><RefreshCw className="w-8 h-8 text-primary-400 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: contacts.length, color: 'text-primary-700 bg-primary-50 border-primary-100', status: '' },
          ...LEAD_STATUSES.map((s) => ({
            label: s, status: s,
            value: contacts.filter((c) => (c.status || 'New') === s).length,
            color: STATUS_STYLE[s] + ' bg-opacity-30',
          })),
        ].map(({ label, value, color, status }) => (
          <button key={label} onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
            className={`rounded-xl border p-3 text-left transition-all ${color} ${filterStatus === status ? 'ring-2 ring-primary-400 ring-offset-1' : 'hover:opacity-80'}`}>
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs font-medium opacity-70 mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Filters + Export */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[180px] px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 focus-within:ring-2 focus-within:ring-primary-500/30">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or phone…"
              className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400" />
            {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-gray-400" /></button>}
          </div>
          {[
            { label: 'Source',   placeholder: 'All Sources',   value: filterSource,   set: setFilterSource,   opts: meta.sources },
            { label: 'Category', placeholder: 'All Categories', value: filterCategory, set: setFilterCategory, opts: meta.categories },
            { label: 'Status',   placeholder: 'All Statuses',   value: filterStatus,   set: setFilterStatus,   opts: LEAD_STATUSES },
            { label: 'Location', placeholder: 'All Locations',  value: filterLocation, set: setFilterLocation, opts: meta.locations },
          ].map(({ label, placeholder, value, set, opts }) => (
            <select key={label} value={value} onChange={(e) => set(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-gray-600">
              <option value="">{placeholder}</option>
              {opts.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
          <select value={filterWaSent} onChange={(e) => setFilterWaSent(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-gray-600">
            <option value="">All WA</option>
            <option value="yes">WA Sent</option>
            <option value="no">Not Sent</option>
          </select>
          <button onClick={exportContacts}
            className="flex items-center gap-1.5 px-3 py-2 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-medium hover:bg-green-100 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>{contacts.length === 0 ? 'No contacts yet — import a file first.' : 'No results match your filters.'}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4 w-10">
                      <button onClick={toggleAll} className="text-gray-500 hover:text-primary-600">
                        {allSelected ? <CheckSquare className="w-4 h-4 text-primary-600" /> : <Square className="w-4 h-4" />}
                      </button>
                    </th>
                    {[
                      { label: 'Name',           key: 'name' },
                      { label: 'Phone',          key: null },
                      { label: 'Address',        key: null },
                      { label: 'Category',       key: 'category' },
                      { label: 'Social / Notes', key: null },
                      { label: 'Status',         key: 'status' },
                      { label: 'Imported',       key: 'importedAt' },
                      { label: 'Actions',        key: null },
                    ].map(({ label, key }) => (
                      <th key={label} className="py-3 px-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {key ? (
                          <button onClick={() => toggleSort(key)} className="flex items-center gap-1 hover:text-primary-600 transition-colors">
                            {label}
                            <span className="text-gray-300">{sortKey === key ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
                          </button>
                        ) : label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((c) => (
                    <tr key={c.id} className={`border-b border-gray-50 hover:bg-gray-50/80 transition-colors ${selectedIds.has(c.id) ? 'bg-primary-50/40' : ''}`}>
                      <td className="py-3 px-4">
                        <button onClick={() => toggle(c.id)} className="text-gray-400 hover:text-primary-600">
                          {selectedIds.has(c.id) ? <CheckSquare className="w-4 h-4 text-primary-600" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      {/* Name + map link */}
                      <td className="py-3 px-3">
                        <p className="font-medium text-gray-800">{c.name}</p>
                        {c.location && (
                          c.location.startsWith('http')
                            ? <a href={c.location} target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline mt-0.5">
                                <MapPin className="w-3 h-3" />View on Map</a>
                            : <p className="text-xs text-gray-400 mt-0.5">{c.location}</p>
                        )}
                      </td>
                      {/* Phone + call */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-gray-700">{c.phone}</span>
                          <a href={`tel:+${c._phone}`}
                            className="p-1 text-green-500 hover:bg-green-50 rounded-lg transition-colors" title="Call">
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                      {/* Address */}
                      <td className="py-3 px-3">
                        {c.address
                          ? <span className="text-xs text-gray-600 max-w-[160px] block truncate" title={c.address}>{c.address}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      {/* Category */}
                      <td className="py-3 px-3">
                        {c.category
                          ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">{c.category}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      {/* Social / Notes */}
                      <td className="py-3 px-3">
                        {c.notes
                          ? c.notes.startsWith('http')
                            ? <a href={c.notes} target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline">
                                <ExternalLink className="w-3 h-3 shrink-0" />
                                {c.notes.includes('instagram') ? 'Instagram' : c.notes.includes('facebook') ? 'Facebook' : 'View Link'}
                              </a>
                            : <span className="text-xs text-gray-500 max-w-[120px] block truncate" title={c.notes}>{c.notes}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      {/* Status dropdown */}
                      <td className="py-3 px-3">
                        <select value={c.status || 'New'} onChange={(e) => changeStatus(c.id, e.target.value)}
                          className={`text-xs font-medium border rounded-full px-2 py-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-400 ${STATUS_STYLE[c.status || 'New']}`}>
                          {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      {/* Imported date */}
                      <td className="py-3 px-3">
                        <span className="text-xs text-gray-400 whitespace-nowrap">{fmtDate(c.importedAt)}</span>
                      </td>
                      {/* Actions */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditContact(c)}
                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Edit">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <a href={waLink(c.normalizedPhone || c._phone || c.phone)} target="_blank" rel="noreferrer"
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="WhatsApp">
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{filtered.length === 0 ? '0' : `${start}–${end} of ${filtered.length}`} contacts</span>
                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-gray-50 text-gray-600 focus:outline-none">
                  {[10, 20, 50, 100].map((n) => <option key={n} value={n}>Show {n}</option>)}
                </select>
              </div>
              <Pagination page={page} totalPages={totalPages} onPage={setPage} />
              <button onClick={() => setShowClearConfirm(true)} className="text-xs text-red-400 hover:text-red-600 transition-colors">
                Clear all & re-import
              </button>
              {showClearConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/40" onClick={() => setShowClearConfirm(false)} />
                  <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm z-10">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Clear All Contacts?</h3>
                    <p className="text-sm text-gray-600 mb-4">This will permanently delete all contacts. This action cannot be undone.</p>
                    <div className="flex gap-3">
                      <button onClick={async () => { await leadService.clearAll(); onReload(); toast.success('All contacts cleared'); setShowClearConfirm(false); }} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors">Clear All</button>
                      <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors">Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Floating action bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex-wrap justify-center">
            <span className="font-semibold text-sm">{selectedIds.size} selected</span>
            <div className="w-px h-5 bg-gray-600" />
            <button onClick={onSendSelected}
              className="flex items-center gap-2 px-4 py-1.5 bg-green-500 hover:bg-green-400 rounded-xl text-sm font-semibold">
              <MessageCircle className="w-4 h-4" />WhatsApp
            </button>
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-4 py-1.5 bg-primary-600 hover:bg-primary-500 rounded-xl text-sm font-semibold">
                <CheckSquare className="w-4 h-4" />Status <ChevronDown className="w-3 h-3" />
              </button>
              <div className="absolute bottom-full mb-2 left-0 bg-white rounded-xl shadow-xl border border-gray-100 py-1 hidden group-hover:block min-w-[160px]">
                {LEAD_STATUSES.map((s) => (
                  <button key={s} onClick={() => batchSetStatus(s)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${STATUS_STYLE[s].split(' ')[0]}`} />
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={deleteSelected}
              className="flex items-center gap-2 px-4 py-1.5 bg-red-500/80 hover:bg-red-500 rounded-xl text-sm font-semibold">
              <Trash2 className="w-4 h-4" />Delete
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="p-1.5 hover:bg-gray-700 rounded-lg">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {editContact && (
          <EditModal contact={editContact} onClose={() => setEditContact(null)}
            onSave={() => { setEditContact(null); onReload(); }} />
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB 3 — WHATSAPP
// ─────────────────────────────────────────────────────────────────────────────

// ── Campaign Detail View ──────────────────────────────────────────────────────
const CampaignDetail = ({ campaign, contacts, onBack, onDeleted }) => {
  const [sentIds, setSentIds] = useState(new Set((campaign.sentIds || []).map(String)));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const members  = useMemo(() => contacts.filter((c) => (campaign.contactIds || []).map(String).includes(String(c.id))), [contacts, campaign]);
  const pending  = members.filter((c) => !sentIds.has(String(c.id)));
  const sent     = members.filter((c) => sentIds.has(String(c.id)));
  const allDone  = pending.length === 0;
  const pct      = members.length ? Math.round((sentIds.size / members.length) * 100) : 0;

  const resolve  = (c) => (campaign.template || '').replace(/\{\{name\}\}/g, c.name || 'there');

  const openChat = async (c) => {
    const phone = c.normalizedPhone || c._phone || c.phone || '';
    window.open(waLink(phone, resolve(c)), '_blank');
    const next = new Set([...sentIds, String(c.id)]);
    setSentIds(next);
    await leadService.markCampaignSent(campaign.id, c.id);
    await leadService.markSent([c.id]);
    await leadService.updateStatus(c.id, 'Contacted');
  };

  const deleteCampaign = () => setShowDeleteConfirm(true);

  const confirmDeleteCampaign = async () => {
    await leadService.deleteCampaign(campaign.id);
    toast.success('Group deleted');
    setShowDeleteConfirm(false);
    onDeleted();
  };

  return (
    <div className="space-y-4">
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm z-10">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Group?</h3>
            <p className="text-sm text-gray-600 mb-4">Delete group "{campaign.name}"? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={confirmDeleteCampaign} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors">Delete</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
          <ChevronDown className="w-5 h-5 rotate-90" />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-800 text-lg truncate">{campaign.name}</h3>
          <p className="text-xs text-gray-400">{members.length} contacts · Created {fmtDate(campaign.createdAt)}</p>
        </div>
        <button onClick={deleteCampaign}
          className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100">
          <Trash2 className="w-4 h-4" /> Delete Group
        </button>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-gray-700">{sentIds.size} of {members.length} sent</span>
          <span className={`font-bold ${allDone ? 'text-green-600' : 'text-orange-500'}`}>{pct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div className="h-3 rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: allDone ? '#10b981' : '#f59e0b' }} />
        </div>
        {allDone && (
          <p className="text-center text-green-600 font-semibold text-sm pt-1">All messages sent!</p>
        )}
      </div>

      {/* Message preview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4">
        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Message</p>
        <div className="bg-[#e5ddd5] rounded-xl p-3">
          <div className="bg-white rounded-xl rounded-tl-none p-3 max-w-xs shadow-sm">
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{campaign.template}</p>
          </div>
        </div>
      </div>

      {/* Pending contacts */}
      {pending.length > 0 && (
        <div className="bg-white rounded-2xl border border-orange-100 shadow-soft overflow-hidden">
          <div className="px-5 py-3 bg-orange-50 border-b border-orange-100 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
            <h4 className="font-semibold text-orange-800 text-sm">Not Sent ({pending.length})</h4>
          </div>
          <div className="divide-y divide-gray-50">
            {pending.map((c) => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-3 hover:bg-orange-50/30 transition-colors">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
                  {c.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm">{c.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{c.phone}</p>
                </div>
                {c.category && <span className="text-xs text-gray-400 hidden sm:block">{c.category}</span>}
                <button onClick={() => openChat(c)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors">
                  <ExternalLink className="w-3 h-3" /> Open
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent contacts */}
      {sent.length > 0 && (
        <div className="bg-white rounded-2xl border border-green-100 shadow-soft overflow-hidden">
          <div className="px-5 py-3 bg-green-50 border-b border-green-100 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <h4 className="font-semibold text-green-800 text-sm">Sent ({sent.length})</h4>
          </div>
          <div className="divide-y divide-gray-50">
            {sent.map((c) => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-3 bg-green-50/20">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm shrink-0">
                  {c.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-700 text-sm">{c.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{c.phone}</p>
                </div>
                {c.category && <span className="text-xs text-gray-400 hidden sm:block">{c.category}</span>}
                <span className="flex items-center gap-1 text-xs text-green-600 font-semibold shrink-0">
                  <CheckCircle className="w-4 h-4" /> Sent
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── WhatsApp Tab ──────────────────────────────────────────────────────────────
const WhatsAppTab = ({ contacts, selectedIds, setSelectedIds, onReload }) => {
  const companyName = useCompanyStore((state) => state.companyInfo.companyName);
  const [template, setTemplate]         = useState(defaultLeadTemplate(companyName));
  const [templates, setTemplates]       = useState([]);
  const [tplName, setTplName]           = useState('');
  const [showSaveTpl, setShowSaveTpl]   = useState(false);
  const [campaigns, setCampaigns]       = useState([]);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [groupName, setGroupName]       = useState('');
  const [showCreate, setShowCreate]     = useState(false);

  const loadCampaigns = () => leadService.getCampaigns().then(setCampaigns);

  useEffect(() => {
    leadService.getTemplates().then(setTemplates);
    loadCampaigns();
  }, []);

  useEffect(() => {
    setTemplate((current) =>
      current === defaultLeadTemplate('SVR Cashew') || current === defaultLeadTemplate('SVR Food Production')
        ? defaultLeadTemplate(companyName)
        : current
    );
  }, [companyName]);

  const selected = useMemo(() => contacts.filter((c) => selectedIds.has(c.id)), [contacts, selectedIds]);

  const createGroup = async () => {
    if (!groupName.trim()) { toast.error('Enter a group name'); return; }
    if (selected.length === 0) { toast.error('Select contacts first from the Contacts tab'); return; }
    await leadService.createCampaign(groupName.trim(), selected.map((c) => c.id), template);
    await loadCampaigns();
    setGroupName(''); setShowCreate(false);
    toast.success(`Group "${groupName.trim()}" created with ${selected.length} contacts`);
  };

  const saveTemplate = async () => {
    if (!tplName.trim()) { toast.error('Enter a template name'); return; }
    await leadService.saveTemplate(tplName.trim(), template);
    setTemplates(await leadService.getTemplates());
    setTplName(''); setShowSaveTpl(false);
    toast.success('Template saved');
  };

  const deleteTemplate = async (id) => {
    await leadService.deleteTemplate(id);
    setTemplates(await leadService.getTemplates());
  };

  // ── Campaign detail view ──────────────────────────────────────────────────
  if (activeCampaign) {
    const fresh = campaigns.find((c) => c.id === activeCampaign.id) || activeCampaign;
    return (
      <CampaignDetail
        campaign={fresh}
        contacts={contacts}
        onBack={() => setActiveCampaign(null)}
        onDeleted={() => { loadCampaigns(); setActiveCampaign(null); onReload(); }}
      />
    );
  }

  return (
    <div className="space-y-5">

      {/* Create group panel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">Create Send Group</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {selected.length > 0 ? `${selected.length} contacts selected` : 'Select contacts in the Contacts tab first'}
            </p>
          </div>
          <button onClick={() => setShowCreate((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> New Group
          </button>
        </div>

        {showCreate && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <input value={groupName} onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name e.g. Cashew Wholesalers - April"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400" />
            <div className="flex gap-2">
              <button onClick={createGroup}
                disabled={selected.length === 0}
                className="flex-1 px-4 py-2.5 bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors">
                Create with {selected.length} Contact{selected.length !== 1 ? 's' : ''}
              </button>
              <button onClick={() => setShowCreate(false)}
                className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Template + saved templates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Message Template</h3>
            <button onClick={() => setShowSaveTpl((v) => !v)}
              className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium">
              <Bookmark className="w-3.5 h-3.5" /> Save
            </button>
          </div>
          <p className="text-xs text-gray-400">Use <code className="bg-gray-100 px-1 rounded">{'{{name}}'}</code> to personalise</p>
          <textarea value={template} onChange={(e) => setTemplate(e.target.value)} rows={5}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 resize-none" />
          <p className={`text-xs text-right ${template.length > 1024 ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
            {template.length} / 1024 chars
          </p>
          {showSaveTpl && (
            <div className="flex gap-2">
              <input value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="Template name…"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
              <button onClick={saveTemplate}
                className="px-3 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700">Save</button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4">
          <h3 className="font-semibold text-gray-800 text-sm mb-3">Saved Templates</h3>
          {templates.length === 0
            ? <p className="text-xs text-gray-400 py-4 text-center">No saved templates yet</p>
            : <div className="space-y-2">
                {templates.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                    <button onClick={() => setTemplate(t.message)} className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-700">{t.name}</p>
                      <p className="text-xs text-gray-400 truncate">{t.message.slice(0, 60)}…</p>
                    </button>
                    <button onClick={() => deleteTemplate(t.id)} className="p-1 text-gray-400 hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>

      {/* Saved groups list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-sm">Send Groups ({campaigns.length})</h3>
        </div>
        {campaigns.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No groups yet — create one above</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {campaigns.map((cmp) => {
              const total   = (cmp.contactIds || []).length;
              const sentCnt = (cmp.sentIds || []).length;
              const pct     = total ? Math.round((sentCnt / total) * 100) : 0;
              const done    = sentCnt === total;
              return (
                <button key={cmp.id} onClick={() => setActiveCampaign(cmp)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left">
                  {/* Status dot */}
                  <div className={`w-3 h-3 rounded-full shrink-0 ${done ? 'bg-green-400' : sentCnt > 0 ? 'bg-orange-400' : 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{cmp.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-[120px]">
                        <div className="h-1.5 rounded-full transition-all"
                          style={{ width: `${pct}%`, background: done ? '#10b981' : '#f59e0b' }} />
                      </div>
                      <span className="text-xs text-gray-400">{sentCnt}/{total} sent</span>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${done ? 'bg-green-100 text-green-700' : sentCnt > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                    {done ? 'Done' : sentCnt > 0 ? 'In Progress' : 'Pending'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB 4 — ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────
const AnalyticsTab = ({ contacts }) => {
  const byStatus = useMemo(() =>
    LEAD_STATUSES.map((s) => ({
      name: s, value: contacts.filter((c) => (c.status || 'New') === s).length,
    })).filter((d) => d.value > 0),
  [contacts]);

  const byCategory = useMemo(() => {
    const map = {};
    contacts.forEach((c) => { const k = c.category || 'Uncategorized'; map[k] = (map[k] || 0) + 1; });
    return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 10).map(([name, value]) => ({ name, value }));
  }, [contacts]);

  const bySource = useMemo(() => {
    const map = {};
    contacts.forEach((c) => { const k = c.source || 'Other'; map[k] = (map[k] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [contacts]);

  const waPercent = contacts.length ? Math.round((contacts.filter((c) => c.waSent).length / contacts.length) * 100) : 0;
  const convertedPercent = contacts.length ? Math.round((contacts.filter((c) => c.status === 'Converted').length / contacts.length) * 100) : 0;

  const funnel = [
    { label: 'Total Leads',    value: contacts.length },
    { label: 'Contacted',      value: contacts.filter((c) => ['Contacted', 'Interested', 'Converted'].includes(c.status)).length },
    { label: 'Interested',     value: contacts.filter((c) => ['Interested', 'Converted'].includes(c.status)).length },
    { label: 'Converted',      value: contacts.filter((c) => c.status === 'Converted').length },
  ];

  if (contacts.length === 0) return (
    <div className="py-24 text-center text-gray-400">
      <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p>Import contacts to see analytics.</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Contacts', value: contacts.length,    icon: Users,       cls: 'bg-primary-50 text-primary-700 border-primary-100' },
          { label: 'WA Sent',        value: `${waPercent}%`,    icon: MessageCircle, cls: 'bg-green-50 text-green-700 border-green-100' },
          { label: 'Interested',     value: contacts.filter((c) => c.status === 'Interested').length, icon: TrendingUp, cls: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Converted',      value: `${convertedPercent}%`, icon: CheckCircle, cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className={`rounded-xl border p-4 flex items-center gap-3 ${cls}`}>
            <Icon className="w-8 h-8 opacity-60" />
            <div><p className="text-2xl font-bold">{value}</p><p className="text-xs font-medium opacity-70">{label}</p></div>
          </div>
        ))}
      </div>

      {/* Conversion funnel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Conversion Funnel</h3>
        <div className="space-y-2">
          {funnel.map((step, i) => {
            const pct = contacts.length ? Math.round((step.value / contacts.length) * 100) : 0;
            return (
              <div key={step.label} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-28 shrink-0">{step.label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: i * 0.1, duration: 0.6 }}
                    className="h-full rounded-full flex items-center justify-end pr-2"
                    style={{ background: CHART_COLORS[i] }}>
                    {pct > 8 && <span className="text-xs text-white font-semibold">{pct}%</span>}
                  </motion.div>
                </div>
                <span className="text-sm font-bold text-gray-700 w-10 text-right">{step.value}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* By Category */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Contacts by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byCategory} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
              <Tooltip />
              <Bar dataKey="value" name="Contacts" radius={[0, 4, 4, 0]}>
                {byCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Source + Status */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5">
            <h3 className="font-semibold text-gray-800 mb-3">By Source</h3>
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie data={bySource} cx="50%" cy="50%" outerRadius={55} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {bySource.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5">
            <h3 className="font-semibold text-gray-800 mb-3">By Status</h3>
            <div className="space-y-2">
              {LEAD_STATUSES.map((s, i) => {
                const cnt = contacts.filter((c) => (c.status || 'New') === s).length;
                const pct = contacts.length ? Math.round((cnt / contacts.length) * 100) : 0;
                return (
                  <div key={s} className="flex items-center gap-2 text-sm">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border w-28 text-center ${STATUS_STYLE[s]}`}>{s}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    </div>
                    <span className="text-gray-500 text-xs w-8 text-right">{cnt}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'import',   label: 'Import',    icon: Upload },
  { id: 'contacts', label: 'Contacts',  icon: Users },
  { id: 'whatsapp', label: 'WhatsApp',  icon: MessageCircle },
  { id: 'analytics',label: 'Analytics', icon: BarChart3 },
];

const LeadManager = () => {
  const [activeTab,   setActiveTab]   = useState('import');
  const [contacts,    setContacts]    = useState([]);
  const [meta,        setMeta]        = useState({ sources: [], categories: [], locations: [] });
  const [loading,     setLoading]     = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const reload = useCallback(async () => {
    setLoading(true);
    const all = await leadService.getAll();
    const m = {
      sources: [...new Set(all.map((l) => l.source).filter(Boolean))],
      categories: [...new Set(all.map((l) => l.category).filter(Boolean))],
      locations: [...new Set(all.map((l) => l.location).filter(Boolean))],
    };
    setContacts(all); setMeta(m); setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-primary-600 bg-clip-text text-transparent mb-1">
          Lead Manager
        </h1>
        <p className="text-gray-500 text-sm">Import contacts · Track status · Send WhatsApp · Analyse conversions</p>
      </motion.div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-6 w-fit flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                active ? 'bg-white text-primary-700 shadow' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <Icon className="w-4 h-4" />
              {label}
              {id === 'contacts' && contacts.length > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-primary-100 text-primary-600' : 'bg-gray-200 text-gray-600'}`}>
                  {contacts.length}
                </span>
              )}
              {id === 'whatsapp' && selectedIds.size > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold bg-green-500 text-white">{selectedIds.size}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }}>
          {activeTab === 'import'    && <ImportTab onImported={() => { reload(); setActiveTab('contacts'); }} existingContacts={contacts} />}
          {activeTab === 'contacts'  && <ContactsTab contacts={contacts} meta={meta} loading={loading} onReload={reload}
              onSendSelected={() => setActiveTab('whatsapp')} selectedIds={selectedIds} setSelectedIds={setSelectedIds} />}
          {activeTab === 'whatsapp'  && <WhatsAppTab contacts={contacts} selectedIds={selectedIds} setSelectedIds={setSelectedIds} onReload={reload} />}
          {activeTab === 'analytics' && <AnalyticsTab contacts={contacts} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default LeadManager;
