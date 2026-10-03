const { promisePool } = require('../config/database');

// Master list of cashew types used by CashewFlowX stock entries.
class CashewFlowXCashewType {
  static async create(data) {
    const [result] = await promisePool.query(
      'INSERT INTO cashew_flow_x_cashew_types (cashewTypeName, status) VALUES (?, ?)',
      [data.cashewTypeName.trim(), data.status || 'Active']
    );
    return result.insertId;
  }

  static async getAll({ includeInactive = false } = {}) {
    const [rows] = await promisePool.query(
      `SELECT t.*, COUNT(s.id) AS usageCount
       FROM cashew_flow_x_cashew_types t
       LEFT JOIN cashew_flow_x_stock_entries s ON s.cashewTypeId = t.id
       ${includeInactive ? '' : "WHERE t.status = 'Active'"}
       GROUP BY t.id, t.cashewTypeName, t.status, t.createdAt, t.updatedAt
       ORDER BY t.id ASC`
    );
    return rows;
  }

  static async getById(id) {
    const [rows] = await promisePool.query('SELECT * FROM cashew_flow_x_cashew_types WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async findByName(name, excludeId = null) {
    const [rows] = await promisePool.query(
      'SELECT id FROM cashew_flow_x_cashew_types WHERE cashewTypeName = ? AND id <> ?',
      [name.trim(), excludeId || 0]
    );
    return rows[0] || null;
  }

  static async update(id, data) {
    const [result] = await promisePool.query(
      'UPDATE cashew_flow_x_cashew_types SET cashewTypeName = ?, status = ? WHERE id = ?',
      [data.cashewTypeName.trim(), data.status || 'Active', id]
    );
    return result.affectedRows > 0;
  }

  static async countUsage(id) {
    const [rows] = await promisePool.query(
      'SELECT COUNT(*) AS count FROM cashew_flow_x_stock_entries WHERE cashewTypeId = ?',
      [id]
    );
    return Number(rows[0].count);
  }

  static async delete(id) {
    const [result] = await promisePool.query('DELETE FROM cashew_flow_x_cashew_types WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = CashewFlowXCashewType;
