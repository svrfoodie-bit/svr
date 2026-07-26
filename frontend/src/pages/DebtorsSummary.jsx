import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, IndianRupee, AlertTriangle, Clock,
  TrendingDown, CheckCircle, ExternalLink, RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const fmt = (v) =>
  parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const AGING_META = {
  current:  { label: '0 – 30 Days',  color: 'green',  badge: 'bg-green-100 text-green-700',  bar: 'bg-green-500'  },
  '31-60':  { label: '31 – 60 Days', color: 'yellow', badge: 'bg-yellow-100 text-yellow-700', bar: 'bg-yellow-400' },
  '61-90':  { label: '61 – 90 Days', color: 'orange', badge: 'bg-orange-100 text-orange-700', bar: 'bg-orange-500' },
  '90+':    { label: '90+ Days',     color: 'red',    badge: 'bg-red-100 text-red-700',       bar: 'bg-red-500'    },
};

const DebtorsSummary = () => {
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [sort,    setSort]    = useState({ key: 'outstanding', dir: 'desc' });
  const [filter,  setFilter]  = useState('all');   // 'all' | aging bucket keys

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounting/debtors');
      setData(res);
    } catch {
      toast.error('Failed to load debtors summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading || !data) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">Loading debtors...</span>
        </div>
      </div>
    );
  }

  const { debtors, agingSummary } = data;

  // Sort
  const sorted = [...debtors].sort((a, b) => {
    const va = parseFloat(a[sort.key]) || 0;
    const vb = parseFloat(b[sort.key]) || 0;
    return sort.dir === 'desc' ? vb - va : va - vb;
  });

  // Filter by aging bucket
  const displayed = filter === 'all' ? sorted : sorted.filter(d => d.agingBucket === filter);

  const toggleSort = (key) =>
    setSort(p => ({ key, dir: p.key === key && p.dir === 'desc' ? 'asc' : 'desc' }));

  const totalCritical = (agingSummary.days61_90 || 0) + (agingSummary.days91plus || 0);

  return (
    <div className="p-4 md:p-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Debtors Summary</h1>
          <p className="text-sm text-gray-500 mt-1">Customers who owe money — aging analysis</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700 shadow-soft transition-all">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Critical alert */}
      {totalCritical > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">
            <strong>₹{fmt(totalCritical)}</strong> is overdue for more than 60 days.
            Immediate follow-up needed with {debtors.filter(d => d.agingBucket === '61-90' || d.agingBucket === '90+').length} customers.
          </p>
        </motion.div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard label="Total Debtors" value={`₹${fmt(agingSummary.total)}`} icon={<IndianRupee size={20} className="text-blue-400" />} color="blue" wide />
        <KpiCard label="0–30 Days" value={`₹${fmt(agingSummary.current)}`}   color="green"  dot />
        <KpiCard label="31–60 Days" value={`₹${fmt(agingSummary.days31_60)}`} color="yellow" dot />
        <KpiCard label="61–90 Days" value={`₹${fmt(agingSummary.days61_90)}`} color="orange" dot />
        <KpiCard label="90+ Days"   value={`₹${fmt(agingSummary.days91plus)}`} color="red"   dot />
      </div>

      {/* Aging bar chart */}
      {agingSummary.total > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-soft border border-gray-100 p-5 mb-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Aging Distribution</p>
          <div className="flex h-5 rounded-full overflow-hidden gap-0.5">
            {[
              { key: 'current',   val: agingSummary.current   },
              { key: '31-60',     val: agingSummary.days31_60 },
              { key: '61-90',     val: agingSummary.days61_90 },
              { key: '90+',       val: agingSummary.days91plus},
            ].filter(b => b.val > 0).map(b => {
              const meta = AGING_META[b.key];
              const pct  = ((b.val / agingSummary.total) * 100).toFixed(1);
              return (
                <div key={b.key} title={`${meta.label}: ₹${fmt(b.val)} (${pct}%)`}
                  className={`${meta.bar} transition-all cursor-pointer hover:opacity-80`}
                  style={{ width: `${pct}%` }}
                  onClick={() => setFilter(f => f === b.key ? 'all' : b.key)}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-4 mt-3">
            {Object.entries(AGING_META).map(([key, m]) => (
              <button key={key} onClick={() => setFilter(f => f === key ? 'all' : key)}
                className={`flex items-center gap-1.5 text-xs font-medium transition-all ${filter === key ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${m.bar}`} />
                <span className="text-gray-600">{m.label}</span>
                <span className="font-bold text-gray-800">
                  ₹{fmt(agingSummary[key === 'current' ? 'current' : key === '31-60' ? 'days31_60' : key === '61-90' ? 'days61_90' : 'days91plus'])}
                </span>
              </button>
            ))}
            {filter !== 'all' && (
              <button onClick={() => setFilter('all')} className="text-xs text-primary-600 font-semibold hover:underline ml-auto">
                Clear filter ×
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Table */}
      {debtors.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <CheckCircle size={44} className="mx-auto mb-3 text-green-300" />
          <p className="font-semibold text-gray-500">No outstanding debtors</p>
          <p className="text-sm mt-1">All customer accounts are settled</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              {filter === 'all' ? `All Debtors (${debtors.length})` : `${AGING_META[filter]?.label} (${displayed.length})`}
            </p>
            <p className="text-xs text-gray-400">Click headers to sort</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <Th label="Customer" />
                  <Th label="Type" />
                  <Th label="Total Billed"    sortKey="totalBilled"    sort={sort} onSort={toggleSort} right />
                  <Th label="Collected"       sortKey="totalCollected" sort={sort} onSort={toggleSort} right />
                  <Th label="Outstanding"     sortKey="outstanding"    sort={sort} onSort={toggleSort} right />
                  <Th label="Oldest Invoice"  sortKey="daysOutstanding" sort={sort} onSort={toggleSort} />
                  <Th label="Aging"           sortKey="daysOutstanding" sort={sort} onSort={toggleSort} />
                  <Th label="Ledger" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayed.map((d, i) => {
                  const meta = AGING_META[d.agingBucket] || AGING_META.current;
                  return (
                    <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.025 }} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{d.name}</p>
                        {d.phone && <p className="text-xs text-gray-400">{d.phone}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{d.type}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700 font-medium">₹{fmt(d.totalBilled)}</td>
                      <td className="px-4 py-3 text-right text-green-700 font-medium">₹{fmt(d.totalCollected)}</td>
                      <td className="px-4 py-3 text-right font-bold text-red-700">₹{fmt(d.outstanding)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-gray-400" />
                          <span className="text-xs text-gray-600">
                            {d.oldestInvoiceDate
                              ? new Date(d.oldestInvoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                              : '—'}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">{d.daysOutstanding} days ago</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${meta.badge}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate('/customer-ledger')}
                          className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          View <ExternalLink size={11} />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
              {/* Footer */}
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                    Total ({displayed.length} customers)
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800">
                    ₹{fmt(displayed.reduce((s, d) => s + d.totalBilled, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-green-700">
                    ₹{fmt(displayed.reduce((s, d) => s + d.totalCollected, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-red-700">
                    ₹{fmt(displayed.reduce((s, d) => s + d.outstanding, 0))}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          <strong>Aging</strong> is based on the oldest outstanding sales order date.
          Customers with full payment show no outstanding balance and are not listed here.
          Click <strong>View</strong> to open the customer's full ledger statement.
        </p>
      </motion.div>
    </div>
  );
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const KpiCard = ({ label, value, icon, color, wide, dot }) => {
  const colors = {
    blue:   'from-blue-50   to-blue-100   border-blue-200   text-blue-700',
    green:  'from-green-50  to-green-100  border-green-200  text-green-700',
    yellow: 'from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-700',
    orange: 'from-orange-50 to-orange-100 border-orange-200 text-orange-700',
    red:    'from-red-50    to-red-100    border-red-200    text-red-700',
  };
  const dotColors = {
    green: 'bg-green-500', yellow: 'bg-yellow-400',
    orange: 'bg-orange-500', red: 'bg-red-500', blue: 'bg-blue-500',
  };
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-4 ${wide ? 'col-span-2 lg:col-span-1' : ''}`}>
      <div className="flex items-center gap-2 mb-1">
        {dot && <span className={`w-2 h-2 rounded-full ${dotColors[color]}`} />}
        {icon}
        <p className="text-xs font-semibold text-gray-500">{label}</p>
      </div>
      <p className={`text-xl font-bold ${colors[color].split(' ').pop()}`}>{value}</p>
    </motion.div>
  );
};

const Th = ({ label, sortKey, sort, onSort, right }) => (
  <th
    onClick={sortKey ? () => onSort(sortKey) : undefined}
    className={`px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap select-none
      ${sortKey ? 'cursor-pointer hover:text-gray-700' : ''}
      ${right ? 'text-right' : 'text-left'}`}
  >
    {label}
    {sortKey && sort?.key === sortKey && (
      <span className="ml-1">{sort.dir === 'desc' ? '↓' : '↑'}</span>
    )}
  </th>
);

export default DebtorsSummary;
