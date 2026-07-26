import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Package, IndianRupee, CreditCard, FileDown, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { salesOrderService } from '../services/salesOrderService';
import { salesPaymentService } from '../services/salesPaymentService';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import DateRangePicker from '../components/DateRangePicker';

const SalesReports = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('MONTH');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customerSummary, setCustomerSummary] = useState([]);
  const [gradeSummary, setGradeSummary] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [salesMetrics, setSalesMetrics] = useState({
    totalOrders: 0,
    totalSales: 0,
    totalPaid: 0,
    totalOutstanding: 0,
  });

  useEffect(() => {
    loadReports();
  }, [timeRange, startDate, endDate]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const filters = timeRange === 'CUSTOM' ? { startDate, endDate } : { timeRange };

      // Load metrics
      const metrics = await salesOrderService.getSummaryMetrics(filters);
      setSalesMetrics(metrics);

      // Load customer-wise summary
      const custData = await salesOrderService.getCustomerWiseSummary(filters);
      setCustomerSummary(custData);

      // Load grade-wise summary
      const gradeData = await salesOrderService.getGradeWiseSummary(filters);
      setGradeSummary(gradeData);

      // Load payment summary
      const paymentData = await salesPaymentService.getSummaryMetrics(filters);
      setPaymentSummary(paymentData);
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = () => {
    const exportData = [
      ...customerSummary.map(customer => ({
        'Type': 'Customer Sales',
        'Customer Name': customer.customerName,
        'Total Orders': customer.totalOrders,
        'Total Sales': `₹${(customer.totalSales ?? 0).toLocaleString('en-IN')}`,
        'Grade': '',
        'Quantity': ''
      })),
      ...gradeSummary.map(grade => ({
        'Type': 'Grade Sales',
        'Customer Name': '',
        'Total Orders': '',
        'Total Sales': `₹${(grade.totalAmount ?? 0).toLocaleString('en-IN')}`,
        'Grade': grade.grade,
        'Quantity': `${grade.totalQuantity} KG`
      }))
    ];

    const filters = timeRange === 'CUSTOM' ? { startDate, endDate } : { timeRange };
    exportToExcel(exportData, 'Sales_Report', filters);
    toast.success('Report exported to Excel successfully');
  };

  const handleExportToPDF = () => {
    const exportData = customerSummary.map(customer => ({
      'Customer Name': customer.customerName,
      'Orders': customer.totalOrders,
      'Total Sales': `₹${(customer.totalSales ?? 0).toLocaleString('en-IN')}`
    }));

    const summary = {
      'Total Orders': salesMetrics.totalOrders,
      'Total Sales': `₹${parseFloat(salesMetrics.totalSales).toLocaleString('en-IN')}`,
      'Collected': `₹${parseFloat(salesMetrics.totalPaid).toLocaleString('en-IN')}`,
      'Outstanding': `₹${parseFloat(salesMetrics.totalOutstanding).toLocaleString('en-IN')}`,
      'Cash Collections': paymentSummary ? `₹${parseFloat(paymentSummary.cashPayments ?? 0).toLocaleString('en-IN')}` : '₹0',
      'PhonePe Collections': paymentSummary ? `₹${parseFloat(paymentSummary.upiPayments || 0).toLocaleString('en-IN')}` : '₹0'
    };

    const filters = timeRange === 'CUSTOM' ? { startDate, endDate } : { timeRange };
    exportToPDF('Sales Report', exportData, summary, filters);
    toast.success('Report exported to PDF successfully');
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Sales Reports & Analytics</h1>
          <p className="text-sm text-gray-600 mt-1">Comprehensive sales analysis and insights</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Export Buttons */}
          <button
            onClick={handleExportToExcel}
            disabled={loading || customerSummary.length === 0}
            className="px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-soft flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            onClick={handleExportToPDF}
            disabled={loading || customerSummary.length === 0}
            className="px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-soft flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>

          {/* Date Range Filter */}
          <DateRangePicker
            timeRange={timeRange}
            startDate={startDate}
            endDate={endDate}
            onTimeRangeChange={setTimeRange}
            onCustomDateChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
              setTimeRange('CUSTOM');
            }}
            showAllTime={true}
          />
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
              <BarChart3 className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Orders</p>
              <p className="text-xl font-bold text-gray-900">{salesMetrics.totalOrders}</p>
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
              <IndianRupee className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Sales</p>
              <p className="text-xl font-bold text-gray-900">₹{parseFloat(salesMetrics.totalSales).toLocaleString('en-IN')}</p>
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
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Collected</p>
              <p className="text-xl font-bold text-gray-900">₹{parseFloat(salesMetrics.totalPaid).toLocaleString('en-IN')}</p>
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
            <div className="p-2 bg-red-100 rounded-lg">
              <IndianRupee className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Outstanding</p>
              <p className="text-xl font-bold text-gray-900">₹{parseFloat(salesMetrics.totalOutstanding).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer-wise Sales Summary */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
            <Users className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">Customer-wise Sales</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Customer</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Orders</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                        <span className="ml-2 text-sm">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : customerSummary.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-sm text-gray-500">
                      No data available
                    </td>
                  </tr>
                ) : (
                  customerSummary.map((customer, index) => (
                    <motion.tr
                      key={customer.customerId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-3">
                        <span className="text-sm font-semibold text-gray-900">{customer.customerName}</span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="text-sm text-gray-600">{customer.totalOrders}</span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="text-sm font-bold text-primary-600">
                          ₹{(customer.totalSales ?? 0).toLocaleString('en-IN')}
                        </span>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Grade-wise Sales Analysis */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
            <Package className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">Grade-wise Sales</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Grade</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Avg Rate</th>
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
                ) : gradeSummary.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-500">
                      No data available
                    </td>
                  </tr>
                ) : (
                  gradeSummary.map((grade, index) => (
                    <motion.tr
                      key={grade.grade}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-3">
                        <span className="text-sm font-semibold text-gray-900">{grade.grade}</span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="text-sm text-gray-600">{grade.totalQuantity} KG</span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="text-sm font-bold text-primary-600">
                          ₹{(grade.totalAmount ?? 0).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="text-sm text-gray-600">₹{grade.avgRate}/KG</span>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      {!loading && paymentSummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">Payment Collection Breakdown</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">💵</span>
                  <p className="text-xs font-semibold text-green-700">Cash Payments</p>
                </div>
                <p className="text-2xl font-bold text-green-800">₹{parseFloat(paymentSummary.cashPayments ?? 0).toLocaleString('en-IN')}</p>
                <p className="text-xs text-green-600 mt-1">
                  {((parseFloat(paymentSummary.cashPayments ?? 0) / parseFloat(paymentSummary.totalAmount ?? 0)) * 100).toFixed(1)}% of total
                </p>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">📱</span>
                  <p className="text-xs font-semibold text-blue-700">PhonePe/UPI</p>
                </div>
                <p className="text-2xl font-bold text-blue-800">₹{parseFloat(paymentSummary.upiPayments || 0).toLocaleString('en-IN')}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {((parseFloat(paymentSummary.upiPayments || 0) / parseFloat(paymentSummary.totalAmount ?? 0)) * 100).toFixed(1)}% of total
                </p>
              </div>

              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🏦</span>
                  <p className="text-xs font-semibold text-purple-700">Bank Transfer</p>
                </div>
                <p className="text-2xl font-bold text-purple-800">₹{parseFloat(paymentSummary.bankPayments || 0).toLocaleString('en-IN')}</p>
                <p className="text-xs text-purple-600 mt-1">
                  {((parseFloat(paymentSummary.bankPayments || 0) / parseFloat(paymentSummary.totalAmount ?? 0)) * 100).toFixed(1)}% of total
                </p>
              </div>

              <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">📝</span>
                  <p className="text-xs font-semibold text-orange-700">Cheque</p>
                </div>
                <p className="text-2xl font-bold text-orange-800">₹{parseFloat(paymentSummary.chequePayments || 0).toLocaleString('en-IN')}</p>
                <p className="text-xs text-orange-600 mt-1">
                  {((parseFloat(paymentSummary.chequePayments || 0) / parseFloat(paymentSummary.totalAmount ?? 0)) * 100).toFixed(1)}% of total
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Total Collections:</span>
                <span className="text-lg font-bold text-primary-600">₹{parseFloat(paymentSummary.totalAmount ?? 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-600">Total Transactions:</span>
                <span className="text-sm font-semibold text-gray-700">{paymentSummary.totalPayments}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Top Performers */}
      {!loading && customerSummary.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl shadow-soft border border-primary-200 p-6"
        >
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            Top Performers
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Customer */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Top Customer by Sales</p>
              <div className="bg-white rounded-xl p-4 border border-primary-200">
                <p className="text-lg font-bold text-primary-600">{customerSummary[0]?.customerName || 'N/A'}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {customerSummary[0]?.totalOrders || 0} orders • ₹{(customerSummary[0]?.totalSales || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Top Grade */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Best Selling Grade</p>
              <div className="bg-white rounded-xl p-4 border border-primary-200">
                <p className="text-lg font-bold text-primary-600">{gradeSummary[0]?.grade || 'N/A'}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {gradeSummary[0]?.totalQuantity || 0} KG • ₹{(gradeSummary[0]?.totalAmount || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SalesReports;
