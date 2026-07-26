import { get, post, put, del } from './apiHelpers';

export const ATTENDANCE_STATUS = ['Present', 'Absent', 'Half Day', 'Leave'];

export const attendanceService = {
  // Attendance
  getByDate: (date) => get('/attendance', { date }),
  getMonthlySummary: (year, month) => get('/attendance/monthly-summary', { year, month }),
  getByWorker: (workerId, startDate, endDate) => get(`/attendance/worker/${workerId}`, { startDate, endDate }),
  markAttendance: (data) => post('/attendance', data),
  markBulk: (records) => post('/attendance', { records }),
  deleteAttendance: (id) => del(`/attendance/${id}`),

  // Payroll
  getMonthlyPayroll: (year, month) => get('/payroll', { year, month }),
  getPayrollById: (id) => get(`/payroll/${id}`),
  getWorkerPayroll: (workerId) => get(`/payroll/worker/${workerId}`),
  generatePayroll: (workerId, year, month) => post('/payroll/generate', { workerId, year, month }),
  savePayroll: (data) => post('/payroll', data),
  markAsPaid: (id, paymentMode, paymentDate) => put(`/payroll/${id}/mark-paid`, { paymentMode, paymentDate }),
};
