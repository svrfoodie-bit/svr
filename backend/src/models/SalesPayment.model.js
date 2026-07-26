const { promisePool } = require('../config/database');

class SalesPayment {
  static normalizePaymentMode(mode) {
    if (mode === 'PhonePe') return 'UPI';
    if (mode === 'Bank') return 'Bank Transfer';
    return mode || 'Cash';
  }

  static async create(data) {
    const query = `
      INSERT INTO sales_payments (salesOrderId, paymentDate, amount, paymentMode, reference, notes, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await promisePool.query(query, [
      data.salesOrderId || data.orderId,
      data.paymentDate || data.date,
      data.amount,
      this.normalizePaymentMode(data.paymentMode),
      data.reference || data.referenceNumber || null,
      data.notes || data.remarks || null,
      data.createdBy || 1
    ]);
    return result.insertId;
  }

  static async getAll(filters = {}) {
    let query = `
      SELECT
        sp.*,
        CONCAT('SP-', LPAD(sp.id, 4, '0')) AS paymentNumber,
        sp.paymentDate AS date,
        sp.reference AS referenceNumber,
        sp.notes AS remarks,
        so.salesOrderId,
        so.salesOrderId AS orderNumber,
        c.name AS customerName
      FROM sales_payments sp
      JOIN sales_orders so ON sp.salesOrderId = so.id
      JOIN customers c ON so.customerId = c.id
      WHERE 1=1
    `;
    const params = [];

    const salesOrderId = filters.salesOrderId || filters.orderId;
    if (salesOrderId) {
      query += ' AND sp.salesOrderId = ?';
      params.push(salesOrderId);
    }

    if (filters.paymentMode) {
      query += ' AND sp.paymentMode = ?';
      params.push(this.normalizePaymentMode(filters.paymentMode));
    }

    if (filters.startDate && filters.endDate) {
      query += ' AND sp.paymentDate BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }

    query += ' ORDER BY sp.paymentDate DESC';
    const [rows] = await promisePool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const [rows] = await promisePool.query('SELECT * FROM sales_payments WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async delete(id) {
    const [result] = await promisePool.query('DELETE FROM sales_payments WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getSummary(filters = {}) {
    let query = `
      SELECT 
        COUNT(*) as totalPayments,
        COALESCE(SUM(amount), 0) as totalAmount,
        COALESCE(SUM(CASE WHEN paymentMode = 'Cash' THEN amount ELSE 0 END), 0) as cashPayments,
        COALESCE(SUM(CASE WHEN paymentMode IN ('UPI', 'PhonePe') THEN amount ELSE 0 END), 0) as upiPayments,
        COALESCE(SUM(CASE WHEN paymentMode = 'Cheque' THEN amount ELSE 0 END), 0) as chequePayments,
        COALESCE(SUM(CASE WHEN paymentMode IN ('Bank Transfer', 'Bank') THEN amount ELSE 0 END), 0) as bankPayments
      FROM sales_payments WHERE 1=1
    `;
    const params = [];

    if (filters.paymentMode) {
      query += ' AND paymentMode = ?';
      params.push(this.normalizePaymentMode(filters.paymentMode));
    }

    if (filters.startDate && filters.endDate) {
      query += ' AND paymentDate BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }

    const [rows] = await promisePool.query(query, params);
    return rows[0];
  }
}

module.exports = SalesPayment;
