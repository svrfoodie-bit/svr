const { promisePool } = require('../config/database');

class Attendance {
  static async createTable() {
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workerId INT NOT NULL,
        attendanceDate DATE NOT NULL,
        status ENUM('Present','Absent','Half Day','Leave') DEFAULT 'Present',
        hoursWorked DECIMAL(4,2) DEFAULT 8.00,
        overtimeHours DECIMAL(4,2) DEFAULT 0,
        notes VARCHAR(255),
        createdBy INT DEFAULT 1,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_worker_date (workerId, attendanceDate),
        FOREIGN KEY (workerId) REFERENCES workers(id) ON DELETE CASCADE
      )
    `);
  }

  static async upsert(data) {
    // Insert or update for a given worker+date
    const query = `
      INSERT INTO attendance (workerId, attendanceDate, status, hoursWorked, overtimeHours, notes, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        hoursWorked = VALUES(hoursWorked),
        overtimeHours = VALUES(overtimeHours),
        notes = VALUES(notes),
        updatedAt = NOW()
    `;
    const [result] = await promisePool.query(query, [
      data.workerId,
      data.attendanceDate,
      data.status || 'Present',
      data.hoursWorked ?? 8,
      data.overtimeHours ?? 0,
      data.notes || null,
      data.createdBy || 1,
    ]);
    return result.insertId || true;
  }

  static async bulkUpsert(records) {
    for (const rec of records) {
      await Attendance.upsert(rec);
    }
    return true;
  }

  static async getByDate(date) {
    const [rows] = await promisePool.query(`
      SELECT a.*, w.name AS workerName, w.areaOfWork AS role, w.dailyWages, w.monthlyWages
      FROM attendance a
      JOIN workers w ON a.workerId = w.id
      WHERE a.attendanceDate = ?
      ORDER BY w.name
    `, [date]);
    return rows;
  }

  static async getByWorker(workerId, startDate, endDate) {
    const [rows] = await promisePool.query(`
      SELECT * FROM attendance
      WHERE workerId = ?
        AND attendanceDate BETWEEN ? AND ?
      ORDER BY attendanceDate DESC
    `, [workerId, startDate, endDate]);
    return rows;
  }

  static async getMonthlySummary(year, month) {
    // Returns per-worker summary for a given month
    const [rows] = await promisePool.query(`
      SELECT
        w.id AS workerId,
        w.name AS workerName,
        w.areaOfWork AS role,
        w.dailyWages,
        w.monthlyWages,
        COUNT(CASE WHEN a.status = 'Present' THEN 1 END) AS presentDays,
        COUNT(CASE WHEN a.status = 'Half Day' THEN 1 END) AS halfDays,
        COUNT(CASE WHEN a.status = 'Absent' THEN 1 END) AS absentDays,
        COUNT(CASE WHEN a.status = 'Leave' THEN 1 END) AS leaveDays,
        COALESCE(SUM(a.overtimeHours), 0) AS totalOvertimeHours,
        COUNT(a.id) AS markedDays
      FROM workers w
      LEFT JOIN attendance a ON w.id = a.workerId
        AND YEAR(a.attendanceDate) = ?
        AND MONTH(a.attendanceDate) = ?
      WHERE w.status = 'Active'
      GROUP BY w.id, w.name, w.areaOfWork, w.dailyWages, w.monthlyWages
      ORDER BY w.name
    `, [year, month]);
    return rows;
  }

  static async delete(id) {
    const [result] = await promisePool.query('DELETE FROM attendance WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Attendance;
