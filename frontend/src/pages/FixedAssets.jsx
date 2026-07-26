import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit, Trash2, Save, X,
  Factory, MapPin, Package2, Car,
  Sofa, Cpu, HelpCircle, TrendingDown,
  IndianRupee, ChevronDown, Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

// ── Constants ────────────────────────────────────────────────────────────────
const ASSET_TYPES = ['Machinery', 'Land', 'Building', 'Vehicle', 'Furniture', 'Equipment', 'Other'];
const STATUSES    = ['Active', 'Disposed', 'Under Maintenance'];

const TYPE_META = {
  Machinery:  { icon: Factory,   color: 'blue',   bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700'   },
  Land:       { icon: MapPin,    color: 'green',  bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700'  },
  Building:   { icon: Package2,  color: 'indigo', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
  Vehicle:    { icon: Car,       color: 'cyan',   bg: 'bg-cyan-50',   border: 'border-cyan-200',   text: 'text-cyan-700'   },
  Furniture:  { icon: Sofa,      color: 'amber',  bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700'  },
  Equipment:  { icon: Cpu,       color: 'purple', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  Other:      { icon: HelpCircle,color: 'gray',   bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-600'   },
};

const STATUS_COLORS = {
  Active:             'bg-green-100 text-green-700',
  Disposed:           'bg-red-100 text-red-700',
  'Under Maintenance':'bg-yellow-100 text-yellow-700',
};

const emptyForm = {
  assetName:    '',
  assetType:    'Machinery',
  purchaseDate: new Date().toISOString().split('T')[0],
  purchaseCost: '',
  currentValue: '',
  location:     '',
  description:  '',
  status:       'Active',
  notes:        '',
};

const fmt = (v) =>
  parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Component ─────────────────────────────────────────────────────────────────
const FixedAssets = () => {
  const [assets,   setAssets]   = useState([]);
  const [summary,  setSummary]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [form,     setForm]     = useState({ ...emptyForm });
  const [saving,   setSaving]   = useState(false);
  const [filter,   setFilter]   = useState({ assetType: '', status: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [listRes, sumRes] = await Promise.all([
        api.get('/fixed-assets'),
        api.get('/fixed-assets/summary'),
      ]);
      setAssets(listRes);
      setSummary(sumRes);
    } catch {
      toast.error('Failed to load fixed assets');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({
      ...p,
      [name]: value,
      // Auto-fill currentValue when purchaseCost changes and not editing
      ...(name === 'purchaseCost' && !editId ? { currentValue: value } : {}),
    }));
  };

  const openAdd = () => {
    setEditId(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditId(item.id);
    setForm({
      assetName:    item.assetName,
      assetType:    item.assetType,
      purchaseDate: item.purchaseDate?.split('T')[0] || item.purchaseDate,
      purchaseCost: item.purchaseCost,
      currentValue: item.currentValue,
      location:     item.location    || '',
      description:  item.description || '',
      status:       item.status,
      notes:        item.notes       || '',
    });
    setShowForm(true);
  };

  const handleCancel = () => { setShowForm(false); setEditId(null); setForm({ ...emptyForm }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.assetName.trim())             { toast.error('Asset name is required'); return; }
    if (!form.purchaseCost || parseFloat(form.purchaseCost) <= 0) {
      toast.error('Purchase cost must be greater than zero'); return;
    }
    if (!form.currentValue || parseFloat(form.currentValue) < 0) {
      toast.error('Current value cannot be negative'); return;
    }
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/fixed-assets/${editId}`, form);
        toast.success('Asset updated');
      } else {
        await api.post('/fixed-assets', form);
        toast.success('Fixed asset recorded');
      }
      handleCancel();
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to save asset');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete asset "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/fixed-assets/${id}`);
      toast.success('Asset deleted');
      load();
    } catch {
      toast.error('Failed to delete asset');
    }
  };

  // Filtered list
  const filtered = assets.filter((a) => {
    if (filter.assetType && a.assetType !== filter.assetType) return false;
    if (filter.status    && a.status    !== filter.status)    return false;
    return true;
  });

  const totalActiveValue = summary?.totals?.activeValue   || 0;
  const totalCost        = summary?.totals?.totalCost      || 0;
  const depreciation     = parseFloat(totalCost) - parseFloat(totalActiveValue);

  return (
    <div className="p-4 md:p-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Fixed Assets</h1>
          <p className="text-sm text-gray-500 mt-1">Machinery, Land, Building & other long-term assets</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold transition-all text-sm shadow-md shadow-primary-900/20"
        >
          <Plus size={16} /> Add Asset
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <SummaryCard label="Total Assets" value={summary.totals.totalAssets} unit="items" color="blue" />
          <SummaryCard label="Purchase Cost" value={`₹${fmt(totalCost)}`} color="indigo" />
          <SummaryCard label="Current Value" value={`₹${fmt(totalActiveValue)}`} color="green" />
          <SummaryCard label="Depreciation" value={`₹${fmt(depreciation)}`} color="red" icon={<TrendingDown size={20} className="text-red-300" />} />
        </div>
      )}

      {/* Type breakdown */}
      {summary?.byType?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-soft border border-gray-100 p-5 mb-6"
        >
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Asset Value by Type</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {summary.byType.map((t) => {
              const meta = TYPE_META[t.assetType] || TYPE_META.Other;
              const Icon = meta.icon;
              return (
                <div key={t.assetType} className={`${meta.bg} ${meta.border} border rounded-xl p-3`}>
                  <Icon size={16} className={meta.text} />
                  <p className={`text-xs font-semibold mt-1 ${meta.text}`}>{t.assetType}</p>
                  <p className={`text-sm font-bold mt-0.5 ${meta.text}`}>₹{fmt(t.activeValue)}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{t.count} item{t.count > 1 ? 's' : ''}</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Add / Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 mb-6"
          >
            <h2 className="text-base font-bold text-gray-900 mb-5">
              {editId ? 'Edit Fixed Asset' : 'Record New Fixed Asset'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">

                {/* Asset Name */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Asset Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" name="assetName" value={form.assetName} onChange={handleChange} required
                    placeholder="e.g. Cashew Shelling Machine, Factory Building"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                  />
                </div>

                {/* Asset Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Asset Type <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="assetType" value={form.assetType} onChange={handleChange} required
                      className="w-full appearance-none px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all pr-9"
                    >
                      {ASSET_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Purchase Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Purchase Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date" name="purchaseDate" value={form.purchaseDate} onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]} required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                  />
                </div>

                {/* Purchase Cost */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Purchase Cost (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number" name="purchaseCost" value={form.purchaseCost} onChange={handleChange}
                    min="1" step="1" required placeholder="0"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                  />
                </div>

                {/* Current Value */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Value (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number" name="currentValue" value={form.currentValue} onChange={handleChange}
                    min="0" step="1" required placeholder="0"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Book value after depreciation (if any)</p>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                  <input
                    type="text" name="location" value={form.location} onChange={handleChange}
                    placeholder="e.g. Factory Floor A, Survey No. 45"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <div className="relative">
                    <select
                      name="status" value={form.status} onChange={handleChange}
                      className="w-full appearance-none px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all pr-9"
                    >
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Description */}
                <div className="md:col-span-2 lg:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <input
                    type="text" name="description" value={form.description} onChange={handleChange}
                    placeholder="Brief description of the asset"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                  />
                </div>

                {/* Notes */}
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                  <textarea
                    name="notes" value={form.notes} onChange={handleChange} rows="2"
                    placeholder="Optional — serial number, vendor, warranty details, etc."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button
                  type="submit" disabled={saving}
                  className="flex-1 md:flex-none px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {saving
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Save size={15} />}
                  {editId ? 'Update Asset' : 'Save Asset'}
                </button>
                <button
                  type="button" onClick={handleCancel}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold transition-all flex items-center gap-2 text-sm"
                >
                  <X size={15} /> Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative">
          <Filter size={13} className="absolute left-3 top-3 text-gray-400" />
          <select
            value={filter.assetType}
            onChange={(e) => setFilter((p) => ({ ...p, assetType: e.target.value }))}
            className="pl-8 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
          >
            <option value="">All Types</option>
            {ASSET_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="relative">
          <Filter size={13} className="absolute left-3 top-3 text-gray-400" />
          <select
            value={filter.status}
            onChange={(e) => setFilter((p) => ({ ...p, status: e.target.value }))}
            className="pl-8 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        {(filter.assetType || filter.status) && (
          <button
            onClick={() => setFilter({ assetType: '', status: '' })}
            className="px-3 py-2 text-xs text-gray-500 hover:text-red-500 bg-white border border-gray-200 rounded-xl transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Factory size={44} className="mx-auto mb-3 opacity-20" />
          <p className="font-semibold text-gray-500">No fixed assets found</p>
          <p className="text-sm mt-1">Add your machinery, land, or building assets</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Code', 'Asset Name', 'Type', 'Purchase Date', 'Cost', 'Current Value', 'Depreciation', 'Location', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((item, i) => {
                  const meta  = TYPE_META[item.assetType] || TYPE_META.Other;
                  const Icon  = meta.icon;
                  const dep   = parseFloat(item.purchaseCost) - parseFloat(item.currentValue);
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{item.assetCode}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{item.assetName}</p>
                        {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${meta.bg} ${meta.text}`}>
                          <Icon size={11} /> {item.assetType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {new Date(item.purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">₹{fmt(item.purchaseCost)}</td>
                      <td className="px-4 py-3 font-bold text-green-700 whitespace-nowrap">₹{fmt(item.currentValue)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {dep > 0
                          ? <span className="text-red-500 font-medium">₹{fmt(dep)}</span>
                          : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{item.location || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[item.status]}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => handleDelete(item.id, item.assetName)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
              {/* Footer total */}
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Total ({filtered.length} assets)</td>
                  <td className="px-4 py-3 font-bold text-gray-800">
                    ₹{fmt(filtered.reduce((s, a) => s + parseFloat(a.purchaseCost), 0))}
                  </td>
                  <td className="px-4 py-3 font-bold text-green-700">
                    ₹{fmt(filtered.reduce((s, a) => s + parseFloat(a.currentValue), 0))}
                  </td>
                  <td className="px-4 py-3 font-bold text-red-500">
                    ₹{fmt(filtered.reduce((s, a) => s + parseFloat(a.purchaseCost) - parseFloat(a.currentValue), 0))}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Info note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3"
      >
        <IndianRupee className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          <span className="font-semibold">Current Value</span> appears on the Balance Sheet under Fixed Assets.
          Update it periodically to reflect depreciation. Purchase Cost is the original acquisition cost.
        </p>
      </motion.div>
    </div>
  );
};

// ── Helper sub-components ─────────────────────────────────────────────────────
const SummaryCard = ({ label, value, unit, color, icon }) => {
  const colors = {
    blue:   'from-blue-50   to-blue-100   border-blue-200   text-blue-700',
    indigo: 'from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-700',
    green:  'from-green-50  to-green-100  border-green-200  text-green-700',
    red:    'from-red-50    to-red-100    border-red-200    text-red-600',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-4 flex items-center justify-between`}
    >
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
        <p className={`text-xl font-bold mt-1 ${colors[color].split(' ').pop()}`}>{value}</p>
        {unit && <p className="text-xs text-gray-400 mt-0.5">{unit}</p>}
      </div>
      {icon}
    </motion.div>
  );
};

export default FixedAssets;
