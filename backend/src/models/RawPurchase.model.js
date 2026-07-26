const { promisePool } = require('../config/database');

class RawPurchase {
  // Add fundedByLoanId column if it doesn't exist (run once at startup)
  static async migrate() {
    try {
      await promisePool.query(`
        ALTER TABLE raw_purchases
        ADD COLUMN IF NOT EXISTS fundedByLoanId INT NULL,
        ADD COLUMN IF NOT EXISTS fundedByLoanCode VARCHAR(20) NULL
      `);
    } catch (err) {
      // Column may already exist or DB doesn't support IF NOT EXISTS — ignore
    }
  }

  static async create(data) {
    const query = `
      INSERT INTO raw_purchases (supplierId, purchaseDate, quantity, ratePerUnit, totalAmount,
                                  grade, moisture, weight, notes, fundedByLoanId, fundedByLoanCode, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await promisePool.query(query, [
      data.supplierId,
      data.purchaseDate,
      data.quantity || data.quantityKg,
      data.ratePerUnit || data.pricePerKg,
      data.totalAmount || (data.quantity * data.ratePerUnit) || (data.quantityKg * data.pricePerKg),
      data.grade || data.rawQuality || 'Standard',
      data.moisture || null,
      data.weight || null,
      data.notes || data.remarks || null,
      data.fundedByLoanId || null,
      data.fundedByLoanCode || null,
      data.createdBy || 1
    ]);
    return result.insertId;
  }

  static async getAll(filters = {}) {
    let query = `
      SELECT
        rp.*, 
        s.name AS supplierName,
        COALESCE(p.totalPaid, 0) AS totalPaid,
        rp.totalAmount - COALESCE(p.totalPaid, 0) AS balance,
        rp.quantity AS quantityKg,
        rp.ratePerUnit AS pricePerKg,
        rp.grade AS rawQuality,
        CASE
          WHEN COALESCE(p.totalPaid, 0) >= rp.totalAmount THEN 'Paid'
          WHEN COALESCE(p.totalPaid, 0) > 0 THEN 'Partial'
          ELSE 'Credit'
        END AS paymentStatus
      FROM raw_purchases rp
      JOIN suppliers s ON rp.supplierId = s.id
      LEFT JOIN (
        SELECT rawPurchaseId, SUM(amount) AS totalPaid
        FROM raw_purchase_payments
        GROUP BY rawPurchaseId
      ) p ON rp.id = p.rawPurchaseId
      WHERE 1=1
    `;
    const params = [];

    if (filters.supplierId) {
      query += ' AND rp.supplierId = ?';
      params.push(filters.supplierId);
    }

    if (filters.quality || filters.rawQuality) {
      query += ' AND rp.grade = ?';
      params.push(filters.quality || filters.rawQuality);
    }

    if (filters.paymentStatus) {
      query += `
        AND CASE
          WHEN COALESCE(p.totalPaid, 0) >= rp.totalAmount THEN 'Paid'
          WHEN COALESCE(p.totalPaid, 0) > 0 THEN 'Partial'
          ELSE 'Credit'
        END = ?
      `;
      params.push(filters.paymentStatus);
    }

    if (filters.startDate && filters.endDate) {
      query += ' AND rp.purchaseDate BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }

    query += ' ORDER BY rp.purchaseDate DESC';
    const [rows] = await promisePool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const query = `
      SELECT
        rp.*, 
        s.name AS supplierName,
        COALESCE(p.totalPaid, 0) AS totalPaid,
        rp.totalAmount - COALESCE(p.totalPaid, 0) AS balance,
        rp.quantity AS quantityKg,
        rp.ratePerUnit AS pricePerKg,
        rp.grade AS rawQuality,
        CASE
          WHEN COALESCE(p.totalPaid, 0) >= rp.totalAmount THEN 'Paid'
          WHEN COALESCE(p.totalPaid, 0) > 0 THEN 'Partial'
          ELSE 'Credit'
        END AS paymentStatus
      FROM raw_purchases rp
      JOIN suppliers s ON rp.supplierId = s.id
      LEFT JOIN (
        SELECT rawPurchaseId, SUM(amount) AS totalPaid
        FROM raw_purchase_payments
        GROUP BY rawPurchaseId
      ) p ON rp.id = p.rawPurchaseId
      WHERE rp.id = ?
    `;
    const [rows] = await promisePool.query(query, [id]);
    return rows[0] || null;
  }

  static async update(id, data) {
    const updates = [];
    const params = [];

    Object.entries(data).forEach(([key, value]) => {
      if (['supplierId', 'quantity', 'ratePerUnit', 'totalAmount', 'grade', 'moisture', 'weight', 'notes',
           'fundedByLoanId', 'fundedByLoanCode'].includes(key)) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updates.length === 0) return false;
    params.push(id);
    const query = `UPDATE raw_purchases SET ${updates.join(', ')}, updatedAt = NOW() WHERE id = ?`;
    const [result] = await promisePool.query(query, params);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await promisePool.query('DELETE FROM raw_purchases WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getSummary(filters = {}) {
    let query = `
      SELECT
        COUNT(*) as count,
        SUM(rp.quantity) as totalQuantity,
        SUM(rp.totalAmount) as totalValue,
        COALESCE(SUM(p.totalPaid), 0) as totalPaid,
        SUM(rp.totalAmount) - COALESCE(SUM(p.totalPaid), 0) as totalOutstanding
      FROM raw_purchases rp
      LEFT JOIN (
        SELECT rawPurchaseId, SUM(amount) AS totalPaid
        FROM raw_purchase_payments
        GROUP BY rawPurchaseId
      ) p ON rp.id = p.rawPurchaseId
      WHERE 1=1
    `;
    const params = [];

    if (filters.startDate && filters.endDate) {
      query += ' AND rp.purchaseDate BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }

    const [rows] = await promisePool.query(query, params);
    return rows[0];
  }
}

module.exports = RawPurchase;
