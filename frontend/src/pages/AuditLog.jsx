import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Search, Filter, RefreshCw, ChevronLeft, ChevronRight,
  Plus, Pencil, Trash2, LogIn, LogOut, User, Package, ShoppingCart,
  Briefcase, Receipt, Users, Shield, BarChart3,
} from 'lucide-react';
import { auditLogService } from '../services/auditLogService';
import toast from 'react-hot-toast';

// ── Visual config ─────────────────────────────────────────────────────────────

const ACTION_CONFIG = {
  CREATE: { label: 'Created',   color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: Plus },
  UPDATE: { label: 'Updated',   color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',             icon: Pencil },
  DELETE: { label: 'Deleted',   color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',                 icon: Trash2 },
  LOGIN:  { label: 'Login',     color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',     icon: LogIn },
  LOGOUT: { label: 'Logout',    color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',               icon: LogOut },
};

const ENTITY_CONFIG = {
  customers:     { label: 'Customer',      icon: Users,         color: 'text-blue-500' },
  raw_purchases: { label: 'Raw Purchase',  icon: Package,       color: 'text-amber-500' },
  sales_orders:  { label: 'Sales Order',   icon: ShoppingCart,  color: 'text-emerald-500' },
  job_work:      { label: 'Job Work',      icon: Briefcase,     color: 'text-violet-500' },
  expenses:      { label: 'Expense',       icon: Receipt,       color: 'text-rose-500' },
  workers:       { label: 'Worker',        icon: User,          color: 'text-cyan-500' },
  auth:          { label: 'Auth',          icon: Shield,        color: 'text-gray-500' },
};

const fmt = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const timeAgo = (iso) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)   return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-soft">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value ?? '—'}</p>
    </div>
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AuditLog() {
  const [logs, setLogs]         = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  // Filters
  const [search, setSearch]     = useState('');
  const [actionF, setActionF]   = useState('');
  const [entityF, setEntityF]   = useState('');
  const [page, setPage]         = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (search)  params.search = search;
      if (actionF) params.action = actionF;
      if (entityF) params.entity = entityF;

      const [res, sumRes] = await Promise.all([
        auditLogService.getAll(params),
        summary ? Promise.resolve(null) : auditLogService.getSummary(),
      ]);

      setLogs(res.data);
      setPagination(res.pagination);
      if (sumRes) setSummary(sumRes.data);
    } catch {
      toast.error('Failed to load activity log');
    } finally {
      setLoading(false);
    }
  }, [page, search, actionF, entityF]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, actionF, entityF]);

  const refreshSummary = async () => {
    try {
      const res = await auditLogService.getSummary();
      setSummary(res.data);
    } catch { /* silent */ }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 min-h-screen bg-gray-50">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary-600" />
            Activity Log
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Every action taken in the system</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { fetchLogs(); refreshSummary(); }}
          className="p-2 bg-white border border-gray-200 rounded-xl shadow-soft hover:bg-gray-50 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      {/* Summary cards */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <StatCard label="Created (7d)"  value={summary.week.creates} icon={Plus}   color="bg-emerald-500" />
          <StatCard label="Updated (7d)"  value={summary.week.updates} icon={Pencil}  color="bg-blue-500" />
          <StatCard label="Deleted (7d)"  value={summary.week.deletes} icon={Trash2}  color="bg-rose-500" />
          <StatCard label="Total Actions" value={summary.week.total}   icon={BarChart3} color="bg-violet-500" />
        </motion.div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4 flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search user, entity…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
          />
        </div>

        {/* Action filter */}
        <select
          value={actionF}
          onChange={e => setActionF(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-gray-700"
        >
          <option value="">All Actions</option>
          {Object.entries(ACTION_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        {/* Entity filter */}
        <select
          value={entityF}
          onChange={e => setEntityF(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-gray-700"
        >
          <option value="">All Modules</option>
          {Object.entries(ENTITY_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <div className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
          <Filter className="w-3.5 h-3.5" />
          {pagination.total} entries
        </div>
      </div>

      {/* Log list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading activity…</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Activity className="w-12 h-12 opacity-20 mb-3" />
            <p className="text-sm font-medium">No activity found</p>
            <p className="text-xs mt-1">Try adjusting filters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            <AnimatePresence initial={false}>
              {logs.map((log, i) => {
                const action  = ACTION_CONFIG[log.action] || ACTION_CONFIG.UPDATE;
                const entity  = ENTITY_CONFIG[log.entity] || { label: log.entity, icon: Activity, color: 'text-gray-500' };
                const AIcon   = action.icon;
                const EIcon   = entity.icon;

                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    {/* Action badge */}
                    <div className="flex-shrink-0 mt-0.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${action.color}`}>
                        <AIcon className="w-3 h-3" />
                        {action.label}
                      </span>
                    </div>

                    {/* Entity + description */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <EIcon className={`w-4 h-4 flex-shrink-0 ${entity.color}`} />
                        <span className="text-sm font-semibold text-gray-800">{entity.label}</span>
                        {log.entityLabel && (
                          <span className="text-sm text-gray-600 truncate max-w-[200px]">— {log.entityLabel}</span>
                        )}
                      </div>
                      {log.description && (
                        <p className="text-xs text-gray-400 mt-0.5">{log.description}</p>
                      )}
                    </div>

                    {/* User */}
                    <div className="flex-shrink-0 text-right hidden sm:block">
                      <div className="flex items-center gap-1.5 justify-end">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {log.userName?.charAt(0) || '?'}
                        </div>
                        <span className="text-xs font-medium text-gray-700">{log.userName}</span>
                      </div>
                      {log.userRole && (
                        <span className="text-[10px] text-gray-400 mt-0.5 block">{log.userRole}</span>
                      )}
                    </div>

                    {/* Time */}
                    <div className="flex-shrink-0 text-right min-w-[72px]">
                      <p className="text-xs font-medium text-gray-500">{timeAgo(log.createdAt)}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 hidden sm:block">{fmt(log.createdAt)}</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">
              Page {pagination.page} of {pagination.pages} · {pagination.total} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
