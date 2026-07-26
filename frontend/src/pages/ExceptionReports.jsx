import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, TrendingDown, DollarSign, Users, Package,
  RefreshCw, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import { reportService } from '../services/reportService';

const ExceptionReports = () => {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState({
    highWastage: null,
    lowYield: null,
    highExpense: null,
    overdueCustomers: null,
    lowStock: null,
  });
  const [filters, setFilters] = useState({
    timeRange: 'MONTH',
  });

  useEffect(() => {
    loadAllReports();
  }, [filters]);

  const loadAllReports = async () => {
    setLoading(true);
    try {
      const filterParams = filters.timeRange ? { timeRange: filters.timeRange } : {};

      const [highWastage, lowYield, highExpense, overdueCustomers, lowStock] = await Promise.all([
        reportService.getHighWastageBatches(filterParams),
        reportService.getLowYieldBatches(filterParams),
        reportService.getHighExpensePeriods(),
        reportService.getOverdueCustomers(),
        reportService.getLowStockAlerts(),
      ]);

      setReports({
        highWastage,
        lowYield,
        highExpense,
        overdueCustomers,
        lowStock,
      });
    } catch (error) {
      toast.error('Failed to load exception reports');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Exception & Risk Reports</h1>
          <p className="text-sm text-gray-600 mt-1">Business alerts and risk indicators</p>
        </div>

        <div className="flex gap-3">
          {/* Time Range Filter */}
          <select
            value={filters.timeRange}
            onChange={(e) => setFilters({ ...filters, timeRange: e.target.value })}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all shadow-soft"
          >
            <option value="DAY">Today</option>
            <option value="WEEK">This Week</option>
            <option value="MONTH">This Month</option>
            <option value="">All Time</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={loadAllReports}
            disabled={loading}
            className="px-4 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 transition-all shadow-soft disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {/* High Wastage Alert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl shadow-soft border border-red-200 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-xs font-bold text-red-900 uppercase">High Wastage</p>
          </div>
          <p className="text-3xl font-bold text-red-700">{reports.highWastage?.count || 0}</p>
          <p className="text-xs text-red-600 mt-1">Batches {'>'}5% wastage</p>
        </motion.div>

        {/* Low Yield Alert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl shadow-soft border border-orange-200 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-orange-600" />
            <p className="text-xs font-bold text-orange-900 uppercase">Low Yield</p>
          </div>
          <p className="text-3xl font-bold text-orange-700">{reports.lowYield?.count || 0}</p>
          <p className="text-xs text-orange-600 mt-1">Batches {'<'}85% yield</p>
        </motion.div>

        {/* High Expense Alert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-soft border border-purple-200 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <p className="text-xs font-bold text-purple-900 uppercase">High Expense</p>
          </div>
          <p className="text-3xl font-bold text-purple-700">{reports.highExpense?.count || 0}</p>
          <p className="text-xs text-purple-600 mt-1">Months {'>'}₹50k</p>
        </motion.div>

        {/* Overdue Customers Alert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-soft border border-blue-200 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <p className="text-xs font-bold text-blue-900 uppercase">Overdue</p>
          </div>
          <p className="text-3xl font-bold text-blue-700">{reports.overdueCustomers?.count || 0}</p>
          <p className="text-xs text-blue-600 mt-1">Customers {'>'}₹10k</p>
        </motion.div>

        {/* Low Stock Alert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl shadow-soft border border-green-200 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-green-600" />
            <p className="text-xs font-bold text-green-900 uppercase">Low Stock</p>
          </div>
          <p className="text-3xl font-bold text-green-700">{reports.lowStock?.count || 0}</p>
          <p className="text-xs text-green-600 mt-1">Products {'<'}100 Kg</p>
        </motion.div>
      </div>

      {/* High Wastage Batches */}
      {reports.highWastage?.data && reports.highWastage.data.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-bold text-gray-900">High Wastage Batches (Wastage {'>'}5%)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Batch Number</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Raw Input (Kg)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Wastage (Kg)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Wastage %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.highWastage.data.slice(0, 10).map((batch, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{batch.batchNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{new Date(batch.startDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">{parseFloat(batch.rawInput || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right text-orange-600">{parseFloat(batch.wastage || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-red-600">{batch.wastagePercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Low Yield Batches */}
      {reports.lowYield?.data && reports.lowYield.data.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-bold text-gray-900">Low Yield Batches (Yield {'<'}85%)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Batch Number</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Raw Input (Kg)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Finished Output (Kg)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Yield %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.lowYield.data.slice(0, 10).map((batch, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{batch.batchNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{new Date(batch.startDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">{parseFloat(batch.rawInput || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right text-blue-600">{parseFloat(batch.finishedOutput || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-orange-600">{parseFloat(batch.yieldPercentage || 0).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Overdue Customers */}
      {reports.overdueCustomers?.data && reports.overdueCustomers.data.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-900">Overdue Customers (Outstanding {'>'}₹10,000)</h3>
            </div>
            <p className="text-sm font-bold text-red-600">
              Total: ₹{reports.overdueCustomers.totalOutstanding.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Phone</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Total Sales</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Paid</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.overdueCustomers.data.slice(0, 10).map((customer, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{customer.customerName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{customer.phone}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">₹{customer.totalSales.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-sm text-right text-green-600">₹{customer.totalPaid.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-red-600">₹{customer.totalOutstanding.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Low Stock Alerts */}
      {reports.lowStock?.data && reports.lowStock.data.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl shadow-soft border border-gray-100 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-bold text-gray-900">Low Stock Alerts (Quantity {'<'}100 Kg)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Product Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Product Name</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Current Stock (Kg)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Selling Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.lowStock.data.map((stock, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{stock.productCode}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{stock.productName}</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-orange-600">
                      {parseFloat(stock.quantity || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">₹{parseFloat(stock.sellingPrice || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* No Alerts Message */}
      {!loading && Object.values(reports).every(r => !r || r.count === 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-green-50 border border-green-200 rounded-xl p-8 text-center"
        >
          <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-green-900 mb-2">No Exceptions Found!</h3>
          <p className="text-sm text-green-700">All operations are running smoothly. No risk alerts detected.</p>
        </motion.div>
      )}
    </div>
  );
};

export default ExceptionReports;
