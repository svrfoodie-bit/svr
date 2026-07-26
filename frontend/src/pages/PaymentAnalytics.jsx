import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  PieChart,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus,
  FileDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import DateRangePicker from '../components/DateRangePicker';
import { exportToExcel } from '../utils/exportUtils';
import { rawPurchaseService } from '../services/rawPurchaseService';
import { jobWorkService } from '../services/jobWorkService';
import { salesOrderService } from '../services/salesOrderService';
import { expenseService } from '../services/expenseService';

const PaymentAnalytics = () => {
  // Date filter state
  const [timeRange, setTimeRange] = useState('MONTH');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Data state
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalInflow: 0,
    totalOutflow: 0,
    netCashFlow: 0,
    cashFlowTrend: 'NEUTRAL', // POSITIVE, NEGATIVE, NEUTRAL

    // Payment mode breakdown
    cashInflow: 0,
    phonepeInflow: 0,
    bankInflow: 0,
    cashOutflow: 0,
    phonepeOutflow: 0,
    bankOutflow: 0,

    // Module-wise breakdown
    salesInflow: 0,
    rawPurchaseOutflow: 0,
    jobWorkOutflow: 0,
    expenseOutflow: 0,

    // Collection efficiency
    totalInvoiced: 0,
    totalCollected: 0,
    collectionRate: 0,
    avgCollectionTime: 0,

    // Outstanding analysis
    totalOutstanding: 0,
    overdueOutstanding: 0,
    outstandingGrowth: 0,

    // Trend data for charts
    dailyTrend: [],
    paymentModeDistribution: [],
    moduleDistribution: []
  });

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange, startDate, endDate]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const filters = timeRange === 'CUSTOM' ? { startDate, endDate } : { timeRange };

      // Fetch data from all modules in parallel
      const [rawPurchases, jobWorks, salesOrders, expenses] = await Promise.all([
        rawPurchaseService.getAll(filters),
        jobWorkService.getAll(filters),
        salesOrderService.getAll(filters),
        expenseService.getAll(filters)
      ]);

      calculateAnalytics(rawPurchases, jobWorks, salesOrders, expenses);
    } catch (error) {
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (rawPurchases, jobWorks, salesOrders, expenses) => {
    // Calculate inflows (Sales)
    const salesInflow = salesOrders.reduce((sum, order) => sum + (order.paidAmount || 0), 0);
    const cashInflowSales = salesOrders
      .flatMap(o => o.paymentTransactions || [])
      .filter(t => t.paymentMode === 'CASH')
      .reduce((sum, t) => sum + t.amount, 0);
    const phonepeInflowSales = salesOrders
      .flatMap(o => o.paymentTransactions || [])
      .filter(t => t.paymentMode === 'PHONEPE')
      .reduce((sum, t) => sum + t.amount, 0);
    const bankInflowSales = salesOrders
      .flatMap(o => o.paymentTransactions || [])
      .filter(t => t.paymentMode === 'BANK')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate outflows
    const rawPurchaseOutflow = rawPurchases.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const jobWorkOutflow = jobWorks.reduce((sum, j) => sum + (j.paidAmount || 0), 0);
    const expenseOutflow = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // Outflow by payment mode
    const cashOutflowRP = rawPurchases
      .flatMap(p => p.paymentTransactions || [])
      .filter(t => t.paymentMode === 'CASH')
      .reduce((sum, t) => sum + t.amount, 0);
    const phonepeOutflowRP = rawPurchases
      .flatMap(p => p.paymentTransactions || [])
      .filter(t => t.paymentMode === 'PHONEPE')
      .reduce((sum, t) => sum + t.amount, 0);
    const bankOutflowRP = rawPurchases
      .flatMap(p => p.paymentTransactions || [])
      .filter(t => t.paymentMode === 'BANK')
      .reduce((sum, t) => sum + t.amount, 0);

    const cashOutflowJW = jobWorks
      .flatMap(j => j.paymentTransactions || [])
      .filter(t => t.paymentMode === 'CASH')
      .reduce((sum, t) => sum + t.amount, 0);
    const phonepeOutflowJW = jobWorks
      .flatMap(j => j.paymentTransactions || [])
      .filter(t => t.paymentMode === 'PHONEPE')
      .reduce((sum, t) => sum + t.amount, 0);
    const bankOutflowJW = jobWorks
      .flatMap(j => j.paymentTransactions || [])
      .filter(t => t.paymentMode === 'BANK')
      .reduce((sum, t) => sum + t.amount, 0);

    const cashOutflowExp = expenses
      .filter(e => e.paymentMode === 'CASH')
      .reduce((sum, e) => sum + e.amount, 0);
    const phonepeOutflowExp = expenses
      .filter(e => e.paymentMode === 'PHONEPE')
      .reduce((sum, e) => sum + e.amount, 0);
    const bankOutflowExp = expenses
      .filter(e => e.paymentMode === 'BANK')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalCashOutflow = cashOutflowRP + cashOutflowJW + cashOutflowExp;
    const totalPhonepeOutflow = phonepeOutflowRP + phonepeOutflowJW + phonepeOutflowExp;
    const totalBankOutflow = bankOutflowRP + bankOutflowJW + bankOutflowExp;

    const totalInflow = salesInflow;
    const totalOutflow = rawPurchaseOutflow + jobWorkOutflow + expenseOutflow;
    const netCashFlow = totalInflow - totalOutflow;

    // Collection efficiency
    const totalInvoiced = salesOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalCollected = salesOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
    const collectionRate = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0;

    // Outstanding analysis
    const totalOutstanding = salesOrders.reduce((sum, o) => sum + (o.totalAmount - o.paidAmount), 0);
    const today = new Date();
    const overdueOutstanding = salesOrders
      .filter(o => {
        const daysPending = Math.floor((today - new Date(o.date)) / (1000 * 60 * 60 * 24));
        return daysPending > 30 && (o.totalAmount - o.paidAmount) > 0;
      })
      .reduce((sum, o) => sum + (o.totalAmount - o.paidAmount), 0);

    // Determine cash flow trend
    let cashFlowTrend = 'NEUTRAL';
    if (netCashFlow > 0) cashFlowTrend = 'POSITIVE';
    else if (netCashFlow < 0) cashFlowTrend = 'NEGATIVE';

    // Payment mode distribution
    const paymentModeDistribution = [
      { mode: 'Cash', inflow: cashInflowSales, outflow: totalCashOutflow, net: cashInflowSales - totalCashOutflow },
      { mode: 'PhonePe', inflow: phonepeInflowSales, outflow: totalPhonepeOutflow, net: phonepeInflowSales - totalPhonepeOutflow },
      { mode: 'Bank', inflow: bankInflowSales, outflow: totalBankOutflow, net: bankInflowSales - totalBankOutflow }
    ];

    // Module distribution
    const moduleDistribution = [
      { module: 'Sales (Inflow)', amount: salesInflow, type: 'INFLOW' },
      { module: 'Raw Purchase', amount: rawPurchaseOutflow, type: 'OUTFLOW' },
      { module: 'Job Work', amount: jobWorkOutflow, type: 'OUTFLOW' },
      { module: 'Expenses', amount: expenseOutflow, type: 'OUTFLOW' }
    ];

    setAnalytics({
      totalInflow,
      totalOutflow,
      netCashFlow,
      cashFlowTrend,

      cashInflow: cashInflowSales,
      phonepeInflow: phonepeInflowSales,
      bankInflow: bankInflowSales,
      cashOutflow: totalCashOutflow,
      phonepeOutflow: totalPhonepeOutflow,
      bankOutflow: totalBankOutflow,

      salesInflow,
      rawPurchaseOutflow,
      jobWorkOutflow,
      expenseOutflow,

      totalInvoiced,
      totalCollected,
      collectionRate,

      totalOutstanding,
      overdueOutstanding,

      paymentModeDistribution,
      moduleDistribution
    });
  };

  const handleExportAnalytics = () => {
    const exportData = [
      { Metric: 'Total Inflow (Sales)', Amount: `₹${analytics.totalInflow.toLocaleString('en-IN')}` },
      { Metric: 'Total Outflow', Amount: `₹${analytics.totalOutflow.toLocaleString('en-IN')}` },
      { Metric: 'Net Cash Flow', Amount: `₹${analytics.netCashFlow.toLocaleString('en-IN')}` },
      { Metric: '', Amount: '' },
      { Metric: 'Cash Inflow', Amount: `₹${analytics.cashInflow.toLocaleString('en-IN')}` },
      { Metric: 'PhonePe Inflow', Amount: `₹${analytics.phonepeInflow.toLocaleString('en-IN')}` },
      { Metric: 'Bank Inflow', Amount: `₹${analytics.bankInflow.toLocaleString('en-IN')}` },
      { Metric: '', Amount: '' },
      { Metric: 'Cash Outflow', Amount: `₹${analytics.cashOutflow.toLocaleString('en-IN')}` },
      { Metric: 'PhonePe Outflow', Amount: `₹${analytics.phonepeOutflow.toLocaleString('en-IN')}` },
      { Metric: 'Bank Outflow', Amount: `₹${analytics.bankOutflow.toLocaleString('en-IN')}` },
      { Metric: '', Amount: '' },
      { Metric: 'Total Invoiced', Amount: `₹${analytics.totalInvoiced.toLocaleString('en-IN')}` },
      { Metric: 'Total Collected', Amount: `₹${analytics.totalCollected.toLocaleString('en-IN')}` },
      { Metric: 'Collection Rate', Amount: `${analytics.collectionRate.toFixed(2)}%` },
      { Metric: '', Amount: '' },
      { Metric: 'Total Outstanding', Amount: `₹${analytics.totalOutstanding.toLocaleString('en-IN')}` },
      { Metric: 'Overdue Outstanding', Amount: `₹${analytics.overdueOutstanding.toLocaleString('en-IN')}` }
    ];

    const filters = timeRange === 'CUSTOM' ? { startDate, endDate } : { timeRange };
    exportToExcel(exportData, 'Payment_Analytics_Report', filters);
    toast.success('Analytics exported to Excel successfully');
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'POSITIVE':
        return <ArrowUp className="w-5 h-5 text-green-600" />;
      case 'NEGATIVE':
        return <ArrowDown className="w-5 h-5 text-red-600" />;
      default:
        return <Minus className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'POSITIVE':
        return 'text-green-600';
      case 'NEGATIVE':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-soft">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payment Analytics</h1>
              <p className="text-sm text-gray-600">Insights and trends for payment data</p>
            </div>
          </div>
          <div className="flex gap-2">
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
            <button
              onClick={handleExportAnalytics}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileDown className="w-5 h-5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Cash Flow Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200"
            >
              <div className="flex items-center justify-between mb-3">
                <TrendingUp className="w-10 h-10 text-green-600" />
                <span className="text-xs font-semibold text-green-700 bg-green-200 px-3 py-1 rounded-full">
                  Inflow
                </span>
              </div>
              <p className="text-3xl font-bold text-green-900">
                ₹{analytics.totalInflow.toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-green-700 mt-2">Total Collections</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200"
            >
              <div className="flex items-center justify-between mb-3">
                <TrendingDown className="w-10 h-10 text-red-600" />
                <span className="text-xs font-semibold text-red-700 bg-red-200 px-3 py-1 rounded-full">
                  Outflow
                </span>
              </div>
              <p className="text-3xl font-bold text-red-900">
                ₹{analytics.totalOutflow.toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-red-700 mt-2">Total Payments</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`bg-gradient-to-br rounded-xl p-6 border ${
                analytics.cashFlowTrend === 'POSITIVE'
                  ? 'from-blue-50 to-blue-100 border-blue-200'
                  : analytics.cashFlowTrend === 'NEGATIVE'
                  ? 'from-orange-50 to-orange-100 border-orange-200'
                  : 'from-gray-50 to-gray-100 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <Activity className={`w-10 h-10 ${getTrendColor(analytics.cashFlowTrend)}`} />
                <div className="flex items-center gap-1.5">
                  {getTrendIcon(analytics.cashFlowTrend)}
                  <span className={`text-xs font-semibold ${getTrendColor(analytics.cashFlowTrend)}`}>
                    {analytics.cashFlowTrend}
                  </span>
                </div>
              </div>
              <p className={`text-3xl font-bold ${getTrendColor(analytics.cashFlowTrend)}`}>
                ₹{Math.abs(analytics.netCashFlow).toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-gray-700 mt-2">Net Cash Flow</p>
            </motion.div>
          </div>

          {/* Payment Mode Analysis */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-bold text-gray-900">Payment Mode Analysis</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analytics.paymentModeDistribution.map((mode, index) => (
                <motion.div
                  key={mode.mode}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-xl p-4"
                >
                  <h3 className="font-semibold text-gray-900 mb-3">{mode.mode}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Inflow:</span>
                      <span className="text-sm font-semibold text-green-600">
                        ₹{mode.inflow.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Outflow:</span>
                      <span className="text-sm font-semibold text-red-600">
                        ₹{mode.outflow.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Net:</span>
                        <span className={`text-sm font-bold ${mode.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{Math.abs(mode.net).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Module-wise Breakdown */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-bold text-gray-900">Module-wise Breakdown</h2>
            </div>
            <div className="space-y-3">
              {analytics.moduleDistribution.map((module, index) => (
                <motion.div
                  key={module.module}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-12 rounded ${module.type === 'INFLOW' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <h3 className="font-semibold text-gray-900">{module.module}</h3>
                      <p className="text-xs text-gray-500">{module.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${module.type === 'INFLOW' ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{module.amount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {((module.amount / (analytics.totalInflow + analytics.totalOutflow)) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Collection Efficiency & Outstanding */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Collection Efficiency */}
            <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-bold text-gray-900">Collection Efficiency</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Total Invoiced</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₹{analytics.totalInvoiced.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Total Collected</span>
                    <span className="text-sm font-semibold text-green-600">
                      ₹{analytics.totalCollected.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-base font-medium text-gray-700">Collection Rate</span>
                    <span className={`text-2xl font-bold ${
                      analytics.collectionRate >= 80 ? 'text-green-600' :
                      analytics.collectionRate >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {analytics.collectionRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        analytics.collectionRate >= 80 ? 'bg-green-500' :
                        analytics.collectionRate >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${analytics.collectionRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Outstanding Analysis */}
            <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-bold text-gray-900">Outstanding Analysis</h2>
              </div>
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-700 mb-1">Critical - Overdue (30+ days)</p>
                  <p className="text-2xl font-bold text-red-900">
                    ₹{analytics.overdueOutstanding.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-sm text-yellow-700 mb-1">Total Outstanding</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    ₹{analytics.totalOutstanding.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Overdue Ratio:</span>
                  <span className="font-semibold text-red-600">
                    {analytics.totalOutstanding > 0
                      ? ((analytics.overdueOutstanding / analytics.totalOutstanding) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentAnalytics;
