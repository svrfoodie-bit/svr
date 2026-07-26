const { promisePool } = require('../config/database');

class ExportHistory {
  /**
   * Create export history table
   */
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS export_history (
        id INT PRIMARY KEY AUTO_INCREMENT,
        type ENUM('EMAIL', 'SCHEDULED', 'MANUAL') NOT NULL,
        module ENUM('SALES', 'PAYMENTS', 'RAW_PURCHASE', 'JOB_WORK', 'EXPENSES', 'CUSTOMERS') NOT NULL,
        format ENUM('EXCEL', 'PDF') NOT NULL,
        recipients TEXT,
        status ENUM('SUCCESS', 'FAILED', 'IN_PROGRESS') DEFAULT 'IN_PROGRESS',
        record_count INT DEFAULT 0,
        file_size INT DEFAULT 0,
        file_path VARCHAR(500),
        error_message TEXT,
        executed_by VARCHAR(100),
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_type (type),
        INDEX idx_module (module),
        INDEX idx_status (status),
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    try {
      await promisePool.query(query);
      return { success: true, message: 'Export history table created successfully' };
    } catch (error) {
      throw new Error(`Failed to create export history table: ${error.message}`);
    }
  }

  /**
   * Get all export history with optional filters
   */
  static async ensureTable() {
    try { await ExportHistory.createTable(); } catch {}
  }

  static async findAll(filters = {}) {
    await ExportHistory.ensureTable();
    let query = 'SELECT * FROM export_history WHERE 1=1';
    const params = [];

    // Apply filters
    if (filters.type && filters.type !== 'ALL') {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters.module) {
      query += ' AND module = ?';
      params.push(filters.module);
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.userId) {
      query += ' AND user_id = ?';
      params.push(filters.userId);
    }

    if (filters.startDate) {
      query += ' AND created_at >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ' AND created_at <= ?';
      params.push(filters.endDate);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    try {
      const [history] = await promisePool.query(query, params);
      return history;
    } catch (error) {
      throw new Error(`Failed to fetch export history: ${error.message}`);
    }
  }

  /**
   * Get export history by ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM export_history WHERE id = ?';

    try {
      const [history] = await promisePool.query(query, [id]);
      return history.length > 0 ? history[0] : null;
    } catch (error) {
      throw new Error(`Failed to fetch export history: ${error.message}`);
    }
  }

  /**
   * Create new export history record
   */
  static async create(historyData) {
    const {
      type,
      module,
      format,
      recipients,
      status,
      recordCount,
      fileSize,
      filePath,
      errorMessage,
      executedBy,
      userId
    } = historyData;

    const query = `
      INSERT INTO export_history
      (type, module, format, recipients, status, record_count, file_size, file_path, error_message, executed_by, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const [result] = await promisePool.query(query, [
        type,
        module,
        format,
        recipients || null,
        status || 'IN_PROGRESS',
        recordCount || 0,
        fileSize || 0,
        filePath || null,
        errorMessage || null,
        executedBy || 'System',
        userId || null
      ]);

      return await this.findById(result.insertId);
    } catch (error) {
      throw new Error(`Failed to create export history: ${error.message}`);
    }
  }

  /**
   * Update export history status
   */
  static async updateStatus(id, status, additionalData = {}) {
    const updates = ['status = ?'];
    const params = [status];

    if (additionalData.recordCount !== undefined) {
      updates.push('record_count = ?');
      params.push(additionalData.recordCount);
    }

    if (additionalData.fileSize !== undefined) {
      updates.push('file_size = ?');
      params.push(additionalData.fileSize);
    }

    if (additionalData.filePath) {
      updates.push('file_path = ?');
      params.push(additionalData.filePath);
    }

    if (additionalData.errorMessage) {
      updates.push('error_message = ?');
      params.push(additionalData.errorMessage);
    }

    params.push(id);

    const query = `UPDATE export_history SET ${updates.join(', ')} WHERE id = ?`;

    try {
      await promisePool.query(query, params);
      return await this.findById(id);
    } catch (error) {
      throw new Error(`Failed to update export history: ${error.message}`);
    }
  }

  /**
   * Delete old export history records
   */
  static async deleteOld(daysToKeep = 90) {
    const query = `
      DELETE FROM export_history
      WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    `;

    try {
      const [result] = await promisePool.query(query, [daysToKeep]);
      return result.affectedRows;
    } catch (error) {
      throw new Error(`Failed to delete old history: ${error.message}`);
    }
  }

  /**
   * Get statistics
   */
  static async getStatistics(filters = {}) {
    let query = `
      SELECT
        type,
        status,
        COUNT(*) as count,
        SUM(record_count) as total_records,
        SUM(file_size) as total_size
      FROM export_history
      WHERE 1=1
    `;

    const params = [];

    if (filters.startDate) {
      query += ' AND created_at >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ' AND created_at <= ?';
      params.push(filters.endDate);
    }

    query += ' GROUP BY type, status';

    try {
      const [stats] = await promisePool.query(query, params);
      return stats;
    } catch (error) {
      throw new Error(`Failed to fetch statistics: ${error.message}`);
    }
  }
}

module.exports = ExportHistory;
