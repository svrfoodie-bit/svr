const { promisePool } = require('../config/database');

class FinishedGoodsStock {
  static async create(data) {
    const query = `
      INSERT INTO finished_goods_stock (batchId, grade, quantity, dateAdded, createdBy)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await promisePool.query(query, [
      data.batchId,
      data.grade,
      data.quantity,
      data.dateAdded || new Date(),
      data.createdBy || 1
    ]);
    return result.insertId;
  }

  static async getAll(filters = {}) {
    let query = 'SELECT * FROM finished_goods_stock WHERE 1=1';
    const params = [];

    if (filters.grade) {
      query += ' AND grade = ?';
      params.push(filters.grade);
    }

    if (filters.startDate && filters.endDate) {
      query += ' AND dateAdded BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }

    query += ' ORDER BY dateAdded DESC';
    const [rows] = await promisePool.query(query, params);
    return rows;
  }

  static async getSummary() {
    const query = `
      SELECT 
        grade,
        SUM(quantity) as currentStock,
        COUNT(*) as batchCount
      FROM finished_goods_stock
      GROUP BY grade
      ORDER BY grade
    `;
    const [rows] = await promisePool.query(query);
    return rows;
  }

  static async getGradeStock(grade) {
    const query = 'SELECT SUM(quantity) as stock FROM finished_goods_stock WHERE grade = ?';
    const [rows] = await promisePool.query(query, [grade]);
    return rows[0]?.stock || 0;
  }

  static async getAdjustments(filters = {}) {
    let query = `
      SELECT
        id,
        grade,
        adjustmentType AS type,
        adjustmentType,
        quantity,
        reason,
        approvedBy,
        COALESCE(dateAdded, DATE(createdAt)) AS date,
        createdAt,
        createdBy
      FROM stock_adjustments
      WHERE 1=1
    `;
    const params = [];

    if (filters.grade) {
      query += ' AND grade = ?';
      params.push(filters.grade);
    }

    if (filters.startDate && filters.endDate) {
      query += ' AND COALESCE(dateAdded, DATE(createdAt)) BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }

    query += ' ORDER BY COALESCE(dateAdded, DATE(createdAt)) DESC, id DESC';
    const [rows] = await promisePool.query(query, params);
    return rows;
  }

  static async recordAdjustment(data) {
    const adjustmentType = data.adjustmentType || data.type;
    const quantity = Math.abs(parseFloat(data.quantity) || 0);
    const dateAdded = data.dateAdded || data.date || new Date();
    const createdBy = data.createdBy || 1;

    if (!data.grade) {
      throw new Error('Grade is required');
    }
    if (!['Issue', 'Damage'].includes(adjustmentType)) {
      throw new Error('Adjustment type must be Issue or Damage');
    }
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    const connection = await promisePool.getConnection();
    try {
      await connection.beginTransaction();

      const [stockRows] = await connection.query(
        'SELECT COALESCE(SUM(quantity), 0) AS stock FROM finished_goods_stock WHERE grade = ? FOR UPDATE',
        [data.grade]
      );
      const availableStock = parseFloat(stockRows[0]?.stock) || 0;
      if (quantity > availableStock) {
        throw new Error(`Insufficient stock for ${data.grade}. Available: ${availableStock} KG, Required: ${quantity} KG`);
      }

      const [result] = await connection.query(
        `INSERT INTO stock_adjustments (grade, adjustmentType, quantity, dateAdded, reason, approvedBy, createdBy)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          data.grade,
          adjustmentType,
          quantity,
          dateAdded,
          data.reason || null,
          data.approvedBy || null,
          createdBy,
        ]
      );

      await connection.query(
        `INSERT INTO finished_goods_stock (batchId, grade, quantity, dateAdded, createdBy)
         VALUES (?, ?, ?, ?, ?)`,
        [null, data.grade, -quantity, dateAdded, createdBy]
      );

      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = FinishedGoodsStock;
