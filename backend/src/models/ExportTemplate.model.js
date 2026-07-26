const { promisePool } = require('../config/database');

class ExportTemplate {
  /**
   * Create export templates table
   */
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS export_templates (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        module ENUM('SALES', 'PAYMENTS', 'RAW_PURCHASE', 'JOB_WORK', 'EXPENSES', 'CUSTOMERS') NOT NULL,
        columns JSON NOT NULL,
        filters JSON,
        is_default BOOLEAN DEFAULT FALSE,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_module (module),
        INDEX idx_is_default (is_default),
        INDEX idx_created_by (created_by)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    try {
      await promisePool.query(query);
      return { success: true, message: 'Export templates table created successfully' };
    } catch (error) {
      throw new Error(`Failed to create export templates table: ${error.message}`);
    }
  }

  /**
   * Get all templates for a user
   */
  static async ensureTable() {
    try { await ExportTemplate.createTable(); } catch {}
  }

  static async findAll(userId) {
    await ExportTemplate.ensureTable();
    const query = `
      SELECT * FROM export_templates
      WHERE created_by = ? OR created_by IS NULL
      ORDER BY is_default DESC, created_at DESC
    `;

    try {
      const [templates] = await promisePool.query(query, [userId]);

      // Parse JSON columns
      return templates.map(template => ({
        ...template,
        columns: JSON.parse(template.columns),
        filters: template.filters ? JSON.parse(template.filters) : {}
      }));
    } catch (error) {
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }
  }

  /**
   * Get template by ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM export_templates WHERE id = ?';

    try {
      const [templates] = await promisePool.query(query, [id]);

      if (templates.length === 0) {
        return null;
      }

      const template = templates[0];
      return {
        ...template,
        columns: JSON.parse(template.columns),
        filters: template.filters ? JSON.parse(template.filters) : {}
      };
    } catch (error) {
      throw new Error(`Failed to fetch template: ${error.message}`);
    }
  }

  /**
   * Create new template
   */
  static async create(templateData) {
    const { name, module, columns, filters, isDefault, createdBy } = templateData;

    // If this should be the default, unset other defaults for this module
    if (isDefault) {
      await promisePool.query(
        'UPDATE export_templates SET is_default = FALSE WHERE module = ? AND created_by = ?',
        [module, createdBy]
      );
    }

    const query = `
      INSERT INTO export_templates (name, module, columns, filters, is_default, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    try {
      const [result] = await promisePool.query(query, [
        name,
        module,
        JSON.stringify(columns),
        JSON.stringify(filters || {}),
        isDefault || false,
        createdBy
      ]);

      return await this.findById(result.insertId);
    } catch (error) {
      throw new Error(`Failed to create template: ${error.message}`);
    }
  }

  /**
   * Update template
   */
  static async update(id, templateData) {
    const { name, columns, filters, isDefault } = templateData;

    // If setting as default, unset other defaults
    if (isDefault) {
      const template = await this.findById(id);
      if (template) {
        await promisePool.query(
          'UPDATE export_templates SET is_default = FALSE WHERE module = ? AND id != ?',
          [template.module, id]
        );
      }
    }

    const query = `
      UPDATE export_templates
      SET name = ?, columns = ?, filters = ?, is_default = ?
      WHERE id = ?
    `;

    try {
      await promisePool.query(query, [
        name,
        JSON.stringify(columns),
        JSON.stringify(filters || {}),
        isDefault || false,
        id
      ]);

      return await this.findById(id);
    } catch (error) {
      throw new Error(`Failed to update template: ${error.message}`);
    }
  }

  /**
   * Set template as default
   */
  static async setDefault(id) {
    try {
      const template = await this.findById(id);

      if (!template) {
        throw new Error('Template not found');
      }

      // Unset other defaults for this module
      await promisePool.query(
        'UPDATE export_templates SET is_default = FALSE WHERE module = ?',
        [template.module]
      );

      // Set this as default
      await promisePool.query(
        'UPDATE export_templates SET is_default = TRUE WHERE id = ?',
        [id]
      );

      return await this.findById(id);
    } catch (error) {
      throw new Error(`Failed to set default template: ${error.message}`);
    }
  }

  /**
   * Delete template
   */
  static async delete(id) {
    const query = 'DELETE FROM export_templates WHERE id = ?';

    try {
      const [result] = await promisePool.query(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Failed to delete template: ${error.message}`);
    }
  }
}

module.exports = ExportTemplate;
