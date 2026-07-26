import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, IndianRupee, DollarSign, AlertCircle, CheckCircle, Package, Users, Briefcase, Receipt, BarChart3, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { profitService } from '../services/profitService';

const ProfitDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('MONTH');
  const [profitData, setProfitData] = useState(null);
  const [periodComparison, setPeriodComparison] = useState(null);

  useEffect(() => {
    loadProfitData();
    loadPeriodComparison();
  }, [timeRange]);

  const loadProfitData = async () => {
    setLoading(true);
    try {
      const data = await profitService.getProfitBreakdown({ timeRange });
      setProfitData(data);
    } catch (error) {
      toast.error('Failed to load profit data');
    } finally {
      setLoading(false);
    }
  };

  const loadPeriodComparison = async () => {
    try {
      const data = await profitService.compareProfitPeriods();
      setPeriodComparison(data);
    } catch (error) {
    }
  };

  if (loading || !profitData) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">Loading profit data...</span>
        </div>
      </div>
    );
  }

  const isProfitable = profitData.isProfitable;
  const profitColor = isProfitable ? 'text-green-600' : 'text-red-600';
  const profitBgColor = isProfitable ? 'from-green-50 to-emerald-50 border-green-200' : 'from-red-50 to-orange-50 border-red-200';
  const profitIcon = isProfitable ? <TrendingUp className="w-8 h-8 text-green-600" /> : <TrendingDown className="w-8 h-8 text-red-600" />;

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Profit & Loss Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Overall business profitability analysis</p>
        </div>

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

      {/* Overall Profit Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-r ${profitBgColor} rounded-2xl shadow-soft border p-8 mb-6`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-2">Overall Profit / Loss</p>
            <div className="flex items-center gap-4">
              <p className={`text-4xl md:text-5xl font-bold ${profitColor}`}>
                ₹{parseFloat(profitData.overallProfit).toLocaleString('en-IN')}
              </p>
              {profitIcon}
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Profit Margin:</span>
                <span className={`text-lg font-bold ${profitColor}`}>{profitData.profitMargin}%</span>
              </div>
              {isProfitable ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-200 text-green-800 rounded-full">
                  <CheckCircle size={16} />
                  <span className="text-sm font-semibold">Profitable</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-200 text-red-800 rounded-full">
                  <AlertCircle size={16} />
                  <span className="text-sm font-semibold">Loss</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Revenue & Cost Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Total Sales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <IndianRupee className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Total Sales Revenue</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">₹{parseFloat(profitData.totalSales).toLocaleString('en-IN')}</p>
          <p className="text-sm text-gray-600 mt-2">{profitData.counts?.salesOrders || 0} orders</p>
        </motion.div>

        {/* Total Cost */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Total Costs</h3>
          </div>
          <p className="text-3xl font-bold text-red-600">₹{parseFloat(profitData.totalCost).toLocaleString('en-IN')}</p>
          <p className="text-sm text-gray-600 mt-2">
            {(profitData.counts?.rawPurchases || 0) + (profitData.counts?.jobWorks || 0) +
             (profitData.counts?.dailyWorkLogs || 0) + (profitData.counts?.expenses || 0)} transactions
          </p>
        </motion.div>
      </div>

      {/* Cost Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 mb-6"
      >
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-primary-600" />
          Cost Breakdown
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Raw Purchase Cost */}
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-purple-600" />
              <p className="text-xs font-semibold text-purple-900">Raw Purchase</p>
            </div>
            <p className="text-xl font-bold text-purple-700">₹{parseFloat(profitData.rawPurchaseCost).toLocaleString('en-IN')}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-purple-600">{profitData.costBreakdown?.rawPurchasePercent}% of costs</span>
              <span className="text-xs text-purple-600">{profitData.counts?.rawPurchases || 0} items</span>
            </div>
          </div>

          {/* Job Work Cost */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <p className="text-xs font-semibold text-blue-900">Job Work</p>
            </div>
            <p className="text-xl font-bold text-blue-700">₹{parseFloat(profitData.jobWorkCost).toLocaleString('en-IN')}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-blue-600">{profitData.costBreakdown?.jobWorkPercent}% of costs</span>
              <span className="text-xs text-blue-600">{profitData.counts?.jobWorks || 0} items</span>
            </div>
          </div>

          {/* Worker Wages Cost */}
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-orange-600" />
              <p className="text-xs font-semibold text-orange-900">Worker Wages</p>
            </div>
            <p className="text-xl font-bold text-orange-700">₹{parseFloat(profitData.workerWagesCost).toLocaleString('en-IN')}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-orange-600">{profitData.costBreakdown?.workerWagesPercent}% of costs</span>
              <span className="text-xs text-orange-600">{profitData.counts?.dailyWorkLogs || 0} logs</span>
            </div>
          </div>

          {/* Expenses Cost */}
          <div className="bg-red-50 rounded-xl p-4 border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="w-4 h-4 text-red-600" />
              <p className="text-xs font-semibold text-red-900">Expenses</p>
            </div>
            <p className="text-xl font-bold text-red-700">₹{parseFloat(profitData.expensesCost).toLocaleString('en-IN')}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-red-600">{profitData.costBreakdown?.expensesPercent}% of costs</span>
              <span className="text-xs text-red-600">{profitData.counts?.expenses || 0} items</span>
            </div>
          </div>

          {/* Finance Charges (Loan Interest) */}
          {parseFloat(profitData.loanInterestCost || 0) > 0 && (
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 md:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-yellow-700" />
                <p className="text-xs font-semibold text-yellow-900">Finance Charges</p>
              </div>
              <p className="text-xl font-bold text-yellow-700">₹{parseFloat(profitData.loanInterestCost).toLocaleString('en-IN')}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-yellow-600">{profitData.costBreakdown?.loanInterestPercent}% of costs</span>
                <span className="text-xs text-yellow-600">Loan Interest</span>
              </div>
            </div>
          )}
        </div>

        {/* True Profit note when loan interest exists */}
        {parseFloat(profitData.loanInterestCost || 0) > 0 && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle size={14} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-800">
              <span className="font-semibold">Finance Charges Included:</span> Loan interest of
              ₹{parseFloat(profitData.loanInterestCost).toLocaleString('en-IN')} is deducted from profit.
              This is your <span className="font-semibold">true profit after debt cost</span>.
            </p>
          </div>
        )}
      </motion.div>

      {/* Period Comparison */}
      {periodComparison && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6"
        >
          <h3 className="font-semibold text-gray-900 mb-4">Period-wise Profit Comparison</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.values(periodComparison).map((period, index) => {
              const profit = parseFloat(period.overallProfit);
              const isProfit = profit >= 0;
              const color = isProfit ? 'text-green-600' : 'text-red-600';
              const bgColor = isProfit ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';

              return (
                <motion.div
                  key={period.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className={`${bgColor} rounded-xl p-4 border`}
                >
                  <p className="text-xs text-gray-600 mb-2">{period.label}</p>
                  <p className={`text-xl font-bold ${color}`}>
                    ₹{Math.abs(profit).toLocaleString('en-IN')}
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    {isProfit ? (
                      <TrendingUp size={14} className="text-green-600" />
                    ) : (
                      <TrendingDown size={14} className="text-red-600" />
                    )}
                    <span className={`text-xs font-semibold ${color}`}>
                      {isProfit ? 'Profit' : 'Loss'}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Info Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-1">Profit Calculation:</p>
            <p className="text-sm text-blue-700">
              Overall Profit = Total Sales Revenue − (Raw Purchase + Job Work + Worker Wages + Expenses + Finance Charges).
              Finance Charges = loan interest paid. All values are auto-calculated and read-only.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfitDashboard;
