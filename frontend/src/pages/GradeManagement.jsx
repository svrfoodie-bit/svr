import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Edit2, Save, X, BarChart3, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';
import { gradeService, GRADE_COLORS } from '../services/gradeService';

const colorMap = {
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-800', title: 'text-purple-900', value: 'text-purple-700', icon: 'text-purple-600' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-800', title: 'text-indigo-900', value: 'text-indigo-700', icon: 'text-indigo-600' },
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-800',     title: 'text-blue-900',   value: 'text-blue-700',   icon: 'text-blue-600' },
  cyan:   { bg: 'bg-cyan-50',   border: 'border-cyan-200',   badge: 'bg-cyan-100 text-cyan-800',     title: 'text-cyan-900',   value: 'text-cyan-700',   icon: 'text-cyan-600' },
  teal:   { bg: 'bg-teal-50',   border: 'border-teal-200',   badge: 'bg-teal-100 text-teal-800',     title: 'text-teal-900',   value: 'text-teal-700',   icon: 'text-teal-600' },
  green:  { bg: 'bg-green-50',  border: 'border-green-200',  badge: 'bg-green-100 text-green-800',   title: 'text-green-900',  value: 'text-green-700',  icon: 'text-green-600' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-800', title: 'text-orange-900', value: 'text-orange-700', icon: 'text-orange-600' },
  red:    { bg: 'bg-red-50',    border: 'border-red-200',    badge: 'bg-red-100 text-red-800',       title: 'text-red-900',    value: 'text-red-700',    icon: 'text-red-600' },
};

const GradeManagement = () => {
  const [grades, setGrades] = useState([]);
  const [stockSummary, setStockSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('prices');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [gradesData, stockData] = await Promise.all([
        gradeService.getAll(),
        gradeService.getStockSummary(),
      ]);
      setGrades(gradesData);
      setStockSummary(stockData);
    } catch {
      toast.error('Failed to load grade data');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (grade) => {
    setEditingId(grade.id);
    setEditForm({ pricePerKg: grade.pricePerKg, minPrice: grade.minPrice, maxPrice: grade.maxPrice, description: grade.description || '' });
  };

  const saveEdit = async (id) => {
    setSaving(true);
    try {
      await gradeService.update(id, {
        pricePerKg: parseFloat(editForm.pricePerKg),
        minPrice: parseFloat(editForm.minPrice),
        maxPrice: parseFloat(editForm.maxPrice),
        description: editForm.description,
      });
      toast.success('Grade price updated');
      setEditingId(null);
      loadData();
    } catch {
      toast.error('Failed to update grade price');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="p-6 flex items-center justify-center min-h-[400px]">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-600">Loading grade data...</span>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Cashew Grade Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage standard prices for each cashew grade</p>
        </div>
        <div className="flex gap-2">
          {['prices', 'stock'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {tab === 'prices' ? 'Price List' : 'Stock by Grade'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'prices' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {grades.map((grade, index) => {
            const color = colorMap[GRADE_COLORS[grade.grade] || 'blue'];
            const isEditing = editingId === grade.id;
            return (
              <motion.div key={grade.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }} className={`${color.bg} ${color.border} border rounded-2xl p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Package className={`w-5 h-5 ${color.icon}`} />
                    <span className={`font-bold text-lg ${color.title}`}>{grade.grade}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${color.badge}`}>{grade.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <p className={`text-xs mb-3 ${color.value} opacity-80`}>{grade.description}</p>
                {isEditing ? (
                  <div className="space-y-2">
                    <div>
                      <label className={`text-xs font-medium ${color.title}`}>Standard Price (₹/kg)</label>
                      <input type="number" value={editForm.pricePerKg} onChange={e => setEditForm(f => ({ ...f, pricePerKg: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={`text-xs font-medium ${color.title}`}>Min ₹/kg</label>
                        <input type="number" value={editForm.minPrice} onChange={e => setEditForm(f => ({ ...f, minPrice: e.target.value }))}
                          className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
                      </div>
                      <div>
                        <label className={`text-xs font-medium ${color.title}`}>Max ₹/kg</label>
                        <input type="number" value={editForm.maxPrice} onChange={e => setEditForm(f => ({ ...f, maxPrice: e.target.value }))}
                          className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => saveEdit(grade.id)} disabled={saving}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                        <Save size={14} /> Save
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors">
                        <X size={14} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      <p className={`text-2xl font-bold ${color.value}`}>₹{parseFloat(grade.pricePerKg).toLocaleString('en-IN')}<span className="text-sm font-normal">/kg</span></p>
                      <p className={`text-xs mt-1 ${color.value} opacity-80`}>Range: ₹{parseFloat(grade.minPrice).toLocaleString('en-IN')} – ₹{parseFloat(grade.maxPrice).toLocaleString('en-IN')}</p>
                    </div>
                    <button onClick={() => startEdit(grade)}
                      className={`w-full flex items-center justify-center gap-1 py-2 border ${color.border} bg-white/60 ${color.title} text-sm rounded-lg hover:bg-white/90 transition-colors`}>
                      <Edit2 size={13} /> Edit Price
                    </button>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {activeTab === 'stock' && (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center gap-2">
            <BarChart3 size={20} className="text-primary-600" />
            <h3 className="font-semibold text-gray-900">Current Stock by Grade</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600">Grade</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600">Description</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600">Stock (kg)</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600">Price/kg</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600">Stock Value</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600">Price Range</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {stockSummary.map((s, idx) => {
                  const color = colorMap[GRADE_COLORS[s.grade] || 'blue'];
                  return (
                    <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.04 }} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${color.badge}`}>
                          <Package size={12} />{s.grade}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">{s.description}</td>
                      <td className="px-5 py-4 text-right">
                        <span className={`text-sm font-semibold ${parseFloat(s.stockQuantity) > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                          {parseFloat(s.stockQuantity || 0).toLocaleString('en-IN')} kg
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-sm font-medium text-gray-900">₹{parseFloat(s.pricePerKg).toLocaleString('en-IN')}</td>
                      <td className="px-5 py-4 text-right text-sm font-semibold text-primary-700">₹{parseFloat(s.stockValue || 0).toLocaleString('en-IN')}</td>
                      <td className="px-5 py-4 text-right text-xs text-gray-500">₹{parseFloat(s.minPrice).toLocaleString('en-IN')} – ₹{parseFloat(s.maxPrice).toLocaleString('en-IN')}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
              <tfoot><tr className="bg-gray-50 font-semibold">
                <td colSpan={2} className="px-5 py-3 text-sm text-gray-700">Total</td>
                <td className="px-5 py-3 text-right text-sm">{stockSummary.reduce((s, r) => s + parseFloat(r.stockQuantity || 0), 0).toLocaleString('en-IN')} kg</td>
                <td></td>
                <td className="px-5 py-3 text-right text-sm text-primary-700">₹{stockSummary.reduce((s, r) => s + parseFloat(r.stockValue || 0), 0).toLocaleString('en-IN')}</td>
                <td></td>
              </tr></tfoot>
            </table>
          </div>
        </div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <IndianRupee className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            <span className="font-semibold">Grade Prices</span> are reference rates for sales orders and stock valuation. <span className="font-semibold">Full Kaju is highest value</span>, <span className="font-semibold">Chura is lowest value</span>.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default GradeManagement;
