const { promisePool } = require('../config/database');

class JobWorkPayment {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS job_work_payments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        jobWorkId INT NOT NULL,
        paymentDate DATE NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        paymentMode ENUM('Cash', 'Cheque', 'Bank Transfer', 'UPI') NOT NULL,
        reference VARCHAR(100),
        notes TEXT,
        createdBy INT DEFAULT 1,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (jobWorkId) REFERENCES job_work(id) ON DELETE CASCADE,
        KEY (paymentDate),
        KEY (jobWorkId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await promisePool.query(query);
  }

  static async create(data) {
    const query = `
      INSERT INTO job_work_payments (jobWorkId, paymentDate, amount, paymentMode, reference, notes, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await promisePool.query(query, [
      data.jobWorkId,
      data.paymentDate,
      data.amount,
      data.paymentMode,
      data.reference || null,
      data.notes || null,
      data.createdBy || 1
    ]);
    return result.insertId;
  }

  static async getAll(filters = {}) {
    let query = `
      SELECT jwp.*, jw.jobDate, jw.jobWorkerName, jw.cashewType
      FROM job_work_payments jwp 
      JOIN job_work jw ON jwp.jobWorkId = jw.id 
      WHERE 1=1
    `;
    const params = [];

    if (filters.jobWorkId) {
      query += ' AND jwp.jobWorkId = ?';
      params.push(filters.jobWorkId);
    }

    if (filters.startDate && filters.endDate) {
      query += ' AND jwp.paymentDate BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }

    query += ' ORDER BY jwp.paymentDate DESC';
    const [rows] = await promisePool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const [rows] = await promisePool.query('SELECT * FROM job_work_payments WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async update(id, data) {
    const updates = [];
    const params = [];

    Object.entries(data).forEach(([key, value]) => {
      if (['amount', 'paymentMode', 'reference', 'notes'].includes(key)) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updates.length === 0) return false;
    params.push(id);
    const query = `UPDATE job_work_payments SET ${updates.join(', ')}, updatedAt = NOW() WHERE id = ?`;
    const [result] = await promisePool.query(query, params);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await promisePool.query('DELETE FROM job_work_payments WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getByJobWorkId(jobWorkId) {
    const query = 'SELECT * FROM job_work_payments WHERE jobWorkId = ? ORDER BY paymentDate DESC';
    const [rows] = await promisePool.query(query, [jobWorkId]);
    return rows;
  }

  static async getSummary(filters = {}) {
    let query = `
      SELECT 
        COUNT(*) as totalPayments,
        SUM(amount) as totalAmount,
        COUNT(DISTINCT jobWorkId) as uniqueJobWorks
      FROM job_work_payments 
      WHERE 1=1
    `;
    const params = [];

    if (filters.startDate && filters.endDate) {
      query += ' AND paymentDate BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }

    const [rows] = await promisePool.query(query, params);
    return rows[0];
  }
}

module.exports = JobWorkPayment;
