const { promisePool } = require('../config/database');

class ExportSchedule {
  /**
   * Create export schedules table
   */
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS export_schedules (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        module ENUM('SALES', 'PAYMENTS', 'RAW_PURCHASE', 'JOB_WORK', 'EXPENSES', 'CUSTOMERS') NOT NULL,
        frequency ENUM('DAILY', 'WEEKLY', 'MONTHLY') NOT NULL,
        time TIME NOT NULL,
        format ENUM('EXCEL', 'PDF') NOT NULL,
        recipients TEXT NOT NULL,
        template_id INT,
        status ENUM('ACTIVE', 'PAUSED') DEFAULT 'ACTIVE',
        last_run TIMESTAMP NULL,
        next_run TIMESTAMP NULL,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_next_run (next_run),
        INDEX idx_frequency (frequency),
        FOREIGN KEY (template_id) REFERENCES export_templates(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    try {
      await promisePool.query(query);
      return { success: true, message: 'Export schedules table created successfully' };
    } catch (error) {
      throw new Error(`Failed to create export schedules table: ${error.message}`);
    }
  }

  /**
   * Calculate next run time based on frequency
   */
  static calculateNextRun(frequency, time) {
    const now = new Date();
    const [hours, minutes] = time.split(':');

    let nextRun = new Date();
    nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    switch (frequency) {
      case 'DAILY':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;

      case 'WEEKLY':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 7);
        }
        break;

      case 'MONTHLY':
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;
    }

    return nextRun;
  }

  /**
   * Get all schedules
   */
  static async ensureTable() {
    try { await ExportSchedule.createTable(); } catch {}
  }

  static async findAll(filters = {}) {
    await ExportSchedule.ensureTable();
    let query = 'SELECT * FROM export_schedules WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.userId) {
      query += ' AND created_by = ?';
      params.push(filters.userId);
    }

    query += ' ORDER BY next_run ASC';

    try {
      const [schedules] = await promisePool.query(query, params);
      return schedules;
    } catch (error) {
      throw new Error(`Failed to fetch schedules: ${error.message}`);
    }
  }

  /**
   * Get schedule by ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM export_schedules WHERE id = ?';

    try {
      const [schedules] = await promisePool.query(query, [id]);
      return schedules.length > 0 ? schedules[0] : null;
    } catch (error) {
      throw new Error(`Failed to fetch schedule: ${error.message}`);
    }
  }

  /**
   * Get schedules that are due to run
   */
  static async findDue() {
    const query = `
      SELECT * FROM export_schedules
      WHERE status = 'ACTIVE'
      AND next_run <= NOW()
      ORDER BY next_run ASC
    `;

    try {
      const [schedules] = await promisePool.query(query);
      return schedules;
    } catch (error) {
      throw new Error(`Failed to fetch due schedules: ${error.message}`);
    }
  }

  /**
   * Create new schedule
   */
  static async create(scheduleData) {
    const {
      name,
      module,
      frequency,
      time,
      format,
      recipients,
      templateId,
      status,
      createdBy
    } = scheduleData;

    const nextRun = this.calculateNextRun(frequency, time);

    const query = `
      INSERT INTO export_schedules
      (name, module, frequency, time, format, recipients, template_id, status, next_run, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const [result] = await promisePool.query(query, [
        name,
        module,
        frequency,
        time,
        format,
        recipients,
        templateId || null,
        status || 'ACTIVE',
        nextRun,
        createdBy
      ]);

      return await this.findById(result.insertId);
    } catch (error) {
      throw new Error(`Failed to create schedule: ${error.message}`);
    }
  }

  /**
   * Update schedule
   */
  static async update(id, scheduleData) {
    const {
      name,
      frequency,
      time,
      format,
      recipients,
      templateId,
      status
    } = scheduleData;

    // Recalculate next run if frequency or time changed
    let nextRun = null;
    if (frequency && time) {
      nextRun = this.calculateNextRun(frequency, time);
    }

    let query = `UPDATE export_schedules SET `;
    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }

    if (frequency) {
      updates.push('frequency = ?');
      params.push(frequency);
    }

    if (time) {
      updates.push('time = ?');
      params.push(time);
    }

    if (format) {
      updates.push('format = ?');
      params.push(format);
    }

    if (recipients) {
      updates.push('recipients = ?');
      params.push(recipients);
    }

    if (templateId !== undefined) {
      updates.push('template_id = ?');
      params.push(templateId);
    }

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }

    if (nextRun) {
      updates.push('next_run = ?');
      params.push(nextRun);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    query += updates.join(', ') + ' WHERE id = ?';
    params.push(id);

    try {
      await promisePool.query(query, params);
      return await this.findById(id);
    } catch (error) {
      throw new Error(`Failed to update schedule: ${error.message}`);
    }
  }

  /**
   * Update last run and calculate next run
   */
  static async markAsRun(id) {
    try {
      const schedule = await this.findById(id);

      if (!schedule) {
        throw new Error('Schedule not found');
      }

      const nextRun = this.calculateNextRun(schedule.frequency, schedule.time);

      await promisePool.query(
        'UPDATE export_schedules SET last_run = NOW(), next_run = ? WHERE id = ?',
        [nextRun, id]
      );

      return await this.findById(id);
    } catch (error) {
      throw new Error(`Failed to mark schedule as run: ${error.message}`);
    }
  }

  /**
   * Toggle schedule status
   */
  static async toggleStatus(id) {
    try {
      const schedule = await this.findById(id);

      if (!schedule) {
        throw new Error('Schedule not found');
      }

      const newStatus = schedule.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';

      await promisePool.query('UPDATE export_schedules SET status = ? WHERE id = ?', [newStatus, id]);

      return await this.findById(id);
    } catch (error) {
      throw new Error(`Failed to toggle schedule status: ${error.message}`);
    }
  }

  /**
   * Delete schedule
   */
  static async delete(id) {
    const query = 'DELETE FROM export_schedules WHERE id = ?';

    try {
      const [result] = await promisePool.query(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Failed to delete schedule: ${error.message}`);
    }
  }
}

module.exports = ExportSchedule;
