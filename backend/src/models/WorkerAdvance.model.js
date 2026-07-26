const { promisePool } = require('../config/database');

class WorkerAdvance {
  static async create(data) {
    const query = `
      INSERT INTO worker_advances (workerId, advanceDate, amount, reason, status, createdBy)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await promisePool.query(query, [
      data.workerId,
      data.advanceDate || data.date,
      data.amount,
      data.reason || data.remarks || null,
      data.status || 'Approved',
      data.createdBy || 1
    ]);
    return result.insertId;
  }

  static async getAll(filters = {}) {
    let query = 'SELECT wa.*, w.name as workerName FROM worker_advances wa JOIN workers w ON wa.workerId = w.id WHERE 1=1';
    const params = [];

    if (filters.workerId) {
      query += ' AND wa.workerId = ?';
      params.push(filters.workerId);
    }

    if (filters.status) {
      query += ' AND wa.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY wa.advanceDate DESC';
    const [rows] = await promisePool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const [rows] = await promisePool.query('SELECT * FROM worker_advances WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async update(id, data) {
    const updates = [];
    const params = [];

    Object.entries(data).forEach(([key, value]) => {
      if (['status', 'reason'].includes(key)) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updates.length === 0) return false;
    params.push(id);
    const query = `UPDATE worker_advances SET ${updates.join(', ')}, updatedAt = NOW() WHERE id = ?`;
    const [result] = await promisePool.query(query, params);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await promisePool.query('DELETE FROM worker_advances WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getWorkerOutstanding(workerId) {
    const query = `
      SELECT SUM(amount) as outstanding FROM worker_advances 
      WHERE workerId = ? AND status != 'Settled'
    `;
    const [rows] = await promisePool.query(query, [workerId]);
    return rows[0]?.outstanding || 0;
  }
}

module.exports = WorkerAdvance;
