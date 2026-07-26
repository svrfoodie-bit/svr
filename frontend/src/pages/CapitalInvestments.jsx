import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Save, X, Wallet, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { capitalService, formatCurrency } from '../services/loanService';

const emptyForm = {
  amount: '',
  investmentDate: new Date().toISOString().split('T')[0],
  description: '',
  notes: '',
};

const CapitalInvestments = () => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await capitalService.getAll();
      setInvestments(data);
    } catch {
      toast.error('Failed to load capital investments');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setFormData({
      amount: item.amount,
      investmentDate: item.investmentDate?.split('T')[0] || item.investmentDate,
      description: item.description,
      notes: item.notes || '',
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditId(null);
    setFormData({ ...emptyForm });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Amount must be greater than zero');
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await capitalService.update(editId, formData);
        toast.success('Investment updated');
      } else {
        await capitalService.create(formData);
        toast.success('Capital investment recorded');
      }
      handleCancel();
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete investment ${code}?`)) return;
    try {
      await capitalService.delete(id);
      toast.success('Investment deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const totalInvested = investments.reduce((s, i) => s + parseFloat(i.amount), 0);

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Capital Investments</h1>
          <p className="text-sm text-gray-600 mt-1">Track money invested into the business</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setFormData({ ...emptyForm }); }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold transition-all text-sm"
        >
          <Plus size={16} /> Add Investment
        </button>
      </div>

      {/* Summary Card */}
      {totalInvested > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 mb-6 flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Total Capital Invested</p>
            <p className="text-3xl font-bold text-green-700 mt-1">{formatCurrency(totalInvested)}</p>
            <p className="text-xs text-green-600 mt-1">{investments.length} investment{investments.length !== 1 ? 's' : ''}</p>
          </div>
          <TrendingUp size={40} className="text-green-300" />
        </motion.div>
      )}

      {/* Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 mb-6"
        >
          <h2 className="text-base font-bold text-gray-900 mb-5">
            {editId ? 'Edit Investment' : 'Record New Investment'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  min="1"
                  step="1"
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="investmentDate"
                  value={formData.investmentDate}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                  placeholder="e.g. Annual capital infusion for raw material season"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="2"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all resize-none"
                  placeholder="Optional notes..."
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2 border-t">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 md:flex-none px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                {editId ? 'Update' : 'Save Investment'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-all flex items-center gap-2 text-sm"
              >
                <X size={16} /> Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : investments.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Wallet size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No investments recorded</p>
          <p className="text-sm mt-1">Add your first capital investment</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Code', 'Date', 'Amount', 'Description', 'Notes', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {investments.map((item, i) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.capitalCode}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {new Date(item.investmentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 font-bold text-green-700">{formatCurrency(item.amount)}</td>
                    <td className="px-4 py-3 text-gray-800">{item.description}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{item.notes || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDelete(item.id, item.capitalCode)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CapitalInvestments;
