import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Plus, Edit, Users, Award, DollarSign, Clock, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { dailyWorkService, WORK_TYPES } from '../services/dailyWorkService';
import { workerService } from '../services/workerService';

const DailyWorkList = () => {
  const navigate = useNavigate();
  const [dailyWorks, setDailyWorks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    timeRange: 'MONTH',
    workerId: '',
    workType: '',
    status: '',
    date: '',
  });
  const [metrics, setMetrics] = useState({
    totalLogs: 0,
    totalQuantity: 0,
    totalAssignedQuantity: 0,
    totalPendingQuantity: 0,
    totalBaseWage: 0,
    totalBonus: 0,
    totalPay: 0,
    uniqueWorkers: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
  });

  useEffect(() => {
    loadWorkers();
  }, []);

  useEffect(() => {
    loadDailyWorks();
    loadMetrics();
  }, [filters]);

  const loadWorkers = async () => {
    try {
      const data = await workerService.getActive();
      setWorkers(data);
    } catch (error) {
    }
  };

  const loadDailyWorks = async () => {
    setLoading(true);
    try {
      const data = await dailyWorkService.getAll(filters);
      setDailyWorks(data);
    } catch (error) {
      toast.error('Failed to load daily works');
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const data = await dailyWorkService.getSummaryMetrics(filters);
      setMetrics(data);
    } catch (error) {
    }
  };

  const getWorkTypeColor = (bonusEligible) => {
    return bonusEligible
      ? 'bg-green-100 text-green-700 border-green-200'
      : 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusMeta = (status) => {
    const normalizedStatus = status || 'In Progress';
    const statusMap = {
      Pending: {
        label: 'Pending',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
      },
      'In Progress': {
        label: 'In Progress',
        className: 'bg-blue-50 text-blue-700 border-blue-200',
      },
      Completed: {
        label: 'Completed',
        className: 'bg-green-50 text-green-700 border-green-200',
      },
    };
    return statusMap[normalizedStatus] || statusMap['In Progress'];
  };

  const formatWorkDate = (work) => {
    const rawDate = work.workDate || work.date;
    if (!rawDate) return '-';

    const parsedDate = new Date(rawDate);
    if (Number.isNaN(parsedDate.getTime())) return '-';

    return parsedDate.toLocaleDateString('en-IN');
  };

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const getDayBadge = (work) => {
    const rawDate = work.workDate || work.date;
    if (!rawDate) return null;
    const parsedDate = new Date(rawDate);
    if (Number.isNaN(parsedDate.getTime())) return null;

    const today = new Date();
    if (isSameDay(parsedDate, today)) return 'Today';

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (isSameDay(parsedDate, yesterday)) return 'Yesterday';

    return null;
  };

  const renderRow = (work, index) => {
    const dayBadge = getDayBadge(work);
    return (
      <motion.tr
        key={work.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className={`transition-colors ${
          dayBadge === 'Today'
            ? 'bg-primary-50/50 border-l-2 border-primary-400 hover:bg-primary-50'
            : 'hover:bg-gray-50'
        }`}
      >
        <td className="px-3 py-2 text-gray-600">
          <div className="flex items-center gap-1.5">
            <span>{formatWorkDate(work)}</span>
            {dayBadge === 'Yesterday' && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-gray-100 text-gray-500">
                Yesterday
              </span>
            )}
          </div>
        </td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-[10px]">
                {work.workerName.charAt(0)}
              </span>
            </div>
            <p className="font-semibold text-gray-900">{work.workerName}</p>
          </div>
        </td>
        <td className="px-3 py-2">
          <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded-md border ${getWorkTypeColor(work.bonusEligible)}`}>
            {work.workType}
            {work.bonusEligible && <Award className="inline-block w-3 h-3 ml-1" />}
          </span>
        </td>
        <td className="px-3 py-2">
          <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded-md border ${getStatusMeta(work.status).className}`}>
            {getStatusMeta(work.status).label}
          </span>
        </td>
        <td className="px-3 py-2 text-right font-semibold text-gray-900">
          {work.assignedQuantity ?? work.quantity}
        </td>
        <td className="px-3 py-2 text-right font-semibold text-green-700">
          {work.completedQuantity ?? work.quantity}
        </td>
        <td className="px-3 py-2 text-right font-semibold text-amber-700">
          {work.pendingQuantity ?? 0}
        </td>
        <td className="px-3 py-2 text-right text-gray-600">₹{work.rate}</td>
        <td className="px-3 py-2 text-right font-semibold text-gray-900">
          ₹{(work.baseWage ?? 0).toLocaleString('en-IN')}
        </td>
        <td className="px-3 py-2 text-right font-semibold text-green-600">
          {!work.bonusEligible ? (
            <span className="text-[11px] font-normal text-gray-400">Bonus not eligible</span>
          ) : (work.bonusAmount ?? 0) > 0 ? (
            `₹${(work.bonusAmount ?? 0).toLocaleString('en-IN')}`
          ) : (
            '-'
          )}
        </td>
        <td className="px-3 py-2 text-right font-bold text-primary-600">
          ₹{(work.totalPay ?? 0).toLocaleString('en-IN')}
        </td>
        <td className="px-3 py-2">
          <div className="flex items-center justify-center gap-1">
            {work.status !== 'Completed' ? (
              <button
                onClick={() => navigate(`/daily-work/edit/${work.id}`)}
                className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                title="Record Collected Weight"
              >
                <CheckCircle2 size={16} />
              </button>
            ) : (
              <button
                onClick={() => navigate(`/daily-work/edit/${work.id}`)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                title="Edit Work Log"
              >
                <Edit size={16} />
              </button>
            )}
          </div>
        </td>
      </motion.tr>
    );
  };

  const renderSectionRow = (label, count, dotClass) => (
    <tr className="bg-gray-50/80">
      <td colSpan="12" className="px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
          <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">{label}</span>
          <span className="text-[11px] text-gray-400">({count})</span>
        </div>
      </td>
    </tr>
  );

  const todayWorks = dailyWorks.filter((work) => getDayBadge(work) === 'Today');
  const previousWorks = dailyWorks.filter((work) => getDayBadge(work) !== 'Today');

  const metricCards = [
    { icon: Users, iconBg: 'bg-primary-100', iconColor: 'text-primary-600', label: 'Active Workers', value: metrics.uniqueWorkers },
    { icon: ClipboardList, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', label: 'Completed KG', value: `${metrics.totalQuantity ?? 0} KG` },
    { icon: Award, iconBg: 'bg-green-100', iconColor: 'text-green-600', label: 'Total Bonus', value: `₹${(metrics.totalBonus ?? 0).toLocaleString('en-IN')}` },
    { icon: DollarSign, iconBg: 'bg-purple-100', iconColor: 'text-purple-600', label: 'Total Pay', value: `₹${(metrics.totalPay ?? 0).toLocaleString('en-IN')}` },
    {
      icon: Clock,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      label: 'Pending Tasks',
      value: (metrics.pendingTasks ?? 0) + (metrics.inProgressTasks ?? 0),
      sub: `${metrics.totalPendingQuantity ?? 0} KG left`,
    },
    { icon: CheckCircle2, iconBg: 'bg-green-100', iconColor: 'text-green-600', label: 'Completed', value: metrics.completedTasks ?? 0 },
  ];

  return (
    <div className="p-3 md:p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Daily Work Log</h1>
          <p className="text-xs text-gray-600 mt-0.5">Track worker daily activities and wages</p>
        </div>
        <button
          onClick={() => navigate('/daily-work/new')}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 font-semibold text-sm shadow-soft transition-all"
        >
          <Plus size={16} />
          <span>Add Work Log</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 mb-4">
        {metricCards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-lg p-2.5 shadow-soft border border-gray-100"
          >
            <div className="flex items-center gap-2">
              <div className={`p-1.5 ${card.iconBg} rounded-md flex-shrink-0`}>
                <card.icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-gray-500 leading-tight truncate">{card.label}</p>
                <p className="text-base font-bold text-gray-900 leading-tight">{card.value}</p>
                {card.sub && <p className="text-[11px] text-gray-400 leading-tight">{card.sub}</p>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-3 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
          <select
            value={filters.timeRange}
            onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
            className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          >
            <option value="DAY">Today</option>
            <option value="WEEK">This Week</option>
            <option value="MONTH">This Month</option>
            <option value="">All Time</option>
          </select>

          <select
            value={filters.workerId}
            onChange={(e) => setFilters(prev => ({ ...prev, workerId: e.target.value }))}
            className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          >
            <option value="">All Workers</option>
            {workers.map(worker => (
              <option key={worker.id} value={worker.id}>{worker.name}</option>
            ))}
          </select>

          <select
            value={filters.workType}
            onChange={(e) => setFilters(prev => ({ ...prev, workType: e.target.value }))}
            className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          >
            <option value="">All Work Types</option>
            {Object.keys(WORK_TYPES).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value, timeRange: '' }))}
            className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          />
        </div>
      </div>

      {/* Daily Works Table */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="overflow-auto max-h-[70vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Worker</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Work Type</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Assigned</th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Completed</th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Pending</th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Rate/KG</th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Base Wage</th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Bonus</th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Total Pay</th>
                <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="12" className="px-4 py-6 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                      <span className="ml-2 text-sm">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : dailyWorks.length === 0 ? (
                <tr>
                  <td colSpan="12" className="px-4 py-6 text-center text-sm text-gray-500">
                    No work logs found
                  </td>
                </tr>
              ) : (
                <>
                  {renderSectionRow('Today', todayWorks.length, 'bg-primary-500')}
                  {todayWorks.length === 0 ? (
                    <tr>
                      <td colSpan="12" className="px-4 py-4 text-center text-xs text-gray-400">
                        No work logs recorded for today yet
                      </td>
                    </tr>
                  ) : (
                    todayWorks.map((work, index) => renderRow(work, index))
                  )}

                  {renderSectionRow('Previous', previousWorks.length, 'bg-gray-400')}
                  {previousWorks.length === 0 ? (
                    <tr>
                      <td colSpan="12" className="px-4 py-4 text-center text-xs text-gray-400">
                        No previous work logs found
                      </td>
                    </tr>
                  ) : (
                    previousWorks.map((work, index) => renderRow(work, index))
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Note */}
      {!loading && dailyWorks.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3"
        >
          <div className="flex items-start gap-2">
            <Award className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-blue-900 mb-0.5">Bonus Entry:</p>
              <p className="text-xs text-blue-700">
                Bonus for daily work logs is now calculated from the entered bonus per KG on bonus-eligible work types
                (Roasting, Steaming, Shelling, Peeling, Grading).
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DailyWorkList;
