const { promisePool } = require('../config/database');

class Customer {
  static async generateCustomerId() {
    const [rows] = await promisePool.query('SELECT COUNT(*) as count FROM customers');
    return `CUST-${String(rows[0].count + 1).padStart(4, '0')}`;
  }

  static async create(data) {
    const customerId = data.customerId || await Customer.generateCustomerId();
    const query = `
      INSERT INTO customers (customerId, name, type, contactNumber, area, email, address, isActive, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await promisePool.query(query, [
      customerId,
      data.name,
      data.type,
      data.contactNumber,
      data.area,
      data.email || null,
      data.address || null,
      data.isActive !== undefined ? data.isActive : 1,
      data.createdBy || 1
    ]);
    return result.insertId;
  }

  static async getAll(filters = {}) {
    let query = 'SELECT * FROM customers WHERE COALESCE(isDeleted, 0) = 0';
    const params = [];

    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters.isActive !== undefined) {
      query += ' AND isActive = ?';
      params.push(filters.isActive ? 1 : 0);
    }

    if (filters.area) {
      query += ' AND area LIKE ?';
      params.push(`%${filters.area}%`);
    }

    if (filters.search) {
      query += ' AND (name LIKE ? OR customerId LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY createdAt DESC';

    const [rows] = await promisePool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const [rows] = await promisePool.query('SELECT * FROM customers WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async update(id, data) {
    const updates = [];
    const params = [];

    Object.entries(data).forEach(([key, value]) => {
      if (['name', 'type', 'contactNumber', 'area', 'email', 'address', 'isActive'].includes(key)) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updates.length === 0) return false;

    params.push(id);
    const query = `UPDATE customers SET ${updates.join(', ')}, updatedAt = NOW() WHERE id = ?`;
    const [result] = await promisePool.query(query, params);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await promisePool.query(
      'UPDATE customers SET isDeleted = 1, updatedAt = NOW() WHERE id = ? AND COALESCE(isDeleted, 0) = 0',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async restore(id) {
    const [result] = await promisePool.query(
      'UPDATE customers SET isDeleted = 0, updatedAt = NOW() WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async getOutstanding() {
    const query = `
      SELECT 
        c.id, c.name, c.customerId,
        SUM(so.quantity * so.ratePerUnit) as totalSales,
        SUM(COALESCE(sp.amount, 0)) as totalPaid,
        SUM(so.quantity * so.ratePerUnit) - SUM(COALESCE(sp.amount, 0)) as outstanding
      FROM customers c
      LEFT JOIN sales_orders so ON c.id = so.customerId
      LEFT JOIN sales_payments sp ON so.id = sp.salesOrderId
      GROUP BY c.id
      HAVING outstanding > 0
      ORDER BY outstanding DESC
    `;
    const [rows] = await promisePool.query(query);
    return rows;
  }
}

module.exports = Customer;
