const { promisePool } = require('../config/database');

class Capital {
  static async generateCapitalCode() {
    const [rows] = await promisePool.query('SELECT COUNT(*) as count FROM capital_investments');
    return `CAP-${String(rows[0].count + 1).padStart(4, '0')}`;
  }

  static async createTable() {
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS capital_investments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        capitalCode VARCHAR(20) UNIQUE NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        investmentDate DATE NOT NULL,
        description VARCHAR(200) NOT NULL,
        notes TEXT,
        createdBy INT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  }

  static async create(data) {
    const capitalCode = await Capital.generateCapitalCode();
    const [result] = await promisePool.query(
      `INSERT INTO capital_investments
        (capitalCode, amount, investmentDate, description, notes, createdBy)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        capitalCode,
        data.amount,
        data.investmentDate,
        data.description,
        data.notes || null,
        data.createdBy || 1,
      ]
    );
    return result.insertId;
  }

  static async getAll() {
    const [rows] = await promisePool.query(
      'SELECT * FROM capital_investments ORDER BY investmentDate DESC'
    );
    return rows;
  }

  static async getById(id) {
    const [rows] = await promisePool.query(
      'SELECT * FROM capital_investments WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async update(id, data) {
    const updates = [];
    const params = [];

    ['amount', 'investmentDate', 'description', 'notes'].forEach((key) => {
      if (data[key] !== undefined) {
        updates.push(`${key} = ?`);
        params.push(data[key]);
      }
    });

    if (updates.length === 0) return false;
    params.push(id);
    const [result] = await promisePool.query(
      `UPDATE capital_investments SET ${updates.join(', ')}, updatedAt = NOW() WHERE id = ?`,
      params
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await promisePool.query(
      'DELETE FROM capital_investments WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async getTotalInvested() {
    const [rows] = await promisePool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM capital_investments'
    );
    return parseFloat(rows[0].total);
  }
}

module.exports = Capital;
