const { promisePool } = require('../config/database');

class PaymentReconciliation {
  static async create(data) {
    const query = `
      INSERT INTO payment_reconciliations (orderId, expectedAmount, receivedAmount, 
                                           reconciliationDate, remarks, status, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await promisePool.query(query, [
      data.orderId,
      data.expectedAmount,
      data.receivedAmount,
      data.reconciliationDate || new Date(),
      data.remarks || null,
      data.status || 'Pending',
      data.createdBy || 1
    ]);
    return result.insertId;
  }

  static async getAll(filters = {}) {
    let query = 'SELECT * FROM payment_reconciliations WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.startDate && filters.endDate) {
      query += ' AND reconciliationDate BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }

    query += ' ORDER BY reconciliationDate DESC';
    const [rows] = await promisePool.query(query, params);
    return rows;
  }

  static async update(id, data) {
    const updates = [];
    const params = [];

    if (data.status) {
      updates.push('status = ?');
      params.push(data.status);
    }

    if (data.remarks) {
      updates.push('remarks = ?');
      params.push(data.remarks);
    }

    if (updates.length === 0) return false;
    params.push(id);
    const query = `UPDATE payment_reconciliations SET ${updates.join(', ')}, updatedAt = NOW() WHERE id = ?`;
    const [result] = await promisePool.query(query, params);
    return result.affectedRows > 0;
  }
}

class PaymentReminder {
  static async create(data) {
    const query = `
      INSERT INTO payment_reminders (orderId, customerId, reminderDate, status, createdBy)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await promisePool.query(query, [
      data.orderId,
      data.customerId,
      data.reminderDate,
      data.status || 'Pending',
      data.createdBy || 1
    ]);
    return result.insertId;
  }

  static async getAll(filters = {}) {
    let query = 'SELECT * FROM payment_reminders WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY reminderDate ASC';
    const [rows] = await promisePool.query(query, params);
    return rows;
  }

  static async markAsNotified(id) {
    const query = 'UPDATE payment_reminders SET status = ?, notifiedAt = NOW() WHERE id = ?';
    const [result] = await promisePool.query(query, ['Notified', id]);
    return result.affectedRows > 0;
  }
}

module.exports = { PaymentReconciliation, PaymentReminder };
