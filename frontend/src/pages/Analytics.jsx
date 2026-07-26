import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Factory,
  AlertTriangle,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Download,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ownerDashboardService } from '../services/ownerDashboardService';
import { reportService } from '../services/reportService';
import DateRangePicker from '../components/DateRangePicker';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

// ── Chart color palette ───────────────────────────────────────────────────────
const COLORS = ['#8B5CF6', '#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];

// ── Small helpers ─────────────────────────────────────────────────────────────
const fmt = (v) => parseFloat(v || 0).toLocaleString('en-IN');
const fmtRs = (v) => `₹${fmt(v)}`;

/** Returns % change as a number, or null if no previous value */
const calcChange = (current, previous) => {
  const c = parseFloat(current || 0);
  const p = parseFloat(previous || 0);
  if (p === 0) return null;
  return (((c - p) / Math.abs(p)) * 100).toFixed(1);
};

/** Map current timeRange → previous period key for comparison */
const prevRange = { MONTH: 'WEEK', WEEK: 'DAY', DAY: null, '': 'MONTH' };

// ── Custom tooltip for charts ─────────────────────────────────────────────────
const RsTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-soft p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.name.toLowerCase().includes('yield') || p.name.toLowerCase().includes('wastage')
            ? `${p.value}%`
            : fmtRs(p.value)}
        </p>
      ))}
    </div>
  );
};

