const { promisePool } = require('../config/database');

class Payroll {
  static async createTable() {
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS payroll (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workerId INT NOT NULL,
        payrollMonth INT NOT NULL COMMENT '1-12',
        payrollYear INT NOT NULL,
        presentDays INT DEFAULT 0,
        halfDays INT DEFAULT 0,
        absentDays INT DEFAULT 0,
        overtimeHours DECIMAL(6,2) DEFAULT 0,
        basicSalary DECIMAL(10,2) DEFAULT 0,
        overtimePay DECIMAL(10,2) DEFAULT 0,
        bonus DECIMAL(10,2) DEFAULT 0,
        deductions DECIMAL(10,2) DEFAULT 0,
        advanceDeduction DECIMAL(10,2) DEFAULT 0,
        netSalary DECIMAL(10,2) DEFAULT 0,
        paymentMode ENUM('Cash','UPI','Bank Transfer') DEFAULT 'Cash',
        paymentDate DATE,
        status ENUM('Draft','Paid') DEFAULT 'Draft',
        notes VARCHAR(255),
        createdBy INT DEFAULT 1,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_worker_month (workerId, payrollMonth, payrollYear),
        FOREIGN KEY (workerId) REFERENCES workers(id) ON DELETE CASCADE
      )
    `);
  }

  static async generate(workerId, year, month) {
    // Pull attendance summary and calculate salary
    const Attendance = require('./Attendance.model');
    const summary = await Attendance.getMonthlySummary(year, month);
    const ws = summary.find(s => s.workerId === parseInt(workerId));
    if (!ws) return null;

    const workingDays = 26; // standard working days in a month
    let basicSalary = 0;

    if (ws.monthlyWages && parseFloat(ws.monthlyWages) > 0) {
      // Monthly salaried worker
      const perDayRate = parseFloat(ws.monthlyWages) / workingDays;
      const effectiveDays = ws.presentDays + (ws.halfDays * 0.5);
      basicSalary = effectiveDays * perDayRate;
    } else {
      // Daily wage worker
      const perDayRate = parseFloat(ws.dailyWages) || 0;
      const effectiveDays = ws.presentDays + (ws.halfDays * 0.5);
      basicSalary = effectiveDays * perDayRate;
    }

    const overtimeRate = (parseFloat(ws.dailyWages) || (parseFloat(ws.monthlyWages) / workingDays / 8)) * 1.5;
    const overtimePay = (ws.totalOvertimeHours || 0) * overtimeRate;

    // Check advance deduction
    const [advances] = await promisePool.query(`
      SELECT COALESCE(SUM(amount), 0) AS totalAdvance
      FROM worker_advances
      WHERE workerId = ? AND status = 'Pending'
    `, [workerId]);
    const advanceDeduction = parseFloat(advances[0]?.totalAdvance) || 0;

    const netSalary = Math.max(0, basicSalary + overtimePay - advanceDeduction);

    return {
      workerId: ws.workerId,
      workerName: ws.workerName,
      payrollMonth: month,
      payrollYear: year,
      presentDays: ws.presentDays,
      halfDays: ws.halfDays,
      absentDays: ws.absentDays,
      overtimeHours: ws.totalOvertimeHours || 0,
      basicSalary: basicSalary.toFixed(2),
      overtimePay: overtimePay.toFixed(2),
      bonus: 0,
      deductions: 0,
      advanceDeduction: advanceDeduction.toFixed(2),
      netSalary: netSalary.toFixed(2),
    };
  }

  static async save(data) {
    const query = `
      INSERT INTO payroll (workerId, payrollMonth, payrollYear, presentDays, halfDays, absentDays,
        overtimeHours, basicSalary, overtimePay, bonus, deductions, advanceDeduction, netSalary,
        paymentMode, paymentDate, status, notes, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        presentDays = VALUES(presentDays), halfDays = VALUES(halfDays), absentDays = VALUES(absentDays),
        overtimeHours = VALUES(overtimeHours), basicSalary = VALUES(basicSalary),
        overtimePay = VALUES(overtimePay), bonus = VALUES(bonus), deductions = VALUES(deductions),
        advanceDeduction = VALUES(advanceDeduction), netSalary = VALUES(netSalary),
        paymentMode = VALUES(paymentMode), paymentDate = VALUES(paymentDate),
        status = VALUES(status), notes = VALUES(notes), updatedAt = NOW()
    `;
    const [result] = await promisePool.query(query, [
      data.workerId, data.payrollMonth, data.payrollYear,
      data.presentDays || 0, data.halfDays || 0, data.absentDays || 0,
      data.overtimeHours || 0, data.basicSalary || 0, data.overtimePay || 0,
      data.bonus || 0, data.deductions || 0, data.advanceDeduction || 0,
      data.netSalary || 0, data.paymentMode || 'Cash', data.paymentDate || null,
      data.status || 'Draft', data.notes || null, data.createdBy || 1,
    ]);
    return result.insertId || true;
  }

  static async getMonthlyPayroll(year, month) {
    const [rows] = await promisePool.query(`
      SELECT p.*, w.name AS workerName, w.areaOfWork AS role, w.dailyWages, w.monthlyWages
      FROM payroll p
      JOIN workers w ON p.workerId = w.id
      WHERE p.payrollYear = ? AND p.payrollMonth = ?
      ORDER BY w.name
    `, [year, month]);
    return rows;
  }

  static async getByWorker(workerId) {
    const [rows] = await promisePool.query(`
      SELECT p.*, w.name AS workerName
      FROM payroll p
      JOIN workers w ON p.workerId = w.id
      WHERE p.workerId = ?
      ORDER BY p.payrollYear DESC, p.payrollMonth DESC
    `, [workerId]);
    return rows;
  }

  static async markAsPaid(id, paymentMode, paymentDate) {
    const [result] = await promisePool.query(
      `UPDATE payroll SET status = 'Paid', paymentMode = ?, paymentDate = ?, updatedAt = NOW() WHERE id = ?`,
      [paymentMode, paymentDate, id]
    );
    return result.affectedRows > 0;
  }

  static async getById(id) {
    const [rows] = await promisePool.query(`
      SELECT p.*, w.name AS workerName, w.areaOfWork AS role
      FROM payroll p
      JOIN workers w ON p.workerId = w.id
      WHERE p.id = ?
    `, [id]);
    return rows[0] || null;
  }
}

module.exports = Payroll;
