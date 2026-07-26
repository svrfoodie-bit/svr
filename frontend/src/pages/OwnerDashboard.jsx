import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, IndianRupee, DollarSign, Package, BarChart3,
  AlertTriangle, Users, Briefcase, Receipt, ArrowUpCircle, ArrowDownCircle,
  Percent, Activity, Wallet, CreditCard, Building2, ShoppingCart, PiggyBank,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ownerDashboardService } from '../services/ownerDashboardService';
import { useNavigate } from 'react-router-dom';

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('MONTH');
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const data = await ownerDashboardService.getOwnerDashboard({ timeRange });
      setDashboardData(data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !dashboardData) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">Loading owner dashboard...</span>
        </div>
      </div>
    );
  }

  const { financial, operations, cashFlow, loans } = dashboardData;

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Owner Summary Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Comprehensive business performance overview</p>
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

      {/* Financial Metrics Section */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-primary-600" />
          Financial Overview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Total Sales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-soft border border-gray-100 p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Total Sales</p>
            </div>
            <p className="text-2xl font-bold text-green-600">₹{parseFloat(financial.totalSales || 0).toLocaleString('en-IN')}</p>
          </motion.div>

          {/* Total Cost */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-soft border border-gray-100 p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Briefcase className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Total Cost</p>
            </div>
            <p className="text-2xl font-bold text-orange-600">₹{parseFloat(financial.totalCost || 0).toLocaleString('en-IN')}</p>
          </motion.div>

          {/* Total Expenses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-soft border border-gray-100 p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Receipt className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Total Expenses</p>
            </div>
            <p className="text-2xl font-bold text-red-600">₹{parseFloat(financial.totalExpenses || 0).toLocaleString('en-IN')}</p>
          </motion.div>

          {/* Net Profit / Loss */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`rounded-xl shadow-soft border p-5 ${
              financial.isProfitable
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${financial.isProfitable ? 'bg-green-200' : 'bg-red-200'}`}>
                {financial.isProfitable ? (
                  <TrendingUp className="w-5 h-5 text-green-700" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-700" />
                )}
              </div>
              <p className="text-xs font-semibold text-gray-700 uppercase">Net Profit/Loss</p>
            </div>
            <p className={`text-2xl font-bold ${financial.isProfitable ? 'text-green-700' : 'text-red-700'}`}>
              ₹{Math.abs(parseFloat(financial.netProfit || 0)).toLocaleString('en-IN')}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Margin: <span className="font-bold">{financial.profitMargin}%</span>
            </p>
          </motion.div>
        </div>

        {/* Cost Breakdown */}
        {financial.breakdown && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-soft border border-gray-100 p-5"
          >
            <h3 className="text-sm font-bold text-gray-900 mb-4">Cost Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-xs text-purple-700 mb-1">Raw Purchase</p>
                <p className="text-lg font-bold text-purple-800">₹{parseFloat(financial.breakdown.rawPurchaseCost).toLocaleString('en-IN')}</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700 mb-1">Job Work</p>
                <p className="text-lg font-bold text-blue-800">₹{parseFloat(financial.breakdown.jobWorkCost).toLocaleString('en-IN')}</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-xs text-orange-700 mb-1">Worker Wages</p>
                <p className="text-lg font-bold text-orange-800">₹{parseFloat(financial.breakdown.workerWagesCost).toLocaleString('en-IN')}</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-xs text-red-700 mb-1">Expenses</p>
                <p className="text-lg font-bold text-red-800">₹{parseFloat(financial.breakdown.expensesCost).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Operations Metrics Section */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-600" />
          Operations Overview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Raw Purchased */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-soft border border-gray-100 p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Raw Purchased</p>
            </div>
            <p className="text-2xl font-bold text-purple-600">{parseFloat(operations.totalRawPurchased || 0).toLocaleString('en-IN')} Kg</p>
            <p className="text-xs text-gray-500 mt-1">{operations.totalBatches || 0} batches processed</p>
          </motion.div>

          {/* Finished Produced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-soft border border-gray-100 p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Finished Produced</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{parseFloat(operations.totalFinishedProduced || 0).toLocaleString('en-IN')} Kg</p>
          </motion.div>

          {/* Average Yield */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-xl shadow-soft border border-gray-100 p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Percent className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Average Yield</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{operations.averageYield || 0}%</p>
          </motion.div>

          {/* Total Wastage */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-xl shadow-soft border border-gray-100 p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Total Wastage</p>
            </div>
            <p className="text-2xl font-bold text-red-600">{operations.totalWastagePercent || 0}%</p>
            <p className="text-xs text-gray-500 mt-1">{parseFloat(operations.totalWastageKg || 0).toLocaleString('en-IN')} Kg</p>
          </motion.div>
        </div>
      </div>

      {/* Cash Flow Metrics Section */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary-600" />
          Cash Flow Overview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Cash Received */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white rounded-xl shadow-soft border border-gray-100 p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Cash Received</p>
            </div>
            <p className="text-2xl font-bold text-green-600">₹{parseFloat(cashFlow.cashReceived || 0).toLocaleString('en-IN')}</p>
          </motion.div>

          {/* Digital Received */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-white rounded-xl shadow-soft border border-gray-100 p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Digital Received</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">₹{parseFloat(cashFlow.digitalReceived || 0).toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-500 mt-1">PhonePe + Bank</p>
          </motion.div>

          {/* Total Received */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-soft border border-green-200 p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-200 rounded-lg">
                <ArrowDownCircle className="w-5 h-5 text-green-700" />
              </div>
              <p className="text-xs font-semibold text-gray-700 uppercase">Total Received</p>
            </div>
            <p className="text-2xl font-bold text-green-700">₹{parseFloat(cashFlow.totalReceived || 0).toLocaleString('en-IN')}</p>
          </motion.div>
        </div>

        {/* Outstanding */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Customer Outstanding */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="bg-white rounded-xl shadow-soft border border-gray-100 p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Customer Outstanding</p>
            </div>
            <p className="text-2xl font-bold text-orange-600">₹{parseFloat(cashFlow.customerOutstanding || 0).toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-500 mt-1">Amount to receive</p>
          </motion.div>

          {/* Supplier Outstanding */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="bg-white rounded-xl shadow-soft border border-gray-100 p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Building2 className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Supplier Outstanding</p>
            </div>
            <p className="text-2xl font-bold text-red-600">₹{parseFloat(cashFlow.supplierOutstanding || 0).toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-500 mt-1">Amount to pay</p>
          </motion.div>
        </div>
      </div>

      {/* Debt & Capital Section */}
      {loans && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary-600" />
            Debt & Capital Position
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
            {[
              { label: 'Bank Loans', value: loans.totalBankPrincipal, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Hand Loans', value: loans.totalHandPrincipal, color: 'text-orange-600', bg: 'bg-orange-50' },
              { label: 'Outstanding', value: loans.totalOutstanding, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Monthly Interest', value: loans.totalMonthlyInterest, color: 'text-red-500', bg: 'bg-red-50' },
              { label: 'Capital Invested', value: loans.totalCapital, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Interest Paid', value: loans.totalInterestPaid, color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 + i * 0.05 }}
                className={`${item.bg} rounded-xl border border-gray-100 p-4`}
              >
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{item.label}</p>
                <p className={`text-lg font-bold mt-1 ${item.color}`}>
                  ₹{parseFloat(item.value || 0).toLocaleString('en-IN')}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Net Capital Position Banner */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.55 }}
            className={`rounded-xl p-5 border flex items-center justify-between ${
              (loans.netPosition || 0) >= 0
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'
            }`}
          >
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Net Capital Position</p>
              <p className={`text-2xl font-bold mt-1 ${(loans.netPosition || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                ₹{Math.abs(parseFloat(loans.netPosition || 0)).toLocaleString('en-IN')}
                <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${(loans.netPosition || 0) >= 0 ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                  {(loans.netPosition || 0) >= 0 ? 'Surplus' : 'Deficit'}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">Capital Invested − Outstanding Loans</p>
            </div>
            <button
              onClick={() => navigate('/loan-dashboard')}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all"
            >
              View Details <ArrowRight size={13} />
            </button>
          </motion.div>
        </div>
      )}

      {/* Info Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="bg-blue-50 border border-blue-200 rounded-xl p-4"
      >
        <div className="flex items-start gap-3">
          <BarChart3 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-1">Read-Only Dashboard:</p>
            <p className="text-sm text-blue-700">
              All metrics are auto-calculated from your business data. No manual overrides are allowed.
              Net Profit = Total Sales - Total Cost - Total Expenses (including Loan Interest).
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OwnerDashboard;
