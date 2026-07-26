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

  const handleMarkCompleted = async (work) => {
    try {
      const assignedQuantity = parseFloat(work.assignedQuantity ?? work.quantity ?? 0) || 0;
      await dailyWorkService.update(work.id, {
        assignedQuantity,
        quantity: assignedQuantity,
        status: 'Completed',
      });
      toast.success('Task marked as completed');
      loadDailyWorks();
      loadMetrics();
    } catch (error) {
      toast.error('Failed to update task status');
    }
  };

  const formatWorkDate = (work) => {
    const rawDate = work.workDate || work.date;
    if (!rawDate) return '-';

    const parsedDate = new Date(rawDate);
    if (Number.isNaN(parsedDate.getTime())) return '-';

    return parsedDate.toLocaleDateString('en-IN');
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Daily Work Log</h1>
          <p className="text-sm text-gray-600 mt-1">Track worker daily activities and wages</p>
        </div>
        <button
          onClick={() => navigate('/daily-work/new')}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 font-semibold shadow-soft transition-all"
        >
          <Plus size={20} />
          <span>Add Work Log</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-4 shadow-soft border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Active Workers</p>
              <p className="text-xl font-bold text-gray-900">{metrics.uniqueWorkers}</p>
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
              <ClipboardList className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Completed KG</p>
              <p className="text-xl font-bold text-gray-900">{metrics.totalQuantity ?? 0} KG</p>
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
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Bonus</p>
              <p className="text-xl font-bold text-gray-900">₹{(metrics.totalBonus ?? 0).toLocaleString('en-IN')}</p>
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
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Pay</p>
              <p className="text-xl font-bold text-gray-900">₹{(metrics.totalPay ?? 0).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-4 shadow-soft border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Pending Tasks</p>
              <p className="text-xl font-bold text-gray-900">
                {(metrics.pendingTasks ?? 0) + (metrics.inProgressTasks ?? 0)}
              </p>
              <p className="text-xs text-gray-500">{metrics.totalPendingQuantity ?? 0} KG left</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-4 shadow-soft border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Completed</p>
              <p className="text-xl font-bold text-gray-900">{metrics.completedTasks ?? 0}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Time Range Filter */}
          <select
            value={filters.timeRange}
            onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          >
            <option value="DAY">Today</option>
            <option value="WEEK">This Week</option>
            <option value="MONTH">This Month</option>
            <option value="">All Time</option>
          </select>

          {/* Worker Filter */}
          <select
            value={filters.workerId}
            onChange={(e) => setFilters(prev => ({ ...prev, workerId: e.target.value }))}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          >
            <option value="">All Workers</option>
            {workers.map(worker => (
              <option key={worker.id} value={worker.id}>{worker.name}</option>
            ))}
          </select>

          {/* Work Type Filter */}
          <select
            value={filters.workType}
            onChange={(e) => setFilters(prev => ({ ...prev, workType: e.target.value }))}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          >
            <option value="">All Work Types</option>
            {Object.keys(WORK_TYPES).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Specific Date Filter */}
          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value, timeRange: '' }))}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          />
        </div>
      </div>

      {/* Daily Works Table */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Worker</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Work Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Assigned</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Completed</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Pending</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Rate/KG</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Base Wage</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Bonus</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Pay</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="12" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                      <span className="ml-2">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : dailyWorks.length === 0 ? (
                <tr>
                  <td colSpan="12" className="px-6 py-8 text-center text-gray-500">
                    No work logs found
                  </td>
                </tr>
              ) : (
                dailyWorks.map((work, index) => (
                  <motion.tr
                    key={work.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatWorkDate(work)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-xs">
                            {work.workerName.charAt(0)}
                          </span>
                        </div>
                        <p className="font-semibold text-gray-900">{work.workerName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-lg border ${getWorkTypeColor(work.bonusEligible)}`}>
                        {work.workType}
                        {work.bonusEligible && <Award className="inline-block w-3 h-3 ml-1" />}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-lg border ${getStatusMeta(work.status).className}`}>
                        {getStatusMeta(work.status).label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                      {work.assignedQuantity ?? work.quantity}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-green-700">
                      {work.completedQuantity ?? work.quantity}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-amber-700">
                      {work.pendingQuantity ?? 0}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600">₹{work.rate}</td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                      ₹{(work.baseWage ?? 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-green-600">
                      {(work.bonusAmount ?? 0) > 0 ? `₹${(work.bonusAmount ?? 0).toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-primary-600">
                      ₹{(work.totalPay ?? 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        {work.status !== 'Completed' && (
                          <button
                            onClick={() => handleMarkCompleted(work)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Mark Completed"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/daily-work/edit/${work.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Work Log"
                        >
                          <Edit size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
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
          transition={{ delay: 0.3 }}
          className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <Award className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">Bonus Entry:</p>
              <p className="text-sm text-blue-700">
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

