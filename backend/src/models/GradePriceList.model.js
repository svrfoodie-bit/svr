const { promisePool } = require('../config/database');

const DEFAULT_GRADES = [
  { grade: 'Full Kaju', description: 'Whole kaju / full kernels', minPrice: 800, maxPrice: 1200, pricePerKg: 1000 },
  { grade: 'Split Kaju', description: 'Split kaju pieces', minPrice: 600, maxPrice: 950, pricePerKg: 800 },
  { grade: '4 Pieces', description: 'Kaju broken into 4 pieces', minPrice: 450, maxPrice: 750, pricePerKg: 600 },
  { grade: '8 Pieces', description: 'Kaju broken into 8 pieces', minPrice: 300, maxPrice: 550, pricePerKg: 420 },
  { grade: 'Chura', description: 'Small kaju bits / chura', minPrice: 150, maxPrice: 350, pricePerKg: 250 },
];

const ACTIVE_GRADES = DEFAULT_GRADES.map((item) => item.grade);
const GRADE_ORDER_SQL = "'Full Kaju','Split Kaju','4 Pieces','8 Pieces','Chura'";

class GradePriceList {
  static async createTable() {
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS grade_prices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        grade VARCHAR(100) NOT NULL UNIQUE,
        description VARCHAR(255),
        pricePerKg DECIMAL(10,2) NOT NULL DEFAULT 0,
        minPrice DECIMAL(10,2) DEFAULT 0,
        maxPrice DECIMAL(10,2) DEFAULT 0,
        isActive TINYINT(1) DEFAULT 1,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    try {
      await promisePool.query('ALTER TABLE grade_prices MODIFY grade VARCHAR(100) NOT NULL');
    } catch {
      // Column is already compatible or the DB does not need this change.
    }

    for (const grade of DEFAULT_GRADES) {
      await promisePool.query(
        `INSERT INTO grade_prices (grade, description, pricePerKg, minPrice, maxPrice, isActive)
         VALUES (?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
           description = VALUES(description),
           minPrice = VALUES(minPrice),
           maxPrice = VALUES(maxPrice),
           isActive = 1`,
        [grade.grade, grade.description, grade.pricePerKg, grade.minPrice, grade.maxPrice]
      );
    }

    await promisePool.query(
      `UPDATE grade_prices SET isActive = 0 WHERE grade NOT IN (${ACTIVE_GRADES.map(() => '?').join(',')})`,
      ACTIVE_GRADES
    );
  }

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
