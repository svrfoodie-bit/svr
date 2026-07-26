import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Receipt, Plus, Edit, IndianRupee, CreditCard, Smartphone, Calendar, FileDown, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { expenseService, EXPENSE_CATEGORIES, PAYMENT_MODES } from '../services/expenseService';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { useDebounce } from '../hooks/useDebounce';

const ExpenseList = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    paymentMode: '',
    timeRange: 'MONTH',
  });
  const [metrics, setMetrics] = useState({
    totalExpenses: 0,
    totalAmount: 0,
    cashExpenses: 0,
    phonePeExpenses: 0,
    bankExpenses: 0,
  });

  // Debounce filters to reduce API calls
  const debouncedFilters = useDebounce(filters, 300);

  useEffect(() => {
    loadExpenses();
    loadMetrics();
  }, [debouncedFilters]);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const data = await expenseService.getAll(debouncedFilters);
      setExpenses(data);
    } catch (error) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const data = await expenseService.getSummaryMetrics(debouncedFilters);
      setMetrics(data);
    } catch (error) {
    }
  };

  const getCategoryType = (category) => {
    for (const [type, categories] of Object.entries(EXPENSE_CATEGORIES)) {
      if (categories.includes(category)) {
        return type;
      }
    }
    return 'Other';
  };

  const getCategoryTypeColor = (category) => {
    const type = getCategoryType(category);
    switch (type) {
      case 'Factory':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Operational':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Administrative':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPaymentModeIcon = (mode) => {
    switch (mode) {
      case 'Cash':
        return <IndianRupee className="w-4 h-4" />;
      case 'PhonePe':
        return <Smartphone className="w-4 h-4" />;
      case 'Bank':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <IndianRupee className="w-4 h-4" />;
    }
  };

  const getPaymentModeColor = (mode) => {
    switch (mode) {
      case 'Cash':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'PhonePe':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Bank':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleExportToExcel = () => {
    if (!expenses || expenses.length === 0) {
      toast.error('No data to export');
      return;
    }

    const exportData = expenses.map(expense => ({
      'Expense Number': expense.expenseNumber,
      'Date': new Date(expense.date).toLocaleDateString('en-IN'),
      'Category': expense.category,
      'Description': expense.description,
      'Amount': `₹${expense.amount.toLocaleString('en-IN')}`,
      'Payment Mode': expense.paymentMode,
      'Transaction ID': expense.transactionId || 'N/A',
      'Bank Name': expense.bankName || 'N/A',
      'Paid To': expense.paidTo,
      'Remarks': expense.remarks || ''
    }));

    exportToExcel(exportData, 'Expense_List', { timeRange: filters.timeRange });
    toast.success('Report exported to Excel successfully');
  };

  const handleExportToPDF = () => {
    if (!expenses || expenses.length === 0) {
      toast.error('No data to export');
      return;
    }

    const exportData = expenses.map(expense => ({
      'Expense No': expense.expenseNumber,
      'Date': new Date(expense.date).toLocaleDateString('en-IN'),
      'Category': expense.category,
      'Description': expense.description,
      'Amount': `₹${expense.amount.toLocaleString('en-IN')}`,
      'Payment Mode': expense.paymentMode,
      'Paid To': expense.paidTo
    }));

    const summary = {
      'Total Expenses': metrics.totalExpenses,
      'Total Amount': `₹${parseFloat(metrics.totalAmount ?? 0).toLocaleString('en-IN')}`,
      'Cash Expenses': `₹${parseFloat(metrics.cashExpenses ?? 0).toLocaleString('en-IN')}`,
      'PhonePe Expenses': `₹${parseFloat(metrics.phonePeExpenses ?? 0).toLocaleString('en-IN')}`,
      'Bank Expenses': `₹${parseFloat(metrics.bankExpenses).toLocaleString('en-IN')}`
    };

    exportToPDF('Expense List Report', exportData, summary, { timeRange: filters.timeRange });
    toast.success('PDF export opened in new window');
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-600 mt-1">Track and manage all business expenses</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleExportToExcel}
            disabled={loading || expenses.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all flex items-center gap-2 shadow-soft"
          >
            <FileDown size={18} />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            onClick={handleExportToPDF}
            disabled={loading || expenses.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all flex items-center gap-2 shadow-soft"
          >
            <Printer size={18} />
            <span className="hidden sm:inline">PDF</span>
          </button>

          <button
            onClick={() => navigate('/expenses/new')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 font-semibold shadow-soft transition-all"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Add Expense</span>
          </button>
        </div>
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
              <Receipt className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Expenses</p>
              <p className="text-xl font-bold text-gray-900">{metrics.totalExpenses}</p>
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
            <div className="p-2 bg-red-100 rounded-lg">
              <IndianRupee className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Amount</p>
              <p className="text-xl font-bold text-gray-900">₹{parseFloat(metrics.totalAmount ?? 0).toLocaleString('en-IN')}</p>
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
              <IndianRupee className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Cash Expenses</p>
              <p className="text-xl font-bold text-gray-900">₹{parseFloat(metrics.cashExpenses ?? 0).toLocaleString('en-IN')}</p>
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
            <div className="p-2 bg-blue-100 rounded-lg">
              <Smartphone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">PhonePe Expenses</p>
              <p className="text-xl font-bold text-gray-900">₹{parseFloat(metrics.phonePeExpenses ?? 0).toLocaleString('en-IN')}</p>
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

          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          >
            <option value="">All Categories</option>
            {Object.entries(EXPENSE_CATEGORIES).map(([type, categories]) => (
              <optgroup key={type} label={type}>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </optgroup>
            ))}
          </select>

          {/* Payment Mode Filter */}
          <select
            value={filters.paymentMode}
            onChange={(e) => setFilters(prev => ({ ...prev, paymentMode: e.target.value }))}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          >
            <option value="">All Payment Modes</option>
            {PAYMENT_MODES.map(mode => (
              <option key={mode} value={mode}>{mode}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Expense No</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Payment Mode</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Paid To</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                      <span className="ml-2">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No expenses found
                  </td>
                </tr>
              ) : (
                expenses.map((expense, index) => (
                  <motion.tr
                    key={expense.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold text-primary-600">
                        {expense.expenseNumber || expense.expenseCode || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(expense.date).toLocaleDateString('en-IN')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-lg border ${getCategoryTypeColor(expense.category)}`}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{expense.description}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-red-600">
                        ₹{expense.amount.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border ${getPaymentModeColor(expense.paymentMode)}`}>
                        {getPaymentModeIcon(expense.paymentMode)}
                        {expense.paymentMode}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{expense.paidTo || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/expenses/edit/${expense.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Expense"
                        >
                          <Edit size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExpenseList;
