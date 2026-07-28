const { promisePool } = require('../config/database');

// Only used to bias the display order of the 5 legacy generic grade names;
// any other grade (e.g. real cashew grades like W180/W210) sorts before
// these alphabetically since MySQL FIELD() returns 0 for unmatched values.
const GRADE_ORDER_SQL = "'Full Kaju','Split Kaju','4 Pieces','8 Pieces','Chura'";

class GradePriceList {
  static async getAll(includeInactive = false) {
    const query = includeInactive
      ? `SELECT * FROM grade_prices ORDER BY FIELD(grade, ${GRADE_ORDER_SQL}), grade`
      : `SELECT * FROM grade_prices WHERE isActive = 1 ORDER BY FIELD(grade, ${GRADE_ORDER_SQL}), grade`;
    const [rows] = await promisePool.query(query);
    return rows;
  }

  static async getByGrade(grade) {
    const [rows] = await promisePool.query('SELECT * FROM grade_prices WHERE grade = ?', [grade]);
    return rows[0] || null;
  }

  static async getById(id) {
    const [rows] = await promisePool.query('SELECT * FROM grade_prices WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async update(id, data) {
    const allowed = ['pricePerKg', 'minPrice', 'maxPrice', 'description', 'isActive'];
    const updates = [];
    const params = [];

    Object.entries(data).forEach(([key, value]) => {
      if (allowed.includes(key)) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updates.length === 0) return false;
    params.push(id);
    const [result] = await promisePool.query(
      `UPDATE grade_prices SET ${updates.join(', ')}, updatedAt = NOW() WHERE id = ?`,
      params
    );
    return result.affectedRows > 0;
  }

  static async getGradeStockSummary() {
    const [rows] = await promisePool.query(`
      SELECT
        gp.id,
        gp.grade,
        gp.description,
        gp.pricePerKg,
        gp.minPrice,
        gp.maxPrice,
        gp.isActive,
        COALESCE(fgs.totalQuantity, 0) AS stockQuantity,
        COALESCE(fgs.totalQuantity, 0) * gp.pricePerKg AS stockValue
      FROM grade_prices gp
      LEFT JOIN (
        SELECT grade, SUM(quantity) AS totalQuantity
        FROM finished_goods_stock
        GROUP BY grade
      ) fgs ON gp.grade = fgs.grade
      WHERE gp.isActive = 1
      ORDER BY FIELD(gp.grade, ${GRADE_ORDER_SQL}), gp.grade
    `);
    return rows;
  }

  static async getGradeSalesSummary(filters = {}) {
    let query = `
      SELECT
        gp.grade,
        gp.pricePerKg AS standardPrice,
        COUNT(so.id) AS orderCount,
        COALESCE(SUM(so.quantity), 0) AS totalQuantitySold,
        COALESCE(SUM(so.totalAmount), 0) AS totalRevenue,
        COALESCE(AVG(so.ratePerUnit), 0) AS avgSellingPrice
      FROM grade_prices gp
      LEFT JOIN sales_orders so ON gp.grade = so.productGrade
      WHERE gp.isActive = 1
    `;
    const params = [];

    if (filters.startDate && filters.endDate) {
      query += ' AND so.orderDate BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }

    query += ` GROUP BY gp.grade, gp.pricePerKg ORDER BY FIELD(gp.grade, ${GRADE_ORDER_SQL}), gp.grade`;
    const [rows] = await promisePool.query(query, params);
    return rows;
  }
}

module.exports = GradePriceList;
