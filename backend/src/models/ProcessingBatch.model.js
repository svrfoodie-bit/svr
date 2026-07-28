const { promisePool } = require('../config/database');

class ProcessingBatch {
  static async generateBatchNumber() {
    const [rows] = await promisePool.query('SELECT COUNT(*) as count FROM processing_batches');
    const count = rows[0].count + 1;
    return `BATCH-${String(count).padStart(4, '0')}`;
  }

  static async create(data) {
    const batchNumber = data.batchNumber || await ProcessingBatch.generateBatchNumber();
    const query = `
      INSERT INTO processing_batches (batchNumber, startDate, endDate, rawInputQuantity,
                                      quantity, grade, finishedGrade, status, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await promisePool.query(query, [
      batchNumber,
      data.startDate || data.date,
      data.endDate || null,
      data.rawInputQuantity,
      data.quantity || 0,
      data.grade || data.rawType || 'Raw',
      data.finishedGrade || null,
      data.status || 'In Progress',
      data.createdBy || 1
    ]);
    return result.insertId;
  }

  static async getAll(filters = {}) {
    let query = 'SELECT * FROM processing_batches WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(this.normalizeStatus(filters.status));
    }

    if (filters.rawType) {
      query += ' AND grade = ?';
      params.push(filters.rawType);
    }

    if (filters.startDate && filters.endDate) {
      query += ' AND startDate BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }

    query += ' ORDER BY startDate DESC';
    const [rows] = await promisePool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const [rows] = await promisePool.query('SELECT * FROM processing_batches WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static normalizeYieldItems(items = []) {
    if (!Array.isArray(items)) return [];
    return items
      .map((item) => ({
        grade: item.grade,
        quantity: parseFloat(item.quantity) || 0,
      }))
      .filter((item) => item.grade && item.quantity > 0);
  }

  static normalizeStatus(status) {
    if (status === 'Open') return 'In Progress';
    if (status === 'Closed') return 'Completed';
    return status;
  }

  static async update(id, data) {
    const connection = await promisePool.getConnection();

    try {
      await connection.beginTransaction();

      const [existingRows] = await connection.query('SELECT * FROM processing_batches WHERE id = ?', [id]);
      const existingBatch = existingRows[0];
      if (!existingBatch) {
        await connection.rollback();
        return false;
      }

      const updates = [];
      const params = [];

      Object.entries(data).forEach(([key, value]) => {
        if (['endDate', 'quantity', 'wastage', 'grade', 'finishedGrade', 'status'].includes(key)) {
          updates.push(`${key} = ?`);
          params.push(key === 'status' ? this.normalizeStatus(value) : value);
        }
      });

      if (updates.length > 0) {
        params.push(id);
        const query = `UPDATE processing_batches SET ${updates.join(', ')}, updatedAt = NOW() WHERE id = ?`;
        await connection.query(query, params);
      }

      const yieldItems = this.normalizeYieldItems(data.yieldItems || data.yieldData);
      const shouldCreateStock = (data.status === 'Completed' || data.status === 'Closed') && yieldItems.length > 0;

      if (shouldCreateStock) {
        const [stockRows] = await connection.query(
          'SELECT COUNT(*) AS count FROM finished_goods_stock WHERE batchId = ?',
          [id]
        );

        if ((stockRows[0]?.count || 0) === 0) {
          const stockDate = data.endDate || existingBatch.endDate || existingBatch.startDate || new Date();
          await Promise.all(yieldItems.map((item) =>
            connection.query(
              `INSERT INTO finished_goods_stock (batchId, grade, quantity, dateAdded, createdBy)
               VALUES (?, ?, ?, ?, ?)`,
              [id, item.grade, item.quantity, stockDate, data.createdBy || existingBatch.createdBy || 1]
            )
          ));
        }
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async delete(id) {
    const [result] = await promisePool.query('DELETE FROM processing_batches WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getSummary(filters = {}) {
    let query = `
      SELECT 
        COUNT(*) as totalBatches,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as inProgressCount,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completedCount,
        SUM(rawInputQuantity) as totalRawInput,
        SUM(quantity) as totalOutput
      FROM processing_batches WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(this.normalizeStatus(filters.status));
    }

    if (filters.rawType) {
      query += ' AND grade = ?';
      params.push(filters.rawType);
    }

    if (filters.startDate && filters.endDate) {
      query += ' AND startDate BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }

    const [rows] = await promisePool.query(query, params);
    return rows[0];
  }

  static getGrades() {
    return ['LWP', 'HLP', 'BBL', 'Splits', 'Kernels'];
  }
}

module.exports = ProcessingBatch;
