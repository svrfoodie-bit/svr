const { promisePool } = require('../config/database');

class AutomationLog {
  static async createTable() {
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS automation_logs (
        id       INT AUTO_INCREMENT PRIMARY KEY,
        jobType  ENUM('payment_reminder','stock_alert','depreciation','gst_compile') NOT NULL,
        status   ENUM('success','failed','skipped') NOT NULL,
        summary  VARCHAR(500),
        details  JSON,
        runAt    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  static async create({ jobType, status, summary = '', details = {} }) {
    const [result] = await promisePool.query(
      'INSERT INTO automation_logs (jobType, status, summary, details) VALUES (?, ?, ?, ?)',
      [jobType, status, summary, JSON.stringify(details)]
    );
    return result.insertId;
  }

  static async getRecent(limit = 50) {
    const [rows] = await promisePool.query(
      'SELECT * FROM automation_logs ORDER BY runAt DESC LIMIT ?', [limit]
    );
    return rows;
  }

  static async getByType(jobType, limit = 20) {
    const [rows] = await promisePool.query(
      'SELECT * FROM automation_logs WHERE jobType = ? ORDER BY runAt DESC LIMIT ?',
      [jobType, limit]
    );
    return rows;
  }

  static async getLastRun(jobType) {
    const [rows] = await promisePool.query(
      'SELECT * FROM automation_logs WHERE jobType = ? ORDER BY runAt DESC LIMIT 1', [jobType]
    );
    return rows[0] || null;
  }

  // Keep logs only for 90 days
  static async purgeOld() {
    await promisePool.query(
      'DELETE FROM automation_logs WHERE runAt < DATE_SUB(NOW(), INTERVAL 90 DAY)'
    );
  }
}

module.exports = AutomationLog;
