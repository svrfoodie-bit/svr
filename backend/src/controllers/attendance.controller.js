const Attendance = require('../models/Attendance.model');
const Payroll = require('../models/Payroll.model');

Attendance.createTable().catch(console.error);
Payroll.createTable().catch(console.error);

class AttendanceController {
  // ---- ATTENDANCE ----

  async getByDate(req, res, next) {
    try {
      const date = req.query.date || new Date().toISOString().split('T')[0];
      const records = await Attendance.getByDate(date);
      res.json({ success: true, data: records });
    } catch (error) {
      next(error);
    }
  }

  async getByWorker(req, res, next) {
    try {
      const { workerId } = req.params;
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'startDate and endDate are required' });
      }
      const records = await Attendance.getByWorker(workerId, startDate, endDate);
      res.json({ success: true, data: records });
    } catch (error) {
      next(error);
    }
  }

  async getMonthlySummary(req, res, next) {
    try {
      const year = parseInt(req.query.year) || new Date().getFullYear();
      const month = parseInt(req.query.month) || new Date().getMonth() + 1;
      const summary = await Attendance.getMonthlySummary(year, month);
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }

  async markAttendance(req, res, next) {
    try {
      // Accepts single or bulk
      const { records } = req.body;
      if (Array.isArray(records)) {
        await Attendance.bulkUpsert(records.map(r => ({ ...r, createdBy: req.user?.id || 1 })));
        res.json({ success: true, message: `${records.length} attendance records saved` });
      } else {
        await Attendance.upsert({ ...req.body, createdBy: req.user?.id || 1 });
        res.json({ success: true, message: 'Attendance marked' });
      }
    } catch (error) {
      next(error);
    }
  }

  async deleteAttendance(req, res, next) {
    try {
      const success = await Attendance.delete(req.params.id);
      if (!success) return res.status(404).json({ success: false, message: 'Record not found' });
      res.json({ success: true, message: 'Attendance record deleted' });
    } catch (error) {
      next(error);
    }
  }

  // ---- PAYROLL ----

  async generatePayroll(req, res, next) {
    try {
      const { workerId, year, month } = req.body;
      if (!workerId || !year || !month) {
        return res.status(400).json({ success: false, message: 'workerId, year, month are required' });
      }
      const payrollData = await Payroll.generate(workerId, parseInt(year), parseInt(month));
      if (!payrollData) {
        return res.status(404).json({ success: false, message: 'Worker not found or no attendance data' });
      }
      res.json({ success: true, data: payrollData });
    } catch (error) {
      next(error);
    }
  }

  async savePayroll(req, res, next) {
    try {
      await Payroll.save({ ...req.body, createdBy: req.user?.id || 1 });
      res.json({ success: true, message: 'Payroll saved' });
    } catch (error) {
      next(error);
    }
  }

  async getMonthlyPayroll(req, res, next) {
    try {
      const year = parseInt(req.query.year) || new Date().getFullYear();
      const month = parseInt(req.query.month) || new Date().getMonth() + 1;
      const payroll = await Payroll.getMonthlyPayroll(year, month);
      res.json({ success: true, data: payroll });
    } catch (error) {
      next(error);
    }
  }

  async getWorkerPayroll(req, res, next) {
    try {
      const payroll = await Payroll.getByWorker(req.params.workerId);
      res.json({ success: true, data: payroll });
    } catch (error) {
      next(error);
    }
  }

  async markAsPaid(req, res, next) {
    try {
      const { paymentMode, paymentDate } = req.body;
      const success = await Payroll.markAsPaid(req.params.id, paymentMode || 'Cash', paymentDate || new Date().toISOString().split('T')[0]);
      if (!success) return res.status(404).json({ success: false, message: 'Payroll record not found' });
      const payroll = await Payroll.getById(req.params.id);
      res.json({ success: true, message: 'Payroll marked as paid', data: payroll });
    } catch (error) {
      next(error);
    }
  }

  async getPayrollById(req, res, next) {
    try {
      const payroll = await Payroll.getById(req.params.id);
      if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found' });
      res.json({ success: true, data: payroll });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AttendanceController();
