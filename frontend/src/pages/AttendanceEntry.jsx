import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, CheckCircle, XCircle, Clock, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { attendanceService, ATTENDANCE_STATUS } from '../services/attendanceService';
import { get } from '../services/apiHelpers';

const STATUS_CONFIG = {
  Present: { color: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle size={14} className="text-green-600" /> },
  Absent: { color: 'bg-red-100 text-red-800 border-red-200', icon: <XCircle size={14} className="text-red-600" /> },
  'Half Day': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <Clock size={14} className="text-yellow-600" /> },
  Leave: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <Calendar size={14} className="text-blue-600" /> },
};

const AttendanceEntry = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [workers, setWorkers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAttendance();
  }, [selectedDate]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const records = await attendanceService.getByDate(selectedDate);
      // Build a map workerId -> record
      const map = {};
      records.forEach(r => {
        map[r.workerId] = {
          id: r.id,
          status: r.status,
          hoursWorked: r.hoursWorked,
          overtimeHours: r.overtimeHours,
          notes: r.notes || '',
          workerName: r.workerName,
          role: r.role,
          dailyWages: r.dailyWages,
        };
      });

      // If no records yet, fetch workers to pre-fill
      if (records.length === 0) {
        const workerList = await get('/workers', { status: 'Active' });
        workerList.forEach(w => {
          map[w.id] = {
            id: null,
            status: 'Present',
            hoursWorked: 8,
            overtimeHours: 0,
            notes: '',
            workerName: w.name,
            role: w.areaOfWork || w.role || '',
            dailyWages: w.dailyWages,
          };
        });
        setWorkers(workerList);
      } else {
        setWorkers(records.map(r => ({ id: r.workerId, name: r.workerName, role: r.role || r.areaOfWork || '' })));
      }
      setAttendance(map);
    } catch {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = (workerId, status) => {
    setAttendance(prev => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        status,
        hoursWorked: status === 'Half Day' ? 4 : status === 'Absent' ? 0 : 8,
      },
    }));
  };

  const updateField = (workerId, field, value) => {
    setAttendance(prev => ({
      ...prev,
      [workerId]: { ...prev[workerId], [field]: value },
    }));
  };

  const markAll = (status) => {
    const updated = {};
    Object.keys(attendance).forEach(wid => {
      updated[wid] = {
        ...attendance[wid],
        status,
        hoursWorked: status === 'Half Day' ? 4 : status === 'Absent' ? 0 : 8,
      };
    });
    setAttendance(updated);
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      const records = Object.entries(attendance).map(([workerId, data]) => ({
        workerId: parseInt(workerId),
        attendanceDate: selectedDate,
        status: data.status,
        hoursWorked: parseFloat(data.hoursWorked) || 0,
        overtimeHours: parseFloat(data.overtimeHours) || 0,
        notes: data.notes || null,
      }));
      await attendanceService.markBulk(records);
      toast.success(`Attendance saved for ${records.length} workers`);
    } catch {
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const workerIds = Object.keys(attendance);
  const presentCount = workerIds.filter(id => attendance[id].status === 'Present').length;
  const absentCount = workerIds.filter(id => attendance[id].status === 'Absent').length;
  const halfDayCount = workerIds.filter(id => attendance[id].status === 'Half Day').length;
  const leaveCount = workerIds.filter(id => attendance[id].status === 'Leave').length;

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Daily Attendance</h1>
          <p className="text-sm text-gray-600 mt-1">Mark worker attendance for each day</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all shadow-soft"
          />
          <button
            onClick={saveAttendance}
            disabled={saving || workerIds.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-soft"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Present', count: presentCount, color: 'bg-green-50 border-green-200 text-green-700' },
          { label: 'Absent', count: absentCount, color: 'bg-red-50 border-red-200 text-red-700' },
          { label: 'Half Day', count: halfDayCount, color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
          { label: 'Leave', count: leaveCount, color: 'bg-blue-50 border-blue-200 text-blue-700' },
        ].map(s => (
          <div key={s.label} className={`${s.color} border rounded-xl p-4 text-center`}>
            <p className="text-3xl font-bold">{s.count}</p>
            <p className="text-sm font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      {workerIds.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm text-gray-600 self-center">Mark All:</span>
          {ATTENDANCE_STATUS.map(status => (
            <button
              key={status}
              onClick={() => markAll(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${STATUS_CONFIG[status].color}`}
            >
              {status}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : workerIds.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Users size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No active workers found</p>
          <p className="text-sm mt-1">Add workers first in the Workers section</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600">Worker</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600">Hours</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600">OT Hours</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600">Daily Wage</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {workerIds.map((wid, idx) => {
                  const data = attendance[wid];
                  const cfg = STATUS_CONFIG[data.status] || STATUS_CONFIG.Present;
                  return (
                    <motion.tr
                      key={wid}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">{data.workerName}</p>
                        <p className="text-xs text-gray-500">{data.role}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {ATTENDANCE_STATUS.map(s => (
                            <button
                              key={s}
                              onClick={() => updateStatus(wid, s)}
                              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${data.status === s ? STATUS_CONFIG[s].color : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                            >
                              {data.status === s && cfg.icon}
                              {s}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <input
                          type="number"
                          min={0}
                          max={24}
                          step={0.5}
                          value={data.hoursWorked}
                          onChange={e => updateField(wid, 'hoursWorked', e.target.value)}
                          className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <input
                          type="number"
                          min={0}
                          max={12}
                          step={0.5}
                          value={data.overtimeHours}
                          onChange={e => updateField(wid, 'overtimeHours', e.target.value)}
                          className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                        />
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">
                        ₹{parseFloat(data.dailyWages || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4">
                        <input
                          type="text"
                          value={data.notes}
                          onChange={e => updateField(wid, 'notes', e.target.value)}
                          placeholder="Optional note..."
                          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                        />
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceEntry;
