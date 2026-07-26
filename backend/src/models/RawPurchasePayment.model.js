const { promisePool } = require('../config/database');

class RawPurchasePayment {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS raw_purchase_payments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        rawPurchaseId INT NOT NULL,
        paymentDate DATE NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        paymentMode ENUM('Cash', 'Cheque', 'Bank Transfer', 'UPI') NOT NULL,
        reference VARCHAR(100),
        notes TEXT,
        createdBy INT DEFAULT 1,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (rawPurchaseId) REFERENCES raw_purchases(id) ON DELETE CASCADE,
        KEY (paymentDate),
        KEY (rawPurchaseId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await promisePool.query(query);
  }

  static async create(data) {
    const query = `
      INSERT INTO raw_purchase_payments (rawPurchaseId, paymentDate, amount, paymentMode, reference, notes, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await promisePool.query(query, [
      data.rawPurchaseId,
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
      SELECT rpp.*, rp.purchaseDate as refPurchaseDate, s.name as supplierName 
      FROM raw_purchase_payments rpp 
      JOIN raw_purchases rp ON rpp.rawPurchaseId = rp.id 
      JOIN suppliers s ON rp.supplierId = s.id 
      WHERE 1=1
    `;
    const params = [];

    if (filters.rawPurchaseId) {
      query += ' AND rpp.rawPurchaseId = ?';
      params.push(filters.rawPurchaseId);
    }

    if (filters.startDate && filters.endDate) {
      query += ' AND rpp.paymentDate BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }

    query += ' ORDER BY rpp.paymentDate DESC';
    const [rows] = await promisePool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const [rows] = await promisePool.query('SELECT * FROM raw_purchase_payments WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async update(id, data) {
    const updates = [];
    const params = [];

    Object.entries(data).forEach(([key, value]) => {
      if (['paymentDate', 'amount', 'paymentMode', 'reference', 'notes'].includes(key)) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updates.length === 0) return false;
    params.push(id);
    const query = `UPDATE raw_purchase_payments SET ${updates.join(', ')}, updatedAt = NOW() WHERE id = ?`;
    const [result] = await promisePool.query(query, params);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await promisePool.query('DELETE FROM raw_purchase_payments WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getByRawPurchaseId(rawPurchaseId) {
    const query = 'SELECT * FROM raw_purchase_payments WHERE rawPurchaseId = ? ORDER BY paymentDate DESC';
    const [rows] = await promisePool.query(query, [rawPurchaseId]);
    return rows;
  }

  static async getSummary(filters = {}) {
    let query = `
      SELECT 
        COUNT(*) as totalPayments,
        SUM(amount) as totalAmount,
        COUNT(DISTINCT rawPurchaseId) as uniquePurchases
      FROM raw_purchase_payments 
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

module.exports = RawPurchasePayment;
