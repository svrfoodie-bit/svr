import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, PieChart, IndianRupee, Receipt, TrendingDown, FileDown, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { expenseService, EXPENSE_CATEGORIES } from '../services/expenseService';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

const ExpenseReports = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('MONTH');
  const [categoryWiseSummary, setCategoryWiseSummary] = useState([]);
  const [paymentModeWiseSummary, setPaymentModeWiseSummary] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [metrics, setMetrics] = useState({
    totalExpenses: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    loadReports();
  }, [timeRange]);

  const loadReports = async () => {
    setLoading(true);
    try {
      // Load metrics
      const metricsData = await expenseService.getSummaryMetrics({ timeRange });
      setMetrics(metricsData);

      // Load category-wise summary
      const categoryData = await expenseService.getCategoryWiseSummary({ timeRange });
      setCategoryWiseSummary(categoryData);

      // Load payment mode-wise summary
      const paymentModeData = await expenseService.getPaymentModeWiseSummary({ timeRange });
      setPaymentModeWiseSummary(paymentModeData);

      // Load recent expenses for transaction tracking
      const expensesData = await expenseService.getAll({ timeRange });
      setRecentExpenses(expensesData.slice(0, 10)); // Show latest 10
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
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

  const calculatePercentage = (amount) => {
    const total = parseFloat(metrics.totalAmount);
    if (total === 0) return 0;
    return ((amount / total) * 100).toFixed(2);
  };

  const handleExportToExcel = () => {
    const exportData = recentExpenses.map(expense => ({
      'Date': new Date(expense.date).toLocaleDateString('en-IN'),
      'Expense Number': expense.expenseNumber,
      'Category': expense.category,
      'Description': expense.description,
      'Payment Mode': expense.paymentMode,
      'Transaction ID': expense.transactionId || 'N/A',
      'Bank Name': expense.bankName || 'N/A',
      'Paid To': expense.paidTo,
      'Amount': `₹${expense.amount.toLocaleString('en-IN')}`,
      'Remarks': expense.remarks || ''
    }));

    exportToExcel(exportData, 'Expense_Report', { timeRange });
    toast.success('Report exported to Excel successfully');
  };

  const handleExportToPDF = () => {
    const exportData = recentExpenses.map(expense => ({
      'Date': new Date(expense.date).toLocaleDateString('en-IN'),
      'Category': expense.category,
      'Description': expense.description,
      'Payment Mode': expense.paymentMode,
      'Amount': `₹${expense.amount.toLocaleString('en-IN')}`
    }));

    const summary = {
      'Total Expenses': metrics.totalExpenses,
      'Total Amount': `₹${parseFloat(metrics.totalAmount).toLocaleString('en-IN')}`,
      'Cash Expenses': `₹${paymentModeWiseSummary.find(p => p.paymentMode === 'Cash')?.totalAmount.toLocaleString('en-IN') || '0'}`,
      'PhonePe Expenses': `₹${paymentModeWiseSummary.find(p => p.paymentMode === 'PhonePe')?.totalAmount.toLocaleString('en-IN') || '0'}`,
      'Bank Expenses': `₹${paymentModeWiseSummary.find(p => p.paymentMode === 'Bank')?.totalAmount.toLocaleString('en-IN') || '0'}`
    };

    exportToPDF('Expense Report', exportData, summary, { timeRange });
    toast.success('Report exported to PDF successfully');
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Expense Reports</h1>
          <p className="text-sm text-gray-600 mt-1">Detailed expense analysis and breakdowns</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Export Buttons */}
          <button
            onClick={handleExportToExcel}
            disabled={loading || recentExpenses.length === 0}
            className="px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-soft flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            onClick={handleExportToPDF}
            disabled={loading || recentExpenses.length === 0}
            className="px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-soft flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>

          {/* Time Range Filter */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all shadow-soft"
          >
            <option value="DAY">Today</option>
            <option value="WEEK">This Week</option>
            <option value="MONTH">This Month</option>
            <option value="">All Time</option>
          </select>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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
              <p className="text-xl font-bold text-gray-900">₹{parseFloat(metrics.totalAmount).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category-wise Expense Summary */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">Category-wise Expenses</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Category</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Count</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                        <span className="ml-2 text-sm">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : categoryWiseSummary.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-500">
                      No data available
                    </td>
                  </tr>
                ) : (
                  categoryWiseSummary.map((item, index) => (
                    <motion.tr
                      key={item.category}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-3">
                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-lg border ${getCategoryTypeColor(item.category)}`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="text-sm text-gray-600">{item.totalExpenses}</span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="text-sm font-bold text-red-600">
                          ₹{item.totalAmount.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="text-sm font-semibold text-gray-700">
                          {calculatePercentage(item.totalAmount)}%
                        </span>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Mode-wise Expense Summary */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
            <PieChart className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">Payment Mode-wise Expenses</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Payment Mode</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Count</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                        <span className="ml-2 text-sm">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : paymentModeWiseSummary.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-500">
                      No data available
                    </td>
                  </tr>
                ) : (
                  paymentModeWiseSummary.map((item, index) => {
                    const getPaymentIcon = (mode) => {
                      if (mode === 'Cash') return '💵';
                      if (mode === 'PhonePe') return '📱';
                      if (mode === 'Bank') return '🏦';
                      return '💳';
                    };

                    const color = item.paymentMode === 'Cash'
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : item.paymentMode === 'PhonePe'
                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                      : 'bg-indigo-100 text-indigo-700 border-indigo-200';

                    return (
                      <motion.tr
                        key={item.paymentMode}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-3">
                          <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-lg border ${color}`}>
                            {getPaymentIcon(item.paymentMode)} {item.paymentMode}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <span className="text-sm text-gray-600">{item.totalExpenses}</span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <span className="text-sm font-bold text-red-600">
                            ₹{item.totalAmount.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <span className="text-sm font-semibold text-gray-700">
                            {calculatePercentage(item.totalAmount)}%
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Category */}
      {!loading && categoryWiseSummary.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl shadow-soft border border-red-200 p-6"
        >
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            Highest Expense Category
          </h3>
          <div className="bg-white rounded-xl p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-lg border ${getCategoryTypeColor(categoryWiseSummary[0].category)}`}>
                  {categoryWiseSummary[0].category}
                </span>
                <p className="text-sm text-gray-600 mt-2">
                  {categoryWiseSummary[0].totalExpenses} expense{categoryWiseSummary[0].totalExpenses !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-red-600">
                  ₹{categoryWiseSummary[0].totalAmount.toLocaleString('en-IN')}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {calculatePercentage(categoryWiseSummary[0].totalAmount)}% of total
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Transactions with Payment Details */}
      {!loading && recentExpenses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
            <p className="text-xs text-gray-600 mt-1">Latest expenses with payment tracking details</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Payment Mode</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Transaction Details</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentExpenses.map((expense, index) => (
                  <motion.tr
                    key={expense.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {new Date(expense.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded border ${getCategoryTypeColor(expense.category)}`}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{expense.description}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded border ${
                        expense.paymentMode === 'Cash'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : expense.paymentMode === 'PhonePe'
                          ? 'bg-blue-100 text-blue-700 border-blue-200'
                          : 'bg-indigo-100 text-indigo-700 border-indigo-200'
                      }`}>
                        {expense.paymentMode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {expense.paymentMode !== 'Cash' ? (
                        <div className="space-y-0.5">
                          {expense.transactionId && (
                            <div className="text-xs">
                              <span className="font-medium">Txn:</span> {expense.transactionId}
                            </div>
                          )}
                          {expense.bankName && (
                            <div className="text-xs">
                              <span className="font-medium">Bank:</span> {expense.bankName}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Cash payment</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold text-red-600">
                        ₹{expense.amount.toLocaleString('en-IN')}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ExpenseReports;
