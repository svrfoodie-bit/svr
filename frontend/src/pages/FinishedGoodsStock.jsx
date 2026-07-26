import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, TrendingDown, AlertCircle, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import { finishedGoodsStockService } from '../services/finishedGoodsStockService';
import { FINISHED_GRADES } from '../services/processingBatchService';

const FinishedGoodsStock = () => {
  const [stockSummary, setStockSummary] = useState([]);
  const [stockEntries, setStockEntries] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary'); // summary, entries, adjustments

  // Adjustment Modal
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    grade: '',
    quantity: '',
    type: 'Issue',
    reason: '',
    approvedBy: 'Owner',
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const toNumber = (value) => {
    const numberValue = parseFloat(value);
    return Number.isFinite(numberValue) ? numberValue : 0;
  };

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-IN');
  };

  const normalizeSummary = (items = []) => (Array.isArray(items) ? items : []).map((item) => ({
    ...item,
    currentStock: toNumber(item.currentStock ?? item.stock ?? item.quantity),
    batchCount: toNumber(item.batchCount),
  }));

  const normalizeEntry = (item = {}) => ({
    ...item,
    date: item.date || item.dateAdded || item.createdAt,
    batchId: item.batchId || item.batchNumber || '-',
    quantity: toNumber(item.quantity),
    remarks: item.remarks || item.notes || (toNumber(item.quantity) < 0 ? 'Stock reduced' : 'Stock added'),
  });

  const normalizeAdjustment = (item = {}) => ({
    ...item,
    date: item.date || item.dateAdded || item.createdAt,
    type: item.type || item.adjustmentType || 'Adjustment',
    quantity: Math.abs(toNumber(item.quantity)),
    reason: item.reason || item.notes || '-',
    approvedBy: item.approvedBy || item.createdBy || '-',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [summary, entries, adjs] = await Promise.all([
        finishedGoodsStockService.getStockSummary(),
        finishedGoodsStockService.getAllEntries(),
        finishedGoodsStockService.getAllAdjustments(),
      ]);

      setStockSummary(normalizeSummary(summary));
      setStockEntries((Array.isArray(entries) ? entries : []).map(normalizeEntry));
      setAdjustments((Array.isArray(adjs) ? adjs : []).map(normalizeAdjustment));
    } catch (error) {
      toast.error('Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  const openAdjustmentModal = (grade = '') => {
    setAdjustmentForm({
      date: new Date().toISOString().split('T')[0],
      grade,
      quantity: '',
      type: 'Issue',
      reason: '',
      approvedBy: 'Owner',
    });
    setShowAdjustmentModal(true);
  };

  const handleAdjustmentSubmit = async (e) => {
    e.preventDefault();
    const quantity = toNumber(adjustmentForm.quantity);
    if (!adjustmentForm.grade) {
      toast.error('Please select a grade');
      return;
    }
    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    try {
      await finishedGoodsStockService.recordAdjustment({
        ...adjustmentForm,
        adjustmentType: adjustmentForm.type,
        dateAdded: adjustmentForm.date,
        quantity,
      });

      toast.success('Stock adjustment recorded successfully');
      setShowAdjustmentModal(false);
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to record adjustment');
    }
  };

  const getGradeColor = (grade) => {
    const colors = {
      'Full Kaju': 'bg-purple-100 text-purple-700 border-purple-200',
      'Split Kaju': 'bg-blue-100 text-blue-700 border-blue-200',
      '4 Pieces': 'bg-green-100 text-green-700 border-green-200',
      '8 Pieces': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Chura': 'bg-orange-100 text-orange-700 border-orange-200',
    };
    return colors[grade] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const totalStock = stockSummary.reduce((sum, item) => sum + toNumber(item.currentStock), 0);

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Finished Goods Stock</h1>
          <p className="text-sm text-gray-600 mt-1">Grade-wise inventory management</p>
        </div>
        <button
          onClick={() => openAdjustmentModal()}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 font-semibold shadow-soft transition-all"
        >
          <Minus size={20} />
          <span>Record Adjustment</span>
        </button>
      </div>

      {/* Total Stock Card */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl shadow-soft p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90 mb-1">Total Finished Goods Stock</p>
            <p className="text-4xl font-bold">{totalStock.toFixed(2)} KG</p>
          </div>
          <Package className="w-16 h-16 opacity-20" />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 px-6 py-4 font-semibold transition-all ${
              activeTab === 'summary'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Stock Summary
          </button>
          <button
            onClick={() => setActiveTab('entries')}
            className={`flex-1 px-6 py-4 font-semibold transition-all ${
              activeTab === 'entries'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Stock Entries
          </button>
          <button
            onClick={() => setActiveTab('adjustments')}
            className={`flex-1 px-6 py-4 font-semibold transition-all ${
              activeTab === 'adjustments'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Adjustments
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Stock Summary Tab */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                    <span className="ml-2 text-gray-600">Loading...</span>
                  </div>
                </div>
              ) : stockSummary.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No stock available
                </div>
              ) : (
                stockSummary.map((item, index) => (
                  <motion.div
                    key={item.grade}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-primary-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <Package className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                          <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-lg border mb-1 ${getGradeColor(item.grade)}`}>
                            {item.grade}
                          </span>
                          <p className="text-xs text-gray-600">Current Stock</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{toNumber(item.currentStock).toFixed(2)}</p>
                        <p className="text-xs text-gray-600">KG</p>
                        {toNumber(item.currentStock) > 0 && (
                          <button
                            onClick={() => openAdjustmentModal(item.grade)}
                            className="mt-2 text-xs text-red-600 hover:text-red-700 font-semibold"
                          >
                            Record Issue/Damage
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Stock Entries Tab */}
          {activeTab === 'entries' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Batch ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Grade</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Quantity (KG)</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading...</td>
                    </tr>
                  ) : stockEntries.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No stock entries found</td>
                    </tr>
                  ) : (
                    stockEntries.map((entry, index) => (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(entry.date)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-semibold text-primary-600">
                            {entry.batchId}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-lg border ${getGradeColor(entry.grade)}`}>
                            {entry.grade}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-right font-semibold ${entry.quantity < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {entry.quantity > 0 ? '+' : ''}{toNumber(entry.quantity).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{entry.remarks}</td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Adjustments Tab */}
          {activeTab === 'adjustments' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Grade</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Quantity (KG)</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Approved By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">Loading...</td>
                    </tr>
                  ) : adjustments.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No adjustments found</td>
                    </tr>
                  ) : (
                    adjustments.map((adj, index) => (
                      <motion.tr
                        key={adj.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(adj.date)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-lg border ${getGradeColor(adj.grade)}`}>
                            {adj.grade}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                            adj.type === 'Issue' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {adj.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-red-600">
                          -{toNumber(adj.quantity).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{adj.reason}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{adj.approvedBy}</td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Adjustment Modal */}
      <AnimatePresence>
        {showAdjustmentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAdjustmentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-strong max-w-md w-full p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Record Stock Adjustment</h3>

              <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={adjustmentForm.date}
                    onChange={(e) => setAdjustmentForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Grade</label>
                  <select
                    value={adjustmentForm.grade}
                    onChange={(e) => setAdjustmentForm(prev => ({ ...prev, grade: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    required
                  >
                    <option value="">Select Grade</option>
                    {FINISHED_GRADES.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                  <select
                    value={adjustmentForm.type}
                    onChange={(e) => setAdjustmentForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  >
                    <option value="Issue">Issue</option>
                    <option value="Damage">Damage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity (KG)</label>
                  <input
                    type="number"
                    value={adjustmentForm.quantity}
                    onChange={(e) => setAdjustmentForm(prev => ({ ...prev, quantity: e.target.value }))}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
                  <input
                    type="text"
                    value={adjustmentForm.reason}
                    onChange={(e) => setAdjustmentForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    placeholder="e.g., Customer order, Damaged during handling"
                    required
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-700">
                      This adjustment will reduce the stock. Ensure you have sufficient stock before proceeding.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 font-semibold transition-all"
                  >
                    Record Adjustment
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAdjustmentModal(false)}
                    className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FinishedGoodsStock;
