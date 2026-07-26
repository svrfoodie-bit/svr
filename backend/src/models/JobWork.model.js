const { promisePool } = require('../config/database');

class JobWork {
  static async create(data) {
    const query = `
      INSERT INTO job_work (jobDate, jobWorkerName, cashewType, quantitySent, 
                            quantityReceived, ratePerKg, remarks, status, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await promisePool.query(query, [
      data.jobDate,
      data.jobWorkerName,
      data.cashewType || 'Premium',
      data.quantitySent,
      data.quantityReceived,
      data.ratePerKg,
      data.remarks || null,
      data.status || 'In Progress',
      data.createdBy || 1
    ]);
    return result.insertId;
  }

  static async getAll(filters = {}) {
    let query = `
      SELECT
        jw.*,
        ROUND(jw.quantitySent - jw.quantityReceived, 2) AS lossQuantity,
        ROUND(jw.quantityReceived * jw.ratePerKg, 2) AS totalCost,
        COALESCE(pay.totalPaid, 0) AS totalPaid,
        ROUND((jw.quantityReceived * jw.ratePerKg) - COALESCE(pay.totalPaid, 0), 2) AS balance,
        CASE
          WHEN COALESCE(pay.totalPaid, 0) >= (jw.quantityReceived * jw.ratePerKg) THEN 'Paid'
          WHEN COALESCE(pay.totalPaid, 0) > 0 THEN 'Partial'
          ELSE 'Pending'
        END AS paymentStatus
      FROM job_work jw
      LEFT JOIN (
        SELECT jobWorkId, SUM(amount) AS totalPaid
        FROM job_work_payments
        GROUP BY jobWorkId
      ) pay ON pay.jobWorkId = jw.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += ' AND jw.status = ?';
      params.push(filters.status);
    }

    if (filters.cashewType) {
      query += ' AND jw.cashewType = ?';
      params.push(filters.cashewType);
    }

    if (filters.paymentStatus) {
      query += `
        AND CASE
          WHEN COALESCE(pay.totalPaid, 0) >= (jw.quantityReceived * jw.ratePerKg) THEN 'Paid'
          WHEN COALESCE(pay.totalPaid, 0) > 0 THEN 'Partial'
          ELSE 'Pending'
        END = ?
      `;
      params.push(filters.paymentStatus);
    }

    if (filters.startDate && filters.endDate) {
      query += ' AND jw.jobDate BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }

    query += ' ORDER BY jw.jobDate DESC';
    const [rows] = await promisePool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const query = `
      SELECT
        jw.*,
        ROUND(jw.quantitySent - jw.quantityReceived, 2) AS lossQuantity,
        ROUND(jw.quantityReceived * jw.ratePerKg, 2) AS totalCost,
        COALESCE(pay.totalPaid, 0) AS totalPaid,
        ROUND((jw.quantityReceived * jw.ratePerKg) - COALESCE(pay.totalPaid, 0), 2) AS balance,
        CASE
          WHEN COALESCE(pay.totalPaid, 0) >= (jw.quantityReceived * jw.ratePerKg) THEN 'Paid'
          WHEN COALESCE(pay.totalPaid, 0) > 0 THEN 'Partial'
          ELSE 'Pending'
        END AS paymentStatus
      FROM job_work jw
      LEFT JOIN (
        SELECT jobWorkId, SUM(amount) AS totalPaid
        FROM job_work_payments
        GROUP BY jobWorkId
      ) pay ON pay.jobWorkId = jw.id
      WHERE jw.id = ?
    `;
    const [rows] = await promisePool.query(query, [id]);
    return rows[0] || null;
  }

  static async update(id, data) {
    const updates = [];
    const params = [];

    Object.entries(data).forEach(([key, value]) => {
      if (['jobDate', 'jobWorkerName', 'cashewType', 'quantitySent', 'quantityReceived', 'ratePerKg', 'remarks', 'status'].includes(key)) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updates.length === 0) return false;
    params.push(id);
    const query = `UPDATE job_work SET ${updates.join(', ')}, updatedAt = NOW() WHERE id = ?`;
    const [result] = await promisePool.query(query, params);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await promisePool.query('DELETE FROM job_work WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getSummary(filters = {}) {
    let query = `
      SELECT 
        COUNT(*) AS totalJobs,
        SUM(CASE WHEN jw.status = 'In Progress' THEN 1 ELSE 0 END) AS inProgressCount,
        SUM(CASE WHEN jw.status = 'Completed' THEN 1 ELSE 0 END) AS completedCount,
        COALESCE(SUM(jw.quantitySent), 0) AS totalQuantitySent,
        COALESCE(SUM(jw.quantityReceived), 0) AS totalQuantityReceived,
        COALESCE(SUM(jw.quantitySent - jw.quantityReceived), 0) AS totalLoss,
        COALESCE(SUM(jw.quantityReceived * jw.ratePerKg), 0) AS totalCost,
        COALESCE(SUM(pay.totalPaid), 0) AS totalPaid,
        COALESCE(SUM(jw.quantityReceived * jw.ratePerKg), 0) - COALESCE(SUM(pay.totalPaid), 0) AS totalOutstanding
      FROM job_work jw
      LEFT JOIN (
        SELECT jobWorkId, SUM(amount) AS totalPaid
        FROM job_work_payments
        GROUP BY jobWorkId
      ) pay ON pay.jobWorkId = jw.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.cashewType) {
      query += ' AND jw.cashewType = ?';
      params.push(filters.cashewType);
    }

    if (filters.startDate && filters.endDate) {
      query += ' AND jw.jobDate BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }

    const [rows] = await promisePool.query(query, params);
    return rows[0];
  }
}

module.exports = JobWork;
