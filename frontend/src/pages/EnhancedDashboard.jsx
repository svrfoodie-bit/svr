import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Briefcase,
  Wallet,
  PieChart,
  BarChart3,
  Calendar,
  RefreshCw,
  Lightbulb,
  Zap,
  IndianRupee,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LineChart, Line, BarChart, Bar,
  PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { rawPurchaseService } from '../services/rawPurchaseService';
import { jobWorkService } from '../services/jobWorkService';
import { salesOrderService } from '../services/salesOrderService';
import { salesPaymentService } from '../services/salesPaymentService';
import { expenseService } from '../services/expenseService';
import { dashboardService } from '../services/dashboardService';
import { useAuthStore } from '../context/authStore';
import useCountUp from '../hooks/useCountUp';

// ── Helpers ────────────────────────────────────────────────────────────────────

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const fmt = (n) => Math.round(n).toLocaleString('en-IN');

// ── Animated KPI card (calls hook per card) ────────────────────────────────────

const KpiCard = ({ card, index }) => {
  const animated = useCountUp(card.rawValue, 1400);
  const displayValue = card.isCurrency
    ? `₹${animated.toLocaleString('en-IN')}`
    : animated.toLocaleString('en-IN');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-white rounded-2xl shadow-soft hover:shadow-md transition-shadow border border-gray-100 overflow-hidden group"
    >
      <div className={`h-1 w-full bg-gradient-to-r ${card.accent}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.accent} bg-opacity-10`}>
            <card.icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-1 text-xs font-medium">
            {card.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-green-500" />}
            {card.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
            <span className={
              card.trend === 'up' ? 'text-green-600' :
              card.trend === 'down' ? 'text-red-600' : 'text-gray-400'
            }>
              {card.change}
            </span>
          </div>
        </div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{card.title}</p>
        <p className="text-2xl font-bold text-gray-900 tabular-nums">{displayValue}</p>
        <p className="text-xs text-gray-400 mt-1">{card.description}</p>
      </div>
    </motion.div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

const EnhancedDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('MONTH');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const abortRef = useRef(null);

  const [dashboardData, setDashboardData] = useState({
    rawPurchases: [], jobWorks: [], salesOrders: [], salesPayments: [], expenses: [],
  });
  const [todayStats, setTodayStats] = useState(null);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0, totalExpenses: 0, netProfit: 0, profitMargin: 0,
    totalOutstanding: 0, totalOrders: 0, pendingJobWork: 0, activeCustomers: 0,
    revenueChange: null, expensesChange: null,
  });

  // ── Seconds-ago ticker ──────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      if (lastUpdated) setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  // ── Data fetch ──────────────────────────────────────────────────────────────
  const fetchDashboardData = useCallback(async (signal) => {
    setLoading(true);
    try {
      const filters = { timeRange };
      const [rawPurchases, jobWorks, salesOrders, salesPayments, expenses, todayData] = await Promise.all([
        rawPurchaseService.getAll(filters),
        jobWorkService.getAll(filters),
        salesOrderService.getAll(filters),
        salesPaymentService.getAll(filters),
        expenseService.getAll(filters),
        dashboardService.getTodayStats(),
      ]);
      if (signal?.aborted) return;
      setDashboardData({ rawPurchases, jobWorks, salesOrders, salesPayments, expenses });
      calculateMetrics({ rawPurchases, jobWorks, salesOrders, salesPayments, expenses });
      setTodayStats(todayData);
      setLastUpdated(new Date());
      setSecondsAgo(0);
    } catch (error) {
      if (error?.name === 'AbortError' || signal?.aborted) return;
      if (import.meta.env.DEV) console.error('Dashboard fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [timeRange]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    fetchDashboardData(abortRef.current.signal);
    return () => abortRef.current?.abort();
  }, [fetchDashboardData]);

  const calculateMetrics = (data) => {
    const now = new Date();
    let currentStart, prevStart, prevEnd;
    if (timeRange === 'WEEK') {
      const day = now.getDay();
      currentStart = new Date(now); currentStart.setDate(now.getDate() - day); currentStart.setHours(0, 0, 0, 0);
      prevEnd = new Date(currentStart); prevEnd.setMilliseconds(-1);
      prevStart = new Date(currentStart); prevStart.setDate(prevStart.getDate() - 7);
    } else if (timeRange === 'YEAR') {
      currentStart = new Date(now.getFullYear(), 0, 1);
      prevEnd = new Date(currentStart); prevEnd.setMilliseconds(-1);
      prevStart = new Date(now.getFullYear() - 1, 0, 1);
    } else {
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      prevEnd = new Date(currentStart); prevEnd.setMilliseconds(-1);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    }

    const inCurrent = (d) => { const x = new Date(d); return x >= currentStart && x <= now; };
    const inPrev    = (d) => { const x = new Date(d); return x >= prevStart && x <= prevEnd; };

    const totalRevenue     = data.salesOrders.reduce((s, o) => s + (parseFloat(o.totalAmount) || 0), 0);
    const totalCollected   = data.salesOrders.reduce((s, o) => s + (parseFloat(o.paidAmount) || 0), 0);
    const totalOutstanding = totalRevenue - totalCollected;

    const curRev  = data.salesOrders.filter(o => inCurrent(o.orderDate || o.created_at)).reduce((s, o) => s + (parseFloat(o.totalAmount) || 0), 0);
    const prevRev = data.salesOrders.filter(o => inPrev(o.orderDate || o.created_at)).reduce((s, o) => s + (parseFloat(o.totalAmount) || 0), 0);
    const revenueChange = prevRev > 0 ? (((curRev - prevRev) / prevRev) * 100).toFixed(1) : curRev > 0 ? '100.0' : null;

    const rawExp = data.rawPurchases.reduce((s, p) => s + (parseFloat(p.totalAmount) || 0), 0);
    const jobExp = data.jobWorks.reduce((s, j) => s + (parseFloat(j.totalCost) || 0), 0);
    const opExp  = data.expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    const totalExpenses = rawExp + jobExp + opExp;

    const curExp  = data.rawPurchases.filter(p => inCurrent(p.purchaseDate || p.date || p.created_at)).reduce((s, p) => s + (parseFloat(p.totalAmount) || 0), 0)
                  + data.expenses.filter(e => inCurrent(e.expenseDate || e.date || e.created_at)).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    const prevExp = data.rawPurchases.filter(p => inPrev(p.purchaseDate || p.date || p.created_at)).reduce((s, p) => s + (parseFloat(p.totalAmount) || 0), 0)
                  + data.expenses.filter(e => inPrev(e.expenseDate || e.date || e.created_at)).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    const expensesChange = prevExp > 0 ? (((curExp - prevExp) / prevExp) * 100).toFixed(1) : curExp > 0 ? '100.0' : null;

    const netProfit      = totalCollected - totalExpenses;
    const profitMargin   = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const totalOrders    = data.salesOrders.length;
    const pendingJobWork = data.jobWorks.filter(j => j.status === 'In Progress').length;
    const activeCustomers = new Set(data.salesOrders.map(o => o.customerId)).size;

    setMetrics({ totalRevenue, totalExpenses, netProfit, profitMargin, totalOutstanding, totalOrders, pendingJobWork, activeCustomers, revenueChange, expensesChange });
  };

  // ── Smart insights ──────────────────────────────────────────────────────────
  const getInsights = () => {
    const ins = [];
    if (todayStats?.sales?.count > 0) ins.push({ type: 'success', text: `${todayStats.sales.count} sale${todayStats.sales.count > 1 ? 's' : ''} today — ₹${fmt(todayStats.sales.amount)} collected` });
    if (metrics.totalOutstanding > 0) ins.push({ type: 'warning', text: `₹${fmt(metrics.totalOutstanding)} outstanding across ${metrics.activeCustomers} customer${metrics.activeCustomers !== 1 ? 's' : ''}` });
    if (metrics.profitMargin > 0) ins.push({ type: 'success', text: `Profit margin is ${metrics.profitMargin.toFixed(1)}% this ${timeRange.toLowerCase()}` });
    else if (metrics.profitMargin < 0) ins.push({ type: 'danger', text: `Negative margin — expenses exceed collections by ₹${fmt(Math.abs(metrics.netProfit))}` });
    if (metrics.pendingJobWork > 0) ins.push({ type: 'info', text: `${metrics.pendingJobWork} job work${metrics.pendingJobWork > 1 ? 's' : ''} pending — check processing status` });
    if (metrics.revenueChange !== null) {
      const ch = parseFloat(metrics.revenueChange);
      if (ch > 0) ins.push({ type: 'success', text: `Revenue is up ${ch}% compared to last period` });
      else if (ch < 0) ins.push({ type: 'warning', text: `Revenue is down ${Math.abs(ch)}% compared to last period` });
    }
    return ins.slice(0, 4);
  };

  const INSIGHT_STYLE = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    danger:  'bg-red-50 border-red-200 text-red-800',
    info:    'bg-blue-50 border-blue-200 text-blue-800',
  };

  // ── KPI card definitions ────────────────────────────────────────────────────
  const kpiCards = [
    {
      title: 'Total Revenue', rawValue: metrics.totalRevenue, isCurrency: true,
      change: metrics.revenueChange !== null ? `${parseFloat(metrics.revenueChange) >= 0 ? '+' : ''}${metrics.revenueChange}%` : '—',
      trend: metrics.revenueChange !== null ? (parseFloat(metrics.revenueChange) >= 0 ? 'up' : 'down') : 'neutral',
      icon: IndianRupee, accent: 'from-emerald-500 to-emerald-600', description: 'Total sales this period',
    },
    {
      title: 'Net Profit', rawValue: Math.abs(metrics.netProfit), isCurrency: true,
      change: `${metrics.profitMargin.toFixed(1)}% margin`,
      trend: metrics.netProfit >= 0 ? 'up' : 'down',
      icon: TrendingUp, accent: metrics.netProfit >= 0 ? 'from-blue-500 to-blue-600' : 'from-red-500 to-red-600',
      description: metrics.netProfit >= 0 ? 'Collected minus expenses' : 'Loss this period',
    },
    {
      title: 'Total Expenses', rawValue: metrics.totalExpenses, isCurrency: true,
      change: metrics.expensesChange !== null ? `${parseFloat(metrics.expensesChange) >= 0 ? '+' : ''}${metrics.expensesChange}%` : '—',
      trend: metrics.expensesChange !== null ? (parseFloat(metrics.expensesChange) <= 0 ? 'up' : 'down') : 'neutral',
      icon: Wallet, accent: 'from-orange-500 to-orange-600', description: 'Purchases + job work + ops',
    },
    {
      title: 'Outstanding', rawValue: metrics.totalOutstanding, isCurrency: true,
      change: metrics.totalOutstanding > 0 ? `${metrics.activeCustomers} customers` : 'All cleared',
      trend: metrics.totalOutstanding > 0 ? 'down' : 'up',
      icon: AlertTriangle, accent: 'from-rose-500 to-rose-600', description: 'Pending collections',
    },
    {
      title: 'Sales Orders', rawValue: metrics.totalOrders, isCurrency: false,
      change: `${metrics.activeCustomers} active customers`,
      trend: 'up',
      icon: ShoppingCart, accent: 'from-violet-500 to-violet-600', description: 'Orders this period',
    },
    {
      title: 'Pending Jobs', rawValue: metrics.pendingJobWork, isCurrency: false,
      change: metrics.pendingJobWork === 0 ? 'All done' : 'In progress',
      trend: metrics.pendingJobWork === 0 ? 'up' : 'neutral',
      icon: Briefcase, accent: 'from-amber-500 to-amber-600', description: 'Active job work',
    },
  ];

  // ── Chart data ──────────────────────────────────────────────────────────────
  const getRevenueVsExpensesData = () => {
    const map = {};
    dashboardData.salesOrders.forEach(o => {
      const m = new Date(o.orderDate).toLocaleDateString('en-US', { month: 'short' });
      if (!map[m]) map[m] = { month: m, revenue: 0, expenses: 0 };
      map[m].revenue += parseFloat(o.totalAmount) || 0;
    });
    dashboardData.rawPurchases.forEach(p => {
      const m = new Date(p.purchaseDate || p.date || p.created_at).toLocaleDateString('en-US', { month: 'short' });
      if (!map[m]) map[m] = { month: m, revenue: 0, expenses: 0 };
      map[m].expenses += parseFloat(p.totalAmount) || 0;
    });
    dashboardData.expenses.forEach(e => {
      const m = new Date(e.date).toLocaleDateString('en-US', { month: 'short' });
      if (!map[m]) map[m] = { month: m, revenue: 0, expenses: 0 };
      map[m].expenses += parseFloat(e.amount) || 0;
    });
    return Object.values(map);
  };

  const getPaymentModeData = () => {
    const dist = { CASH: 0, PHONEPE: 0, BANK: 0 };
    dashboardData.salesPayments.forEach((payment) => {
      const mode = payment.paymentMode === 'UPI'
        ? 'PHONEPE'
        : payment.paymentMode === 'Bank Transfer'
          ? 'BANK'
          : String(payment.paymentMode || '').toUpperCase();
      dist[mode] = (dist[mode] || 0) + (parseFloat(payment.amount) || 0);
    });
    return [
      { name: 'Cash', value: dist.CASH, color: '#10b981' },
      { name: 'PhonePe', value: dist.PHONEPE, color: '#8b5cf6' },
      { name: 'Bank', value: dist.BANK, color: '#3b82f6' },
    ];
  };

  const getExpenseBreakdown = () => [
    { name: 'Raw Purchase', amount: dashboardData.rawPurchases.reduce((s, p) => s + (parseFloat(p.totalAmount) || 0), 0) },
    { name: 'Job Work',     amount: dashboardData.jobWorks.reduce((s, j) => s + (parseFloat(j.totalCost) || 0), 0) },
    { name: 'Operating',   amount: dashboardData.expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0) },
  ];

  const quickActions = [
    { label: 'New Sale',     icon: ShoppingCart, color: 'from-blue-500 to-blue-600',   path: '/sales-orders/new' },
    { label: 'Raw Purchase', icon: Package,       color: 'from-emerald-500 to-emerald-600', path: '/raw-purchases/new' },
    { label: 'Add Expense',  icon: DollarSign,    color: 'from-rose-500 to-rose-600',   path: '/expenses/new' },
    { label: 'Job Work',     icon: Briefcase,     color: 'from-violet-500 to-violet-600', path: '/job-work/new' },
    { label: 'Payments',     icon: Wallet,        color: 'from-amber-500 to-amber-600', path: '/payments-management' },
    { label: 'Reports',      icon: BarChart3,     color: 'from-pink-500 to-pink-600',   path: '/standard-reports' },
  ];

  const insights = getInsights();

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4"
              style={{ borderWidth: 3 }}
            />
            <p className="text-gray-500 text-sm">Loading dashboard…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 bg-gray-50 min-h-screen">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Here's your business at a glance
            {lastUpdated && (
              <span className="ml-2 text-gray-400">
                · Updated {secondsAgo < 5 ? 'just now' : `${secondsAgo}s ago`}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white rounded-xl p-1 shadow-soft border border-gray-200">
            {['WEEK', 'MONTH', 'YEAR'].map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  timeRange === r
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => fetchDashboardData()}
            className="p-2 bg-white rounded-xl shadow-soft border border-gray-200 hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </motion.button>
        </div>
      </div>

      {/* ── Smart Insights strip ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2"
          >
            {insights.map((ins, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium ${INSIGHT_STYLE[ins.type]}`}
              >
                <Lightbulb className="w-4 h-4 flex-shrink-0 opacity-70" />
                <span>{ins.text}</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Today strip ──────────────────────────────────────────────────────── */}
      {todayStats && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-600 via-primary-600 to-accent-600 rounded-2xl p-4 text-white shadow-lg"
        >
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 opacity-70" />
            <span className="text-sm font-semibold opacity-90">
              Today — {new Date(todayStats.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <span className="ml-auto text-xs opacity-60 flex items-center gap-1"><Zap className="w-3 h-3" /> Live</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: 'Purchases',   count: todayStats.purchases.count,        amount: todayStats.purchases.amount,        path: '/raw-purchases' },
              { label: 'Sales',       count: todayStats.sales.count,             amount: todayStats.sales.amount,             path: '/sales-orders' },
              { label: 'Job Works',   count: todayStats.jobWorks.count,          amount: todayStats.jobWorks.amount,          path: '/job-work' },
              { label: 'Expenses',    count: todayStats.expenses.count,          amount: todayStats.expenses.amount,          path: '/expenses' },
              { label: 'Collected',   count: todayStats.paymentsReceived.count,  amount: todayStats.paymentsReceived.amount,  path: '/sales-payments' },
            ].map(({ label, count, amount, path }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="bg-white/15 hover:bg-white/25 transition-colors rounded-xl p-3 text-left backdrop-blur-sm"
              >
                <p className="text-xs opacity-75 mb-1">{label}</p>
                <p className="text-xl font-bold leading-none">{count}</p>
                <p className="text-xs opacity-85 mt-1">₹{fmt(amount)}</p>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── KPI Cards ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpiCards.map((card, i) => (
          <KpiCard key={card.title} card={card} index={i} />
        ))}
      </div>

      {/* ── Charts row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Revenue vs Expenses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-soft p-5 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-800">Revenue vs Expenses</h2>
              <p className="text-xs text-gray-400">Monthly comparison</p>
            </div>
            <BarChart3 className="w-5 h-5 text-gray-300" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={getRevenueVsExpensesData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: 12 }}
                formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, undefined]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} name="Revenue" />
              <Line type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} dot={false} name="Expenses" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Payment Mode Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-soft p-5 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-800">Payment Mode Split</h2>
              <p className="text-xs text-gray-400">Collection breakdown</p>
            </div>
            <PieChart className="w-5 h-5 text-gray-300" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <RechartsPie>
              <Pie
                data={getPaymentModeData()}
                cx="50%" cy="50%"
                outerRadius={90}
                labelLine={false}
                label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                dataKey="value"
              >
                {getPaymentModeData().map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 10 }}
                formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, undefined]}
              />
            </RechartsPie>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Expense Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl shadow-soft p-5 border border-gray-100"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-gray-800">Expense Breakdown</h2>
            <p className="text-xs text-gray-400">By category</p>
          </div>
          <Activity className="w-5 h-5 text-gray-300" />
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={getExpenseBreakdown()} barSize={40}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
            <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 10 }}
              formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Amount']}
            />
            <Bar dataKey="amount" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* ── Quick Actions ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="bg-white rounded-2xl shadow-soft p-5 border border-gray-100"
      >
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-primary-500" />
          <h2 className="text-sm font-bold text-gray-800">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {quickActions.map((a, i) => (
            <motion.button
              key={a.label}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.65 + i * 0.04 }}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate(a.path)}
              className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-transparent hover:shadow-md transition-all"
            >
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${a.color} shadow-sm`}>
                <a.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs font-semibold text-gray-600 group-hover:text-gray-900 text-center leading-tight">{a.label}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── Recent Sales + Alerts ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Sales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="bg-white rounded-2xl shadow-soft p-5 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-800">Recent Sales</h2>
            <button
              onClick={() => navigate('/sales-orders')}
              className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {dashboardData.salesOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <ShoppingCart className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No sales this period</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dashboardData.salesOrders.slice(0, 5).map((order) => (
                <div
                  key={order._id || order.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate(`/sales-orders/${order._id || order.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{order.orderNumber}</p>
                      <p className="text-xs text-gray-500">{order.customerName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">₹{fmt(order.totalAmount)}</p>
                    <p className="text-xs text-gray-400">{new Date(order.orderDate || order.created_at).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          className="bg-white rounded-2xl shadow-soft p-5 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-800">Alerts</h2>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="space-y-3">
            {metrics.totalOutstanding > 0 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/40">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-800 dark:text-red-300">Outstanding Payments</p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">₹{fmt(metrics.totalOutstanding)} pending from {metrics.activeCustomers} customers</p>
                </div>
                <button onClick={() => navigate('/payment-reminders')} className="text-xs text-red-600 dark:text-red-400 font-semibold hover:text-red-700 flex-shrink-0">
                  View →
                </button>
              </div>
            )}

            {metrics.pendingJobWork > 0 && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/40">
                <Clock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Pending Job Work</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{metrics.pendingJobWork} job{metrics.pendingJobWork > 1 ? 's' : ''} awaiting completion</p>
                </div>
                <button onClick={() => navigate('/job-work')} className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:text-amber-700 flex-shrink-0">
                  View →
                </button>
              </div>
            )}

            {metrics.netProfit > 0 && (
              <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/40">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Positive Cash Flow</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">₹{fmt(metrics.netProfit)} net profit · {metrics.profitMargin.toFixed(1)}% margin</p>
                </div>
              </div>
            )}

            {metrics.totalOutstanding === 0 && metrics.pendingJobWork === 0 && metrics.netProfit <= 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <CheckCircle className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">All systems clear</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

    </div>
  );
};

export default EnhancedDashboard;
