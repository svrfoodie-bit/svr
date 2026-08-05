import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, IndianRupee, CheckCircle, Clock, Download, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { attendanceService } from '../services/attendanceService';
import { dailyWorkService } from '../services/dailyWorkService';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const PayrollDashboard = () => {
  const navigate = useNavigate();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [summary, setSummary] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState({});
  const [paying, setPaying] = useState({});

  useEffect(() => {
    loadData();
  }, [year, month]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryData, payrollData] = await Promise.all([
        dailyWorkService.getMonthlySummary(year, month),
        attendanceService.getMonthlyPayroll(year, month),
      ]);
      setSummary(summaryData);
      setPayroll(payrollData);
    } catch {
      toast.error('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const generateAndSave = async (workerId) => {
    setGenerating(g => ({ ...g, [workerId]: true }));
    try {
      const generated = await attendanceService.generatePayroll(workerId, year, month);
      await attendanceService.savePayroll(generated);
      toast.success('Payroll generated');
      loadData();
    } catch {
      toast.error('Failed to generate payroll');
    } finally {
      setGenerating(g => ({ ...g, [workerId]: false }));
    }
  };

  const markPaid = async (id) => {
    setPaying(p => ({ ...p, [id]: true }));
    try {
      await attendanceService.markAsPaid(id, 'Cash', new Date().toISOString().split('T')[0]);
      toast.success('Marked as paid');
      loadData();
    } catch {
      toast.error('Failed to mark as paid');
    } finally {
      setPaying(p => ({ ...p, [id]: false }));
    }
  };

  // Build merged view: summary + payroll
  const mergedData = summary.map(s => {
    const p = payroll.find(p => p.workerId === s.workerId);
    return { ...s, payroll: p || null };
  });

  const totalNetSalary = payroll.reduce((sum, p) => sum + parseFloat(p.netSalary || 0), 0);
  const paidCount = payroll.filter(p => p.status === 'Paid').length;
  const draftCount = payroll.filter(p => p.status === 'Draft').length;

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Payroll Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Monthly salary calculation & payment tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={month}
            onChange={e => setMonth(parseInt(e.target.value))}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all shadow-soft"
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={e => setYear(parseInt(e.target.value))}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all shadow-soft"
          >
            {[now.getFullYear() - 1, now.getFullYear()].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-soft">
          <Users size={20} className="text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{summary.length}</p>
          <p className="text-sm text-gray-600">Total Workers</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-green-50 border border-green-200 rounded-2xl p-5 shadow-soft">
          <IndianRupee size={20} className="text-green-600 mb-2" />
          <p className="text-2xl font-bold text-green-700">₹{totalNetSalary.toLocaleString('en-IN')}</p>
          <p className="text-sm text-green-600">Total Payroll</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-blue-50 border border-blue-200 rounded-2xl p-5 shadow-soft">
          <CheckCircle size={20} className="text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-blue-700">{paidCount}</p>
          <p className="text-sm text-blue-600">Paid</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 shadow-soft">
          <Clock size={20} className="text-yellow-600 mb-2" />
          <p className="text-2xl font-bold text-yellow-700">{draftCount}</p>
          <p className="text-sm text-yellow-600">Pending Payment</p>
        </motion.div>
      </div>

      {/* Payroll Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600">Worker</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600">Work Days</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600">Total KG</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600">Bonus</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600">Basic</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600">Advance</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600">Net Salary</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600">Status</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mergedData.map((row, idx) => (
                  <motion.tr
                    key={row.workerId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.04 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <button
                        onClick={() => navigate(`/payroll/worker/${row.workerId}?year=${year}&month=${month}`)}
                        className="text-left hover:underline"
                      >
                        <p className="font-medium text-primary-700">{row.workerName}</p>
                        <p className="text-xs text-gray-500">{row.role}</p>
                      </button>
                    </td>
                    <td className="px-5 py-4 text-center text-sm font-semibold text-gray-700">{row.workDays || 0}</td>
                    <td className="px-5 py-4 text-center text-sm font-semibold text-gray-700">{parseFloat(row.totalQuantity || 0).toLocaleString('en-IN')}</td>
                    <td className="px-5 py-4 text-right text-sm text-green-600">
                      {row.payroll && parseFloat(row.payroll.bonus) > 0
                        ? `₹${parseFloat(row.payroll.bonus).toLocaleString('en-IN')}`
                        : '—'}
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-gray-700">
                      {row.payroll ? `₹${parseFloat(row.payroll.basicSalary).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-orange-600">
                      {row.payroll && parseFloat(row.payroll.advanceDeduction) > 0
                        ? `-₹${parseFloat(row.payroll.advanceDeduction).toLocaleString('en-IN')}`
                        : '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {row.payroll ? (
                        <span className="text-sm font-bold text-primary-700">
                          ₹{parseFloat(row.payroll.netSalary).toLocaleString('en-IN')}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {row.payroll ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.payroll.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {row.payroll.status}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Not Generated</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {!row.payroll ? (
                        <button
                          onClick={() => generateAndSave(row.workerId)}
                          disabled={generating[row.workerId]}
                          className="flex items-center gap-1 mx-auto px-3 py-1.5 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                        >
                          <RefreshCw size={12} className={generating[row.workerId] ? 'animate-spin' : ''} />
                          Generate
                        </button>
                      ) : row.payroll.status === 'Draft' ? (
                        <div className="flex items-center gap-2 justify-center">
                          <button
                            onClick={() => generateAndSave(row.workerId)}
                            disabled={generating[row.workerId]}
                            title="Recalculate from latest work log"
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                          >
                            <RefreshCw size={12} className={generating[row.workerId] ? 'animate-spin' : ''} />
                          </button>
                          <button
                            onClick={() => markPaid(row.payroll.id)}
                            disabled={paying[row.payroll.id]}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            <CheckCircle size={12} />
                            {paying[row.payroll.id] ? 'Saving...' : 'Mark Paid'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-green-600 flex items-center gap-1 justify-center">
                          <CheckCircle size={12} /> Paid
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
              {payroll.length > 0 && (
                <tfoot>
                  <tr className="bg-primary-50 font-semibold">
                    <td colSpan={6} className="px-5 py-3 text-sm text-gray-700">Total Payroll — {MONTHS[month - 1]} {year}</td>
                    <td className="px-5 py-3 text-right text-sm text-primary-700">
                      ₹{totalNetSalary.toLocaleString('en-IN')}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollDashboard;
