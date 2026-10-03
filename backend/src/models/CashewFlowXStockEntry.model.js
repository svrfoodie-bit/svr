const { promisePool } = require('../config/database');

// Dates are formatted in SQL so they reach the client as plain YYYY-MM-DD,
// independent of the server's timezone.
const SELECT_STOCK_ENTRY = `
  SELECT s.id, s.customerId, s.cashewTypeId, t.cashewTypeName,
         s.quantityKg, s.pricePerKg, s.totalAmount,
         DATE_FORMAT(s.givenDate, '%Y-%m-%d') AS givenDate,
         s.notes, s.createdAt, s.updatedAt
  FROM cashew_flow_x_stock_entries s
  JOIN cashew_flow_x_cashew_types t ON t.id = s.cashewTypeId
`;

class CashewFlowXStockEntry {
  // `totalAmount` must already be calculated by the caller (never taken from the client).
  static async create(data) {
    const [result] = await promisePool.query(
      `INSERT INTO cashew_flow_x_stock_entries
         (customerId, cashewTypeId, quantityKg, pricePerKg, totalAmount, givenDate, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.customerId,
        data.cashewTypeId,
        data.quantityKg,
        data.pricePerKg,
        data.totalAmount,
        data.givenDate,
        data.notes || null,
      ]
    );
    return result.insertId;
  }

  static async getById(id) {
    const [rows] = await promisePool.query(`${SELECT_STOCK_ENTRY} WHERE s.id = ?`, [id]);
    return rows[0] || null;
  }

  static async getByCustomer(customerId) {
    const [rows] = await promisePool.query(
      `${SELECT_STOCK_ENTRY} WHERE s.customerId = ? ORDER BY s.givenDate DESC, s.id DESC`,
      [customerId]
    );
    return rows;
  }

  static async getTypeTotalsByCustomer(customerId) {
    const [rows] = await promisePool.query(
      `SELECT s.cashewTypeId, t.cashewTypeName,
              SUM(s.quantityKg) AS totalKg, SUM(s.totalAmount) AS totalAmount, COUNT(*) AS entryCount
       FROM cashew_flow_x_stock_entries s
       JOIN cashew_flow_x_cashew_types t ON t.id = s.cashewTypeId
       WHERE s.customerId = ?
       GROUP BY s.cashewTypeId, t.cashewTypeName
       ORDER BY totalAmount DESC`,
      [customerId]
    );
    return rows;
  }

  // The customer of an entry never changes; only these fields are editable.
  static async update(id, data) {
    const [result] = await promisePool.query(
      `UPDATE cashew_flow_x_stock_entries
       SET cashewTypeId = ?, quantityKg = ?, pricePerKg = ?, totalAmount = ?, givenDate = ?, notes = ?
       WHERE id = ?`,
      [
        data.cashewTypeId,
        data.quantityKg,
        data.pricePerKg,
        data.totalAmount,
        data.givenDate,
        data.notes || null,
        id,
      ]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await promisePool.query('DELETE FROM cashew_flow_x_stock_entries WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = CashewFlowXStockEntry;
