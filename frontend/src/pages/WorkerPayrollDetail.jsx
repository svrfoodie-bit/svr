import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Award, Briefcase, CalendarClock, CheckCircle2, Clock, IndianRupee, Users, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { workerService } from '../services/workerService';
import { dailyWorkService } from '../services/dailyWorkService';
import { attendanceService } from '../services/attendanceService';
import { workerAdvanceService } from '../services/workerAdvanceService';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const pad2 = (n) => String(n).padStart(2, '0');

const monthBounds = (year, month) => {
  const startDate = `${year}-${pad2(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${pad2(month)}-${pad2(lastDay)}`;
  return { startDate, endDate };
};

const WorkerPayrollDetail = () => {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const now = new Date();

  const [mode, setMode] = useState('month'); // 'month' | 'date'
  const [year, setYear] = useState(parseInt(searchParams.get('year')) || now.getFullYear());
  const [month, setMonth] = useState(parseInt(searchParams.get('month')) || now.getMonth() + 1);
  const [singleDate, setSingleDate] = useState(now.toISOString().split('T')[0]);

  const [loading, setLoading] = useState(true);
  const [worker, setWorker] = useState(null);
  const [dailyWorks, setDailyWorks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [payroll, setPayroll] = useState(null);

  useEffect(() => {
    loadData();
  }, [workerId, mode, year, month, singleDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const dateFilter = mode === 'date'
        ? { date: singleDate }
        : monthBounds(year, month);

      const [workerData, workData, attendanceData, advanceData, payrollList] = await Promise.all([
        workerService.getById(workerId),
        dailyWorkService.getAll({ workerId, ...dateFilter }),
        attendanceService.getByWorker(
          workerId,
          mode === 'date' ? singleDate : dateFilter.startDate,
          mode === 'date' ? singleDate : dateFilter.endDate
        ),
        workerAdvanceService.getAll({ workerId, ...dateFilter }),
        attendanceService.getWorkerPayroll(workerId),
      ]);

      setWorker(workerData);
      setDailyWorks(workData);
      setAttendance(attendanceData);
      setAdvances(advanceData);
      setPayroll(
        mode === 'month'
          ? (payrollList.find((p) => p.payrollYear === year && p.payrollMonth === month) || null)
          : null
      );
    } catch (error) {
      toast.error('Failed to load worker details');
    } finally {
      setLoading(false);
    }
  };

  const totalKg = dailyWorks.reduce((sum, w) => sum + (parseFloat(w.completedQuantity ?? w.quantity) || 0), 0);
  const totalBasic = dailyWorks.reduce((sum, w) => sum + (parseFloat(w.baseWage) || 0), 0);
  const totalBonus = dailyWorks.reduce((sum, w) => sum + (parseFloat(w.bonusAmount) || 0), 0);
  const totalEarned = dailyWorks.reduce((sum, w) => sum + (parseFloat(w.totalPay) || 0), 0);
  const workDays = new Set(
    dailyWorks.filter((w) => (parseFloat(w.completedQuantity ?? w.quantity) || 0) > 0).map((w) => (w.workDate || w.date || '').slice(0, 10))
  ).size;

  const presentDays = attendance.filter((a) => a.status === 'Present').length;
  const halfDays = attendance.filter((a) => a.status === 'Half Day').length;
  const absentDays = attendance.filter((a) => a.status === 'Absent').length;
  const leaveDays = attendance.filter((a) => a.status === 'Leave').length;

  const totalAdvance = advances
    .filter((a) => a.status !== 'Settled' && a.status !== 'Cancelled')
    .reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);

  const formatDate = (d) => {
    if (!d) return '-';
    const parsed = new Date(d);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleDateString('en-IN');
  };

  const summaryCards = [
    { icon: Briefcase, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', label: 'Work Days', value: workDays },
    { icon: CheckCircle2, iconBg: 'bg-primary-100', iconColor: 'text-primary-600', label: 'Total KG', value: totalKg.toLocaleString('en-IN') },
    { icon: Award, iconBg: 'bg-green-100', iconColor: 'text-green-600', label: 'Bonus', value: `₹${totalBonus.toLocaleString('en-IN')}` },
    { icon: IndianRupee, iconBg: 'bg-purple-100', iconColor: 'text-purple-600', label: 'Total Earned', value: `₹${totalEarned.toLocaleString('en-IN')}` },
    { icon: Users, iconBg: 'bg-teal-100', iconColor: 'text-teal-600', label: 'Present / Half / Absent', value: `${presentDays} / ${halfDays} / ${absentDays}` },
    { icon: Wallet, iconBg: 'bg-orange-100', iconColor: 'text-orange-600', label: 'Advance Taken', value: `₹${totalAdvance.toLocaleString('en-IN')}` },
  ];

  return (
    <div className="p-4 md:p-6">
      <button
        onClick={() => navigate('/payroll')}
        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft size={16} />
        Back to Payroll
      </button>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !worker ? (
        <div className="text-center py-20 text-gray-500">Worker not found</div>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">{worker.name.charAt(0)}</span>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">{worker.name}</h1>
                <p className="text-sm text-gray-600">
                  {worker.areaOfWork || 'Worker'} · {worker.workerId}
                  {worker.status === 'Inactive' && <span className="ml-2 text-red-500 font-medium">Inactive</span>}
                </p>
              </div>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setMode('month')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${mode === 'month' ? 'bg-white shadow-soft text-primary-700' : 'text-gray-500'}`}
                >
                  Month
                </button>
                <button
                  onClick={() => setMode('date')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${mode === 'date' ? 'bg-white shadow-soft text-primary-700' : 'text-gray-500'}`}
                >
                  Date
                </button>
              </div>

              {mode === 'month' ? (
                <>
                  <select
                    value={month}
                    onChange={(e) => setMonth(parseInt(e.target.value))}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 shadow-soft"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 shadow-soft"
                  >
                    {[now.getFullYear() - 1, now.getFullYear()].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </>
              ) : (
                <input
                  type="date"
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 shadow-soft"
                />
              )}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
            {summaryCards.map((card, index) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white border border-gray-100 rounded-2xl p-4 shadow-soft"
              >
                <div className={`w-8 h-8 ${card.iconBg} rounded-lg flex items-center justify-center mb-2`}>
                  <card.icon size={16} className={card.iconColor} />
                </div>
                <p className="text-lg font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500">{card.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Payroll summary (month mode only) */}
          {mode === 'month' && (
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-5 mb-6">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
                Payroll — {MONTHS[month - 1]} {year}
              </h2>
              {payroll ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Basic Salary</p>
                    <p className="text-lg font-bold text-gray-900">₹{parseFloat(payroll.basicSalary).toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Advance Deducted</p>
                    <p className="text-lg font-bold text-orange-600">
                      {parseFloat(payroll.advanceDeduction) > 0 ? `-₹${parseFloat(payroll.advanceDeduction).toLocaleString('en-IN')}` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Net Salary</p>
                    <p className="text-lg font-bold text-primary-700">₹{parseFloat(payroll.netSalary).toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <span className={`inline-block mt-0.5 px-2 py-1 rounded-full text-xs font-semibold ${payroll.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {payroll.status}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Payroll not generated for this month yet — go to the Payroll page to generate it.</p>
              )}
            </div>
          )}

          {/* Daily Work */}
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden mb-6">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <Briefcase size={16} className="text-gray-500" />
              <h2 className="text-sm font-bold text-gray-700">Work Log</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Work Type</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Assigned</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Completed</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Rate</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Bonus</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Pay</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dailyWorks.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-400">No work logs in this period</td></tr>
                  ) : dailyWorks.map((w) => (
                    <tr key={w.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-600">{formatDate(w.workDate || w.date)}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{w.workType}</td>
                      <td className="px-4 py-2 text-right text-sm text-gray-700">{w.assignedQuantity ?? w.quantity}</td>
                      <td className="px-4 py-2 text-right text-sm text-green-700 font-semibold">{w.completedQuantity ?? w.quantity}</td>
                      <td className="px-4 py-2 text-right text-sm text-gray-600">₹{w.rate}</td>
                      <td className="px-4 py-2 text-right text-sm text-green-600">{parseFloat(w.bonusAmount || 0) > 0 ? `₹${parseFloat(w.bonusAmount).toLocaleString('en-IN')}` : '-'}</td>
                      <td className="px-4 py-2 text-right text-sm font-bold text-primary-700">₹{parseFloat(w.totalPay || 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2 text-center">
                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md border bg-gray-50 text-gray-600 border-gray-200">{w.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance */}
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                <CalendarClock size={16} className="text-gray-500" />
                <h2 className="text-sm font-bold text-gray-700">Attendance {leaveDays > 0 && <span className="text-gray-400 font-normal">({leaveDays} leave)</span>}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Hours</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">OT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {attendance.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-400">No attendance marked in this period</td></tr>
                    ) : attendance.map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-600">{formatDate(a.attendanceDate)}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border ${
                            a.status === 'Present' ? 'bg-green-50 text-green-700 border-green-200'
                              : a.status === 'Absent' ? 'bg-red-50 text-red-700 border-red-200'
                              : a.status === 'Half Day' ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>{a.status}</span>
                        </td>
                        <td className="px-4 py-2 text-right text-sm text-gray-700">{a.hoursWorked}</td>
                        <td className="px-4 py-2 text-right text-sm text-gray-700">{a.overtimeHours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Advances */}
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                <Clock size={16} className="text-gray-500" />
                <h2 className="text-sm font-bold text-gray-700">Advances Taken</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Reason</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Amount</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {advances.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-400">No advances in this period</td></tr>
                    ) : advances.map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-600">{formatDate(a.advanceDate)}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{a.reason || '-'}</td>
                        <td className="px-4 py-2 text-right text-sm font-semibold text-orange-600">₹{parseFloat(a.amount).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border ${a.status === 'Settled' ? 'bg-gray-50 text-gray-500 border-gray-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WorkerPayrollDetail;
