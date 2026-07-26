import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sun, Plus, Edit2, Trash2, TrendingUp, TrendingDown, Package, IndianRupee, Target, Calendar, CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { seasonService, SEASON_STATUS } from '../services/seasonService';

const STATUS_CONFIG = {
  Planned:   { color: 'bg-blue-100 text-blue-800 border-blue-200',   icon: <Clock size={12} /> },
  Active:    { color: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle size={12} /> },
  Completed: { color: 'bg-gray-100 text-gray-700 border-gray-200',    icon: <CheckCircle size={12} /> },
  Cancelled: { color: 'bg-red-100 text-red-700 border-red-200',       icon: <XCircle size={12} /> },
};

const ProgressBar = ({ value, max, color = 'bg-primary-600' }) => {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
      <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
};

const SeasonPlanning = () => {
  const navigate = useNavigate();
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { loadSeasons(); }, []);

  const loadSeasons = async () => {
    setLoading(true);
    try {
      const data = await seasonService.getAll();
      setSeasons(data);
    } catch {
      toast.error('Failed to load seasons');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this season plan?')) return;
    setDeleting(id);
    try {
      await seasonService.delete(id);
      toast.success('Season deleted');
      loadSeasons();
    } catch {
      toast.error('Failed to delete season');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const fmt = (n) => parseFloat(n || 0).toLocaleString('en-IN');

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Season Planning</h1>
          <p className="text-sm text-gray-600 mt-1">Plan and track cashew procurement seasons with targets vs actuals</p>
        </div>
        <button onClick={() => navigate('/seasons/new')}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-soft">
          <Plus size={18} /> New Season
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : seasons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <Sun size={56} className="mb-4 opacity-30" />
          <p className="font-medium text-lg text-gray-500">No seasons planned yet</p>
          <p className="text-sm mt-1">Create your first season plan to track procurement targets</p>
          <button onClick={() => navigate('/seasons/new')}
            className="mt-6 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors">
            Plan First Season
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {seasons.map((s, idx) => {
            const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.Planned;
            const actualKg = parseFloat(s.actualProcurementKg || 0);
            const targetKg = parseFloat(s.targetProcurementKg || 0);
            const actualRev = parseFloat(s.actualRevenue || 0);
            const targetRev = parseFloat(s.targetRevenueAmount || 0);
            const actualCost = parseFloat(s.actualProcurementCost || 0) + parseFloat(s.actualExpenses || 0);
            const budget = parseFloat(s.budgetAmount || 0);
            const profit = actualRev - actualCost;

            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
                {/* Card Header */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-orange-100 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Sun size={18} className="text-orange-500" />
                        <h3 className="font-bold text-gray-900 text-lg">{s.name}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={13} />
                        <span>{formatDate(s.startDate)} — {formatDate(s.endDate)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
                        {cfg.icon} {s.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Procurement Progress */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-1.5 text-gray-600"><Package size={14} /> Procurement</span>
                      <span className="font-semibold text-gray-900">{fmt(actualKg)} / {fmt(targetKg)} kg</span>
                    </div>
                    <ProgressBar value={actualKg} max={targetKg} color="bg-amber-500" />
                    <p className="text-xs text-gray-500 mt-1">
                      {targetKg > 0 ? `${((actualKg / targetKg) * 100).toFixed(1)}% of target` : 'No target set'}
                    </p>
                  </div>

                  {/* Revenue Progress */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-1.5 text-gray-600"><IndianRupee size={14} /> Revenue</span>
                      <span className="font-semibold text-gray-900">₹{fmt(actualRev)} / ₹{fmt(targetRev)}</span>
                    </div>
                    <ProgressBar value={actualRev} max={targetRev} color="bg-green-500" />
                    <p className="text-xs text-gray-500 mt-1">
                      {targetRev > 0 ? `${((actualRev / targetRev) * 100).toFixed(1)}% of target` : 'No target set'}
                    </p>
                  </div>

                  {/* Budget vs Spend */}
                  {budget > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="flex items-center gap-1.5 text-gray-600"><Target size={14} /> Budget Used</span>
                        <span className={`font-semibold ${actualCost > budget ? 'text-red-600' : 'text-gray-900'}`}>
                          ₹{fmt(actualCost)} / ₹{fmt(budget)}
                        </span>
                      </div>
                      <ProgressBar value={actualCost} max={budget} color={actualCost > budget ? 'bg-red-500' : 'bg-blue-500'} />
                    </div>
                  )}

                  {/* Profit / Loss */}
                  <div className={`flex items-center justify-between p-3 rounded-xl ${profit >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center gap-2">
                      {profit >= 0 ? <TrendingUp size={16} className="text-green-600" /> : <TrendingDown size={16} className="text-red-600" />}
                      <span className={`text-sm font-semibold ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        Season {profit >= 0 ? 'Profit' : 'Loss'}
                      </span>
                    </div>
                    <span className={`text-lg font-bold ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      ₹{fmt(Math.abs(profit))}
                    </span>
                  </div>

                  {/* Workers */}
                  {s.expectedWorkers > 0 && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <span>👷</span> {s.expectedWorkers} workers planned
                    </p>
                  )}

                  {/* Notes */}
                  {s.notes && <p className="text-xs text-gray-500 italic border-t border-gray-100 pt-3">"{s.notes}"</p>}
                </div>

                {/* Actions */}
                <div className="px-5 pb-5 flex gap-2">
                  <button onClick={() => navigate(`/seasons/edit/${s.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-gray-700 text-sm rounded-xl hover:bg-gray-50 transition-colors">
                    <Edit2 size={14} /> Edit
                  </button>
                  <button onClick={() => handleDelete(s.id)} disabled={deleting === s.id}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 text-sm rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50">
                    <Trash2 size={14} /> {deleting === s.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Info Banner */}
      {seasons.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Actuals are auto-calculated</span> from Raw Purchases, Sales Orders, and Expenses recorded within each season's date range. Update targets anytime by clicking Edit.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default SeasonPlanning;
