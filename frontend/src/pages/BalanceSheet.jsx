import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Package,
  Users,
  Building2,
  PiggyBank,
  Wallet,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Landmark,
  Wifi,
  WifiOff,
  Clock,
  Factory,
  MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const AUTO_REFRESH_INTERVAL = 30; // seconds
const fmt = (val) => parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (val) => parseFloat(val || 0);

const BalanceSheet = () => {
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [data, setData]               = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [countdown, setCountdown]     = useState(AUTO_REFRESH_INTERVAL);
  const [autoOn, setAutoOn]           = useState(true);
  const intervalRef                   = useRef(null);
  const countdownRef                  = useRef(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await api.get('/balance-sheet');
      setData(res);
      setLastUpdated(new Date());
      setCountdown(AUTO_REFRESH_INTERVAL);
    } catch {
      if (!silent) toast.error('Failed to load balance sheet');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => { load(false); }, [load]);

  // Auto-refresh timer
  useEffect(() => {
    if (!autoOn) {
      clearInterval(intervalRef.current);
      clearInterval(countdownRef.current);
      return;
    }

    // Countdown tick every second
    countdownRef.current = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? AUTO_REFRESH_INTERVAL : prev - 1));
    }, 1000);

    // Silent refresh every N seconds
    intervalRef.current = setInterval(() => {
      load(true);
    }, AUTO_REFRESH_INTERVAL * 1000);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(countdownRef.current);
    };
  }, [autoOn, load]);

  if (loading || !data) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">Loading balance sheet...</span>
        </div>
      </div>
    );
  }

  const { assets, liabilities, equity, totalLiabilitiesAndEquity, pnl, asOf } = data;
  const isBalanced = Math.abs(num(assets.total) - num(totalLiabilitiesAndEquity)) < 1;
  const isProfit = num(equity.retainedEarnings) >= 0;

  const lastUpdatedStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <div className="p-4 md:p-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Balance Sheet</h1>
          <p className="text-sm text-gray-500 mt-1">Statement of Financial Position — as of {asOf}</p>
          {lastUpdatedStr && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <Clock size={12} className="text-gray-400" />
              <span className="text-xs text-gray-400">Last updated: {lastUpdatedStr}</span>
              {refreshing && (
                <span className="text-xs text-primary-500 font-medium animate-pulse">· Refreshing...</span>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">

          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoOn(p => !p)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
              autoOn
                ? 'bg-green-50 border-green-300 text-green-700'
                : 'bg-gray-100 border-gray-200 text-gray-500'
            }`}
          >
            {autoOn ? <Wifi size={14} /> : <WifiOff size={14} />}
            {autoOn ? (
              <span>Live · <span className="font-bold">{countdown}s</span></span>
            ) : (
              <span>Auto-refresh Off</span>
            )}
          </button>

          {/* Manual refresh */}
          <button
            onClick={() => load(false)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-soft text-sm font-medium text-gray-700 disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh Now
          </button>
        </div>
      </div>

      {/* Live update banner */}
      <AnimatePresence>
        {autoOn && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
              <p className="text-xs text-green-700 font-medium">
                Auto-refresh is <strong>ON</strong> — Balance Sheet updates every {AUTO_REFRESH_INTERVAL} seconds.
                Any sale, payment, or entry in the app reflects here automatically.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Balance Check Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border p-5 mb-6 flex items-center gap-4 ${
          isBalanced
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
            : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'
        }`}
      >
        {isBalanced
          ? <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
          : <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
        }
        <div className="flex-1">
          <p className={`font-bold text-lg ${isBalanced ? 'text-green-800' : 'text-red-800'}`}>
            {isBalanced ? 'Balance Sheet Balances' : 'Balance Sheet Out of Balance'}
          </p>
          <p className="text-sm text-gray-600 mt-0.5">
            Total Assets: <strong>₹{fmt(assets.total)}</strong>
            &nbsp;=&nbsp;
            Total Liabilities + Equity: <strong>₹{fmt(totalLiabilitiesAndEquity)}</strong>
          </p>
        </div>
      </motion.div>

      {/* Two-column layout: Assets | Liabilities + Equity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── ASSETS ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden"
        >
          <div className="px-6 py-4 bg-blue-600 flex items-center gap-3">
            <Scale className="w-5 h-5 text-blue-100" />
            <h2 className="text-lg font-bold text-white">Assets</h2>
          </div>

          <div className="p-6 space-y-0">

            {/* Current Assets */}
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Current Assets</p>

            <Row
              icon={<Users className="w-4 h-4 text-blue-600" />}
              bg="bg-blue-50"
              label="Debtors (Trade Receivables)"
              sublabel="Customers with outstanding balance"
              value={assets.debtors}
              color="text-blue-700"
            />

            <Row
              icon={<Package className="w-4 h-4 text-green-600" />}
              bg="bg-green-50"
              label="Finished Goods Stock"
              sublabel={`${fmt(assets.finishedGoodsQuantity)} kg × grade price`}
              value={assets.finishedGoodsStock}
              color="text-green-700"
            />

            <Row
              icon={<Landmark className="w-4 h-4 text-cyan-600" />}
              bg="bg-cyan-50"
              label="Cash & Bank"
              sublabel="Derived from capital + receipts − payments"
              value={assets.cashAndBank}
              color={num(assets.cashAndBank) >= 0 ? 'text-cyan-700' : 'text-red-600'}
            />

            <div className="my-4 border-t border-gray-100" />

            <div className="my-4 border-t border-gray-100" />

            {/* Fixed Assets */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Fixed Assets</p>
              <a href="/fixed-assets" className="text-[10px] text-primary-600 hover:underline font-semibold">Manage →</a>
            </div>

            {num(assets.machinery) > 0 && (
              <Row icon={<Factory className="w-4 h-4 text-blue-600" />} bg="bg-blue-50"
                label="Machinery & Equipment" sublabel="Active machinery at current value"
                value={assets.machinery} color="text-blue-700" />
            )}
            {num(assets.land) > 0 && (
              <Row icon={<MapPin className="w-4 h-4 text-green-600" />} bg="bg-green-50"
                label="Land" sublabel="Land holdings at current value"
                value={assets.land} color="text-green-700" />
            )}
            {num(assets.building) > 0 && (
              <Row icon={<Building2 className="w-4 h-4 text-indigo-600" />} bg="bg-indigo-50"
                label="Building" sublabel="Buildings at current value"
                value={assets.building} color="text-indigo-700" />
            )}
            {num(assets.otherFixed) > 0 && (
              <Row icon={<Package className="w-4 h-4 text-purple-600" />} bg="bg-purple-50"
                label="Other Fixed Assets" sublabel="Vehicles, furniture, equipment"
                value={assets.otherFixed} color="text-purple-700" />
            )}
            {num(assets.totalFixedAssets) === 0 && (
              <div className="flex items-center justify-between py-3 border-b border-gray-50">
                <p className="text-sm text-gray-400 italic">No fixed assets recorded yet</p>
                <a href="/fixed-assets" className="text-xs text-primary-600 hover:underline">Add assets →</a>
              </div>
            )}
            {num(assets.totalFixedAssets) > 0 && (
              <div className="flex items-center justify-between py-2 mt-1">
                <p className="text-xs font-semibold text-gray-500">Total Fixed Assets</p>
                <p className="text-sm font-bold text-gray-700">₹{fmt(assets.totalFixedAssets)}</p>
              </div>
            )}

            <div className="my-4 border-t border-gray-200" />

            {/* Total Assets */}
            <TotalRow label="Total Assets" value={assets.total} color="text-blue-700" />
          </div>
        </motion.div>

        {/* ── LIABILITIES + EQUITY ───────────────────────────── */}
        <div className="space-y-6">

          {/* Liabilities */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden"
          >
            <div className="px-6 py-4 bg-orange-500 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-orange-100" />
              <h2 className="text-lg font-bold text-white">Liabilities</h2>
            </div>

            <div className="p-6 space-y-0">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Current Liabilities</p>

              <Row
                icon={<Package className="w-4 h-4 text-orange-600" />}
                bg="bg-orange-50"
                label="Supplier (RAW) Dues"
                sublabel="Amount owed to raw suppliers"
                value={liabilities.vendorsPayable}
                color="text-orange-700"
              />

              <Row
                icon={<Wallet className="w-4 h-4 text-yellow-600" />}
                bg="bg-yellow-50"
                label="Salary Payable"
                sublabel="Unpaid worker payroll (Draft status)"
                value={liabilities.salaryPayable}
                color="text-yellow-700"
              />

              <div className="my-4 border-t border-gray-100" />

              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Long-term Liabilities</p>

              <Row
                icon={<Building2 className="w-4 h-4 text-red-600" />}
                bg="bg-red-50"
                label="Loans Outstanding"
                sublabel="Active loan principal remaining"
                value={liabilities.loansOutstanding}
                color="text-red-700"
              />

              <div className="my-4 border-t border-gray-200" />
              <TotalRow label="Total Liabilities" value={liabilities.total} color="text-orange-700" />
            </div>
          </motion.div>

          {/* Equity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden"
          >
            <div className="px-6 py-4 bg-indigo-600 flex items-center gap-3">
              <PiggyBank className="w-5 h-5 text-indigo-100" />
              <h2 className="text-lg font-bold text-white">Owner's Equity</h2>
            </div>

            <div className="p-6 space-y-0">
              <Row
                icon={<IndianRupee className="w-4 h-4 text-indigo-600" />}
                bg="bg-indigo-50"
                label="Capital Account (Capital A/c)"
                sublabel="Total owner capital invested"
                value={equity.capitalInvested}
                color="text-indigo-700"
              />

              <Row
                icon={isProfit
                  ? <TrendingUp className="w-4 h-4 text-green-600" />
                  : <TrendingDown className="w-4 h-4 text-red-600" />
                }
                bg={isProfit ? 'bg-green-50' : 'bg-red-50'}
                label="Retained Earnings (P&L)"
                sublabel="Accumulated profit / (loss)"
                value={equity.retainedEarnings}
                color={isProfit ? 'text-green-700' : 'text-red-600'}
              />

              <div className="my-4 border-t border-gray-200" />
              <TotalRow label="Total Equity" value={equity.total} color="text-indigo-700" />
            </div>
          </motion.div>

          {/* Grand Total: L + E */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-900 text-white rounded-2xl shadow-soft px-6 py-4 flex items-center justify-between"
          >
            <p className="font-bold text-base">Total Liabilities + Equity</p>
            <p className="text-2xl font-bold text-white">₹{fmt(totalLiabilitiesAndEquity)}</p>
          </motion.div>
        </div>
      </div>

      {/* Retained Earnings breakdown (P&L summary) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 bg-white rounded-2xl shadow-soft border border-gray-100 p-6"
      >
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-primary-600" />
          Retained Earnings Breakdown (All-time P&L)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <PnlCard label="Total Sales" value={pnl.totalSales} color="green" />
          <PnlCard label="Raw Purchase" value={pnl.rawPurchaseCost} color="purple" minus />
          <PnlCard label="Job Work" value={pnl.jobWorkCost} color="blue" minus />
          <PnlCard label="Worker Wages" value={pnl.workerWagesCost} color="orange" minus />
          <PnlCard label="Expenses" value={pnl.operatingExpenses} color="red" minus />
          <PnlCard label="Loan Interest" value={pnl.loanInterest} color="yellow" minus />
        </div>
      </motion.div>

      {/* Note about fixed assets */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3"
      >
        <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-900">How Cash & Bank is Calculated</p>
          <p className="text-sm text-blue-700 mt-0.5">
            Cash & Bank is a derived balancing figure: <strong>Total Liabilities + Equity − Debtors − Stock − Fixed Assets</strong>.
            Fixed Assets (Machinery, Land, Building) are now tracked — go to <a href="/fixed-assets" className="underline font-semibold">Fixed Assets</a> to add them.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

/* ── Small helpers ─────────────────────────────────────────────────────────── */

const Row = ({ icon, bg, label, sublabel, value, color }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
    <div className="flex items-center gap-3">
      <div className={`p-1.5 ${bg} rounded-lg flex-shrink-0`}>{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {sublabel && <p className="text-xs text-gray-400">{sublabel}</p>}
      </div>
    </div>
    <p className={`text-base font-bold ${color} ml-4 whitespace-nowrap`}>₹{fmt(value)}</p>
  </div>
);

const FixedAssetRow = ({ label, note }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-xs text-gray-400 italic">{note}</p>
    </div>
    <p className="text-sm text-gray-400 ml-4">—</p>
  </div>
);

const TotalRow = ({ label, value, color }) => (
  <div className="flex items-center justify-between pt-1">
    <p className={`font-bold text-base ${color}`}>{label}</p>
    <p className={`text-xl font-bold ${color}`}>₹{fmt(value)}</p>
  </div>
);

const PnlCard = ({ label, value, color, minus }) => {
  const colorMap = {
    green:  { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700'  },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
    blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700'   },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
    red:    { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700'    },
    yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className={`${c.bg} ${c.border} border rounded-xl p-3`}>
      <p className="text-[10px] font-semibold text-gray-500 mb-1">{minus ? '(−) ' : '(+) '}{label}</p>
      <p className={`text-sm font-bold ${c.text}`}>₹{fmt(value)}</p>
    </div>
  );
};

export default BalanceSheet;
