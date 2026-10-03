const { promisePool } = require('../config/database');

const SELECT_PAYMENT_ENTRY = `
  SELECT id, customerId, paymentAmount,
         DATE_FORMAT(paymentDate, '%Y-%m-%d') AS paymentDate,
         paymentMode, referenceNumber, notes, createdAt, updatedAt
  FROM cashew_flow_x_payment_entries
`;

// A payment belongs to the customer, not to any particular stock entry.
class CashewFlowXPaymentEntry {
  static async create(data) {
    const [result] = await promisePool.query(
      `INSERT INTO cashew_flow_x_payment_entries
         (customerId, paymentAmount, paymentDate, paymentMode, referenceNumber, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.customerId,
        data.paymentAmount,
        data.paymentDate,
        data.paymentMode,
        data.referenceNumber || null,
        data.notes || null,
      ]
    );
    return result.insertId;
  }

  static async getById(id) {
    const [rows] = await promisePool.query(`${SELECT_PAYMENT_ENTRY} WHERE id = ?`, [id]);
    return rows[0] || null;
  }

  static async getByCustomer(customerId) {
    const [rows] = await promisePool.query(
      `${SELECT_PAYMENT_ENTRY} WHERE customerId = ? ORDER BY paymentDate DESC, id DESC`,
      [customerId]
    );
    return rows;
  }

  static async update(id, data) {
    const [result] = await promisePool.query(
      `UPDATE cashew_flow_x_payment_entries
       SET paymentAmount = ?, paymentDate = ?, paymentMode = ?, referenceNumber = ?, notes = ?
       WHERE id = ?`,
      [
        data.paymentAmount,
        data.paymentDate,
        data.paymentMode,
        data.referenceNumber || null,
        data.notes || null,
        id,
      ]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await promisePool.query('DELETE FROM cashew_flow_x_payment_entries WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = CashewFlowXPaymentEntry;
