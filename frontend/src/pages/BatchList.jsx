import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, Edit, CheckCircle, XCircle, TrendingUp, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getRawTypeLabel, processingBatchService, RAW_TYPES } from '../services/processingBatchService';

const BatchList = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    rawType: '',
    timeRange: 'MONTH',
  });
  const [metrics, setMetrics] = useState({
    totalBatches: 0,
    openBatches: 0,
    closedBatches: 0,
    totalRawInput: 0,
    totalOutput: 0,
    totalWastage: 0,
    avgYieldPercentage: 0,
  });

  useEffect(() => {
    loadBatches();
    loadMetrics();
  }, [filters]);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const data = await processingBatchService.getAll(filters);
      setBatches(data);
    } catch (error) {
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const data = await processingBatchService.getSummaryMetrics(filters);
      setMetrics(data);
    } catch (error) {
    }
  };

  const getStatusLabel = (status) => {
    if (status === 'Open') return 'In Progress';
    if (status === 'Closed') return 'Completed';
    return status;
  };

  const getStatusColor = (status) => {
    return status === 'Open'
      ? 'bg-blue-100 text-blue-700 border-blue-200'
      : 'bg-green-100 text-green-700 border-green-200';
  };

  const getRawTypeColor = (type) => {
    return type === 'RWA'
      ? 'bg-purple-100 text-purple-700 border-purple-200'
      : 'bg-indigo-100 text-indigo-700 border-indigo-200';
  };

  const getYieldColor = (yieldPercent) => {
    if (yieldPercent >= 95) return 'text-green-600';
    if (yieldPercent >= 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Production Batches</h1>
          <p className="text-sm text-gray-600 mt-1">Convert raw cashew into finished stock for sales</p>
        </div>
        <button
          onClick={() => navigate('/batches/new')}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 font-semibold shadow-soft transition-all"
        >
          <Plus size={20} />
          <span>New Production</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-4 shadow-soft border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Package className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Production</p>
              <p className="text-xl font-bold text-gray-900">{metrics.totalBatches}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-4 shadow-soft border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <XCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">In Progress</p>
              <p className="text-xl font-bold text-gray-900">{metrics.openBatches}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-4 shadow-soft border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Completed</p>
              <p className="text-xl font-bold text-gray-900">{metrics.closedBatches}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-4 shadow-soft border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Avg Output %</p>
              <p className="text-xl font-bold text-gray-900">{metrics.avgYieldPercentage}%</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Time Range Filter */}
          <select
            value={filters.timeRange}
            onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          >
            <option value="DAY">Today</option>
            <option value="WEEK">This Week</option>
            <option value="MONTH">This Month</option>
            <option value="">All Time</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          >
            <option value="">All Status</option>
            <option value="Open">In Progress</option>
            <option value="Closed">Completed</option>
          </select>

          {/* Raw Type Filter */}
          <select
            value={filters.rawType}
            onChange={(e) => setFilters(prev => ({ ...prev, rawType: e.target.value }))}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          >
            <option value="">All Raw Stock</option>
            {RAW_TYPES.map(type => (
              <option key={type} value={type}>{getRawTypeLabel(type)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Production Table */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Production ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Raw Stock</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Raw Qty (KG)</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Output (KG)</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Loss (KG)</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Output %</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                      <span className="ml-2">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    No production batches found
                  </td>
                </tr>
              ) : (
                batches.map((batch, index) => (
                  <motion.tr
                    key={batch.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold text-primary-600">
                        {batch.batchId}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(batch.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-lg border ${getRawTypeColor(batch.rawType)}`}>
                        {getRawTypeLabel(batch.rawType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">{batch.rawInputQuantity}</td>
                    <td className="px-6 py-4 text-right font-semibold text-green-600">{batch.totalOutput || '-'}</td>
                    <td className="px-6 py-4 text-right font-semibold text-red-600">{batch.totalWastage || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${getYieldColor(batch.yieldPercentage)}`}>
                        {batch.yieldPercentage > 0 ? `${batch.yieldPercentage}%` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-lg border ${getStatusColor(batch.status)}`}>
                        {getStatusLabel(batch.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {batch.status === 'Open' ? (
                          <button
                            onClick={() => navigate(`/batches/yield/${batch.id}`)}
                            className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-semibold"
                          >
                            Add Output
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/batches/edit/${batch.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Edit size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Note */}
      {!loading && batches.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">Production Flow:</p>
              <p className="text-sm text-blue-700">
                In-progress batches need finished output and loss details. Click "Add Output" to complete production and create finished stock for sales.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default BatchList;
