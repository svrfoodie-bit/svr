const { promisePool } = require('../config/database');

class Supplier {
  static generateSupplierId(name) {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30);
    return `${slug || 'supplier'}-${Date.now()}`;
  }

  static async create(data) {
    const supplierId = data.supplierId || Supplier.generateSupplierId(data.name || 'supplier');
    const query = `
      INSERT INTO suppliers (supplierId, name, contactPerson, phone, area, address, notes, isActive, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await promisePool.query(query, [
      supplierId,
      data.name,
      data.contactPerson || data.contact || null,
      data.phone || data.contact || null,
      data.area || data.location || null,
      data.address || data.location || null,
      data.notes || null,
      data.isActive !== undefined ? data.isActive : 1,
      data.createdBy || 1
    ]);
    return result.insertId;
  }

  static async getAll(filters = {}) {
    let query = 'SELECT * FROM suppliers WHERE COALESCE(isDeleted, 0) = 0';
    const params = [];

    if (filters.isActive !== undefined) {
      query += ' AND isActive = ?';
      params.push(filters.isActive ? 1 : 0);
    }

    if (filters.area) {
      query += ' AND area LIKE ?';
      params.push(`%${filters.area}%`);
    }

    if (filters.search) {
      query += ' AND (name LIKE ? OR supplierId LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY name ASC';
    const [rows] = await promisePool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const [rows] = await promisePool.query('SELECT * FROM suppliers WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async update(id, data) {
    const updates = [];
    const params = [];

    Object.entries(data).forEach(([key, value]) => {
      if (['name', 'contactPerson', 'phone', 'area', 'address', 'notes', 'isActive'].includes(key)) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updates.length === 0) return false;
    params.push(id);
    const query = `UPDATE suppliers SET ${updates.join(', ')}, updatedAt = NOW() WHERE id = ?`;
    const [result] = await promisePool.query(query, params);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await promisePool.query(
      'UPDATE suppliers SET isDeleted = 1, updatedAt = NOW() WHERE id = ? AND COALESCE(isDeleted, 0) = 0',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async restore(id) {
    const [result] = await promisePool.query(
      'UPDATE suppliers SET isDeleted = 0, updatedAt = NOW() WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async getSummary(filters = {}) {
    let query = `
      SELECT 
        s.id, s.name, s.supplierId,
        COUNT(rp.id) as totalPurchases,
        SUM(rp.totalAmount) as totalAmount
      FROM suppliers s
      LEFT JOIN raw_purchases rp ON s.id = rp.supplierId
      WHERE 1=1
    `;
    const params = [];

    if (filters.startDate && filters.endDate) {
      query += ' AND rp.purchaseDate BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }

    query += ' GROUP BY s.id ORDER BY totalAmount DESC';
    const [rows] = await promisePool.query(query, params);
    return rows;
  }
}

module.exports = Supplier;