// ── KPI card with optional % change badge ─────────────────────────────────────
const KpiCard = ({ icon: Icon, title, value, sub, colorClass, bgClass, borderClass, change, delay }) => {
  const up = change !== null && parseFloat(change) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`bg-gradient-to-br ${bgClass} rounded-2xl p-6 border ${borderClass}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClass}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change !== null ? (
          <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            up ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(change)}%
          </span>
        ) : (
          <Activity className="w-6 h-6 text-gray-400" />
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className={`text-3xl font-bold ${colorClass.replace('bg-', 'text-').replace('-500', '-700')}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-2">{sub}</p>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('MONTH');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [prevDashboard, setPrevDashboard] = useState(null);
  const [trends, setTrends] = useState(null);
  const [topCustomersData, setTopCustomersData] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, customStartDate, customEndDate]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const filters =
        timeRange === 'CUSTOM'
          ? { startDate: customStartDate, endDate: customEndDate }
          : { timeRange };

      const pr = prevRange[timeRange];
      const prevFilters = pr ? { timeRange: pr } : null;

      const [dashboard, rawPurchases, sales, yieldReport, expenses, customerOutstanding, prev] =
        await Promise.all([
          ownerDashboardService.getOwnerDashboard(filters),
          reportService.getRawPurchaseSummary(filters),
          reportService.getSalesReport(filters),
          reportService.getYieldWastageReport(filters),
          reportService.getExpenseRegister(filters),
          reportService.getCustomerOutstandingReport(filters),
          prevFilters ? ownerDashboardService.getOwnerDashboard(prevFilters) : Promise.resolve(null),
        ]);

      setDashboardData(dashboard);
      setPrevDashboard(prev);
      setTrends({ rawPurchases, sales, yieldReport, expenses });
      setTopCustomersData(customerOutstanding);
    } catch (error) {
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // ── Derived chart data ──────────────────────────────────────────────────────
  const monthlySalesData = useMemo(() => {
    if (!trends?.sales?.data?.length) return [];
    const monthly = {};
    trends.sales.data.forEach((order) => {
      const date = new Date(order.date || order.orderDate);
      if (isNaN(date)) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      if (!monthly[key]) monthly[key] = { month: label, Sales: 0, Received: 0 };
      monthly[key].Sales += parseFloat(order.orderTotal || order.totalAmount || 0);
      monthly[key].Received += parseFloat(order.paidAmount || order.amountPaid || 0);
    });
    return Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [trends]);

  const costBreakdownData = useMemo(() => {
    const br = dashboardData?.financial?.breakdown;
    if (!br) return [];
    return [
      { name: 'Raw Purchase', value: parseFloat(br.rawPurchaseCost || 0) },
      { name: 'Job Work', value: parseFloat(br.jobWorkCost || 0) },
      { name: 'Worker Wages', value: parseFloat(br.workerWagesCost || 0) },
      { name: 'Expenses', value: parseFloat(br.expensesCost || 0) },
    ].filter((d) => d.value > 0);
  }, [dashboardData]);

  const yieldChartData = useMemo(() => {
    if (!trends?.yieldReport?.data?.length) return [];
    return trends.yieldReport.data.slice(-12).map((b) => ({
      batch: b.batchNumber,
      Yield: parseFloat(b.yieldPercent || 0),
      Wastage: parseFloat(b.wastage || 0),
    }));
  }, [trends]);

  const topSuppliers = useMemo(() => {
    if (!trends?.rawPurchases?.data?.length) return [];
    const map = {};
    trends.rawPurchases.data.forEach((p) => {
      const name = p.supplierName || 'Unknown';
      if (!map[name]) map[name] = { name, quantity: 0, amount: 0 };
      map[name].quantity += parseFloat(p.quantityKg || p.quantity || 0);
      map[name].amount += parseFloat(p.totalAmount || 0);
    });
    return Object.values(map)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [trends]);

  const topCustomers = useMemo(
    () => (topCustomersData?.data || []).slice(0, 5),
    [topCustomersData]
  );

  // ── % change vs previous period ────────────────────────────────────────────
  const profitMarginChange = calcChange(
    dashboardData?.financial?.profitMargin,
    prevDashboard?.financial?.profitMargin
  );
  const yieldChange = calcChange(
    dashboardData?.operations?.averageYield,
    prevDashboard?.operations?.averageYield
  );
  const salesChange = calcChange(
    dashboardData?.financial?.totalSales,
    prevDashboard?.financial?.totalSales
  );
  const wastageChange = calcChange(
    dashboardData?.operations?.totalWastagePercent,
    prevDashboard?.operations?.totalWastagePercent
  );

  // ── Export handler ──────────────────────────────────────────────────────────
  const handleExport = (type) => {
    const summary = {
      'Total Sales': fmtRs(dashboardData?.financial?.totalSales),
      'Net Profit': fmtRs(dashboardData?.financial?.netProfit),
      'Profit Margin': `${dashboardData?.financial?.profitMargin || 0}%`,
      'Yield Efficiency': `${dashboardData?.operations?.averageYield || 0}%`,
      'Wastage Rate': `${dashboardData?.operations?.totalWastagePercent || 0}%`,
    };
    const filters = timeRange === 'CUSTOM'
      ? { startDate: customStartDate, endDate: customEndDate }
      : { timeRange };

    if (type === 'pdf') {
      exportToPDF('Business Analytics', topCustomers.map((c) => ({
        Customer: c.customerName,
        'Total Sales': fmtRs(c.totalSales),
        'Paid': fmtRs(c.totalPaid),
        'Outstanding': fmtRs(c.totalOutstanding),
      })), summary, filters);
    } else {
      exportToExcel(topCustomers.map((c) => ({
        customer: c.customerName,
        totalSales: c.totalSales,
        paid: c.totalPaid,
        outstanding: c.totalOutstanding,
      })), 'Business_Analytics', filters);
    }
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics…</p>
        </div>
      </div>
    );
  }

  const financial = dashboardData?.financial || {};
  const operations = dashboardData?.operations || {};
  const cashFlow = dashboardData?.cashFlow || {};
  const isProfitable = financial.isProfitable;
  const profitMargin = financial.profitMargin || 0;
  const yieldEfficiency = operations.averageYield || 0;
  const wastageRate = operations.totalWastagePercent || 0;

  const changeLabel = prevRange[timeRange]
    ? `vs ${prevRange[timeRange] === 'WEEK' ? 'this week' : prevRange[timeRange] === 'DAY' ? 'today' : 'this month'}`
    : null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-1">
              Business Analytics
            </h1>
            <p className="text-gray-500 text-sm">Comprehensive insights and performance metrics</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <DateRangePicker
              timeRange={timeRange}
              startDate={customStartDate}
              endDate={customEndDate}
              onTimeRangeChange={setTimeRange}
              onCustomDateChange={(s, e) => {
                setCustomStartDate(s);
                setCustomEndDate(e);
                setTimeRange('CUSTOM');
              }}
            />

            <button
              onClick={() => handleExport('excel')}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-50 border border-green-200 text-green-700 rounded-xl hover:bg-green-100 transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>
        {changeLabel && (
          <p className="text-xs text-gray-400 mt-1">Change indicators compare {changeLabel}</p>
        )}
      </motion.div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          icon={DollarSign}
          title="Profit Margin"
          value={`${profitMargin}%`}
          sub={isProfitable ? 'Profitable operations' : 'Loss operations'}
          colorClass={isProfitable ? 'bg-green-500' : 'bg-red-500'}
          bgClass={isProfitable ? 'from-green-50 to-green-100' : 'from-red-50 to-red-100'}
          borderClass={isProfitable ? 'border-green-200' : 'border-red-200'}
          change={profitMarginChange}
          delay={0.1}
        />
        <KpiCard
          icon={Factory}
          title="Yield Efficiency"
          value={`${yieldEfficiency}%`}
          sub={yieldEfficiency >= 85 ? 'Excellent' : 'Needs improvement'}
          colorClass={yieldEfficiency >= 85 ? 'bg-blue-500' : 'bg-yellow-500'}
          bgClass={yieldEfficiency >= 85 ? 'from-blue-50 to-blue-100' : 'from-yellow-50 to-yellow-100'}
          borderClass={yieldEfficiency >= 85 ? 'border-blue-200' : 'border-yellow-200'}
          change={yieldChange}
          delay={0.2}
        />
        <KpiCard
          icon={ShoppingCart}
          title="Total Sales"
          value={fmtRs(financial.totalSales)}
          sub="Revenue generated"
          colorClass="bg-purple-500"
          bgClass="from-purple-50 to-purple-100"
          borderClass="border-purple-200"
          change={salesChange}
          delay={0.3}
        />
        <KpiCard
          icon={AlertTriangle}
          title="Wastage Rate"
          value={`${wastageRate}%`}
          sub={wastageRate <= 5 ? 'Under control' : 'Action needed'}
          colorClass={wastageRate <= 5 ? 'bg-teal-500' : 'bg-orange-500'}
          bgClass={wastageRate <= 5 ? 'from-teal-50 to-teal-100' : 'from-orange-50 to-orange-100'}
          borderClass={wastageRate <= 5 ? 'border-teal-200' : 'border-orange-200'}
          change={wastageChange}
          delay={0.4}
        />
      </div>

      {/* ── Financial Overview ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 mb-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-100 rounded-lg">
            <BarChart3 className="w-5 h-5 text-primary-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Financial Overview</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Sales', value: financial.totalSales, cls: 'from-green-50 to-green-100/50 border-green-200 text-green-700' },
            { label: 'Total Cost', value: financial.totalCost, cls: 'from-red-50 to-red-100/50 border-red-200 text-red-700' },
            { label: 'Total Expenses', value: financial.totalExpenses, cls: 'from-orange-50 to-orange-100/50 border-orange-200 text-orange-700' },
            { label: 'Net Profit / Loss', value: financial.netProfit, cls: isProfitable ? 'from-blue-50 to-blue-100/50 border-blue-200 text-blue-700' : 'from-gray-50 to-gray-100/50 border-gray-200 text-gray-700' },
          ].map(({ label, value, cls }) => (
            <div key={label} className={`p-4 bg-gradient-to-br ${cls} rounded-xl border`}>
              <p className="text-sm text-gray-600 mb-1">{label}</p>
              <p className={`text-2xl font-bold`}>{fmtRs(value)}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Charts Row 1: Sales Trend + Cost Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Sales Trend Line Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.55 }}
          className="lg:col-span-2 bg-white rounded-2xl shadow-soft border border-gray-100 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Sales Trend</h2>
          </div>
          {monthlySalesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip content={<RsTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="Sales" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Received" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
              No sales data for the selected period
            </div>
          )}
        </motion.div>

        {/* Cost Breakdown Pie Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <PieChartIcon className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Cost Breakdown</h2>
          </div>
          {costBreakdownData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={costBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {costBreakdownData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmtRs(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1.5">
                {costBreakdownData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-semibold text-gray-800">{fmtRs(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
              No cost data available
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Charts Row 2: Batch Yield ── */}
      {yieldChartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Batch Yield & Wastage (last 12 batches)</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={yieldChartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="batch" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" />
              <Tooltip content={<RsTooltip />} />
              <Legend />
              <Bar dataKey="Yield" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Wastage" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* ── Operations & Cash Flow ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Operations Metrics */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Operations Metrics</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Raw Purchased', value: `${fmt(operations.totalRawPurchased)} Kg`, icon: Package },
              { label: 'Finished Produced', value: `${fmt(operations.totalFinishedProduced)} Kg`, icon: Factory },
              { label: 'Raw Stock Used', value: `${fmt(operations.totalRawInput)} Kg`, icon: Activity },
              { label: 'Total Batches', value: operations.totalBatches || 0, icon: BarChart3 },
              { label: 'Total Wastage', value: `${fmt(operations.totalWastageKg)} Kg`, icon: AlertTriangle },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-gray-400" />
                  <p className="text-sm text-gray-600">{label}</p>
                </div>
                <p className="font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Cash Flow */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.75 }}
          className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Cash Flow</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Cash Received', value: fmtRs(cashFlow.cashReceived), cls: 'bg-green-50 border-green-200', icon: TrendingUp, iconCls: 'text-green-500' },
              { label: 'Digital Received', value: fmtRs(cashFlow.digitalReceived), cls: 'bg-blue-50 border-blue-200', icon: Activity, iconCls: 'text-blue-500' },
              { label: 'Total Received', value: fmtRs(cashFlow.totalReceived), cls: 'bg-primary-50 border-primary-200', icon: TrendingUp, iconCls: 'text-primary-500' },
              { label: 'Customer Outstanding', value: fmtRs(cashFlow.customerOutstanding), cls: 'bg-orange-50 border-orange-200', icon: AlertTriangle, iconCls: 'text-orange-500' },
              { label: 'Supplier Outstanding', value: fmtRs(cashFlow.supplierOutstanding), cls: 'bg-red-50 border-red-200', icon: TrendingDown, iconCls: 'text-red-500' },
            ].map(({ label, value, cls, icon: Icon, iconCls }) => (
              <div key={label} className={`flex items-center justify-between p-3 ${cls} rounded-xl border`}>
                <div>
                  <p className="text-sm text-gray-600">{label}</p>
                  <p className="text-lg font-bold text-gray-900">{value}</p>
                </div>
                <Icon className={`w-7 h-7 ${iconCls}`} />
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Top Performers ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Top Customers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Top Customers by Outstanding</h2>
          </div>
          {topCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-gray-500 font-medium pb-2">Customer</th>
                    <th className="text-right text-gray-500 font-medium pb-2">Sales</th>
                    <th className="text-right text-gray-500 font-medium pb-2">Paid</th>
                    <th className="text-right text-gray-500 font-medium pb-2">Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map((c, i) => (
                    <tr key={c.customerId || i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 font-medium text-gray-800">{c.customerName}</td>
                      <td className="py-2.5 text-right text-gray-600">{fmtRs(c.totalSales)}</td>
                      <td className="py-2.5 text-right text-green-600">{fmtRs(c.totalPaid)}</td>
                      <td className="py-2.5 text-right font-semibold text-orange-600">{fmtRs(c.totalOutstanding)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-6">No outstanding customers</p>
          )}
        </motion.div>

        {/* Top Suppliers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
          className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Package className="w-5 h-5 text-teal-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Top Suppliers by Volume</h2>
          </div>
          {topSuppliers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-gray-500 font-medium pb-2">Supplier</th>
                    <th className="text-right text-gray-500 font-medium pb-2">Quantity (Kg)</th>
                    <th className="text-right text-gray-500 font-medium pb-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {topSuppliers.map((s, i) => (
                    <tr key={s.name} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 font-medium text-gray-800">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 flex items-center justify-center bg-teal-100 text-teal-700 text-xs font-bold rounded-full">
                            {i + 1}
                          </span>
                          {s.name}
                        </div>
                      </td>
                      <td className="py-2.5 text-right text-gray-600">{fmt(s.quantity)} Kg</td>
                      <td className="py-2.5 text-right font-semibold text-teal-700">{fmtRs(s.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-6">No purchase data for this period</p>
          )}
        </motion.div>
      </div>

      {/* ── Cost Breakdown Detail ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-100 rounded-lg">
            <PieChartIcon className="w-5 h-5 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Cost Breakdown Detail</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Raw Purchase', key: 'rawPurchaseCost', cls: 'bg-purple-50 border-purple-200 text-purple-700' },
            { label: 'Job Work', key: 'jobWorkCost', cls: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
            { label: 'Worker Wages', key: 'workerWagesCost', cls: 'bg-pink-50 border-pink-200 text-pink-700' },
            { label: 'Other Expenses', key: 'expensesCost', cls: 'bg-amber-50 border-amber-200 text-amber-700' },
          ].map(({ label, key, cls }) => (
            <div key={key} className={`p-4 ${cls} rounded-xl border`}>
              <p className="text-sm text-gray-600 mb-1">{label}</p>
              <p className={`text-xl font-bold`}>{fmtRs(financial.breakdown?.[key])}</p>
            </div>
          ))}
        </div>
      </motion.div>

    </div>
  );
};

export default Analytics;
