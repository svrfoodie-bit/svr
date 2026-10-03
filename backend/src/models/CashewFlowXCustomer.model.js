const { promisePool } = require('../config/database');

// CashewFlowX customers are independent of the main `customers` table.
class CashewFlowXCustomer {
  static async create(data) {
    const [result] = await promisePool.query(
      `INSERT INTO cashew_flow_x_customers (customerName, mobileNumber, address, notes, status)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.customerName.trim(),
        data.mobileNumber || null,
        data.address || null,
        data.notes || null,
        data.status || 'Active',
      ]
    );
    return result.insertId;
  }

  // Lists customers with their stock/payment totals (balance is derived by the controller).
  static async getAll({ search, status } = {}) {
    let query = `
      SELECT c.id, c.customerName, c.mobileNumber, c.address, c.notes, c.status, c.createdAt, c.updatedAt,
             COALESCE(s.totalStockKg, 0) AS totalStockKg,
             COALESCE(s.totalStockAmount, 0) AS totalStockAmount,
             COALESCE(p.totalPaid, 0) AS totalPaid
      FROM cashew_flow_x_customers c
      LEFT JOIN (
        SELECT customerId, SUM(quantityKg) AS totalStockKg, SUM(totalAmount) AS totalStockAmount
        FROM cashew_flow_x_stock_entries GROUP BY customerId
      ) s ON s.customerId = c.id
      LEFT JOIN (
        SELECT customerId, SUM(paymentAmount) AS totalPaid
        FROM cashew_flow_x_payment_entries GROUP BY customerId
      ) p ON p.customerId = c.id
      WHERE 1 = 1
    `;
    const params = [];

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (c.customerName LIKE ? OR c.mobileNumber LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY c.customerName ASC';
    const [rows] = await promisePool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const [rows] = await promisePool.query('SELECT * FROM cashew_flow_x_customers WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async update(id, data) {
    const [result] = await promisePool.query(
      `UPDATE cashew_flow_x_customers
       SET customerName = ?, mobileNumber = ?, address = ?, notes = ?, status = ?
       WHERE id = ?`,
      [
        data.customerName.trim(),
        data.mobileNumber || null,
        data.address || null,
        data.notes || null,
        data.status || 'Active',
        id,
      ]
    );
    return result.affectedRows > 0;
  }

  static async setStatus(id, status) {
    const [result] = await promisePool.query(
      'UPDATE cashew_flow_x_customers SET status = ? WHERE id = ?',
      [status, id]
    );
    return result.affectedRows > 0;
  }

  static async countEntries(id) {
    const [rows] = await promisePool.query(
      `SELECT
         (SELECT COUNT(*) FROM cashew_flow_x_stock_entries WHERE customerId = ?) AS stockCount,
         (SELECT COUNT(*) FROM cashew_flow_x_payment_entries WHERE customerId = ?) AS paymentCount`,
      [id, id]
    );
    return { stockCount: Number(rows[0].stockCount), paymentCount: Number(rows[0].paymentCount) };
  }

  static async delete(id) {
    const [result] = await promisePool.query('DELETE FROM cashew_flow_x_customers WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = CashewFlowXCustomer;
