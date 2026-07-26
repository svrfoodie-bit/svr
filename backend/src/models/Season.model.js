const { promisePool } = require('../config/database');

class Season {
  static async createTable() {
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS seasons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        startDate DATE NOT NULL,
        endDate DATE NOT NULL,
        targetProcurementKg DECIMAL(12,2) DEFAULT 0,
        targetRevenueAmount DECIMAL(12,2) DEFAULT 0,
        budgetAmount DECIMAL(12,2) DEFAULT 0,
        expectedWorkers INT DEFAULT 0,
        notes TEXT,
        status ENUM('Planned','Active','Completed','Cancelled') DEFAULT 'Planned',
        createdBy INT DEFAULT 1,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  }

  static async create(data) {
    const [result] = await promisePool.query(`
      INSERT INTO seasons (name, startDate, endDate, targetProcurementKg, targetRevenueAmount,
        budgetAmount, expectedWorkers, notes, status, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.name, data.startDate, data.endDate,
      data.targetProcurementKg || 0, data.targetRevenueAmount || 0,
      data.budgetAmount || 0, data.expectedWorkers || 0,
      data.notes || null, data.status || 'Planned',
      data.createdBy || 1,
    ]);
    return result.insertId;
  }

  static async getAll() {
    const [rows] = await promisePool.query(`
      SELECT s.*,
        (SELECT COALESCE(SUM(quantity),0) FROM raw_purchases
          WHERE purchaseDate BETWEEN s.startDate AND s.endDate) AS actualProcurementKg,
        (SELECT COALESCE(SUM(totalAmount),0) FROM raw_purchases
          WHERE purchaseDate BETWEEN s.startDate AND s.endDate) AS actualProcurementCost,
        (SELECT COALESCE(SUM(totalAmount),0) FROM sales_orders
          WHERE DATE(createdAt) BETWEEN s.startDate AND s.endDate) AS actualRevenue,
        (SELECT COALESCE(SUM(amount),0) FROM expenses
          WHERE date BETWEEN s.startDate AND s.endDate) AS actualExpenses
      FROM seasons s
      ORDER BY s.startDate DESC
    `);
    return rows;
  }

  static async getById(id) {
    // Get season with actuals scoped to the season's date range
    const [seasons] = await promisePool.query('SELECT * FROM seasons WHERE id = ?', [id]);
    if (!seasons.length) return null;
    const s = seasons[0];

    const [rp] = await promisePool.query(`
      SELECT COALESCE(SUM(quantity),0) AS actualKg, COALESCE(SUM(totalAmount),0) AS actualCost
      FROM raw_purchases WHERE purchaseDate BETWEEN ? AND ?
    `, [s.startDate, s.endDate]);

    const [so] = await promisePool.query(`
      SELECT COALESCE(SUM(totalAmount),0) AS actualRevenue, COUNT(*) AS orderCount
      FROM sales_orders WHERE DATE(createdAt) BETWEEN ? AND ?
    `, [s.startDate, s.endDate]);

    const [exp] = await promisePool.query(`
      SELECT COALESCE(SUM(amount),0) AS actualExpenses
      FROM expenses WHERE date BETWEEN ? AND ?
    `, [s.startDate, s.endDate]);

    const [jw] = await promisePool.query(`
      SELECT COALESCE(SUM(quantityReceived * ratePerKg),0) AS actualJobWork
      FROM job_work WHERE startDate BETWEEN ? AND ?
    `, [s.startDate, s.endDate]);

    const [dw] = await promisePool.query(`
      SELECT COALESCE(SUM(totalAmount),0) AS actualWages
      FROM daily_work WHERE workDate BETWEEN ? AND ?
    `, [s.startDate, s.endDate]);

    return {
      ...s,
      actuals: {
        procurementKg: parseFloat(rp[0].actualKg),
        procurementCost: parseFloat(rp[0].actualCost),
        revenue: parseFloat(so[0].actualRevenue),
        orderCount: so[0].orderCount,
        expenses: parseFloat(exp[0].actualExpenses),
        jobWorkCost: parseFloat(jw[0].actualJobWork),
        wagesCost: parseFloat(dw[0].actualWages),
      },
    };
  }

  static async update(id, data) {
    const allowed = ['name','startDate','endDate','targetProcurementKg','targetRevenueAmount',
                     'budgetAmount','expectedWorkers','notes','status'];
    const updates = [];
    const params = [];
    Object.entries(data).forEach(([k, v]) => {
      if (allowed.includes(k)) { updates.push(`${k} = ?`); params.push(v); }
    });
    if (!updates.length) return false;
    params.push(id);
    const [result] = await promisePool.query(
      `UPDATE seasons SET ${updates.join(', ')}, updatedAt = NOW() WHERE id = ?`, params
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await promisePool.query('DELETE FROM seasons WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Season;
