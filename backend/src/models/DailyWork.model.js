const { promisePool } = require('../config/database');

class DailyWork {
  static async migrate() {
    try {
      await promisePool.query(`
        ALTER TABLE daily_work
        ADD COLUMN IF NOT EXISTS assignedQuantity DECIMAL(10, 2) NULL AFTER workType,
        ADD COLUMN IF NOT EXISTS status ENUM('Pending', 'In Progress', 'Completed') DEFAULT 'In Progress' AFTER bonusEligible
      `);
    } catch (err) {
      try {
        await promisePool.query(`
          ALTER TABLE daily_work
          ADD COLUMN assignedQuantity DECIMAL(10, 2) NULL AFTER workType
        `);
      } catch {
        // Column may already exist or DB may not support this ALTER syntax.
      }
      try {
        await promisePool.query(`
          ALTER TABLE daily_work
          ADD COLUMN status ENUM('Pending', 'In Progress', 'Completed') DEFAULT 'In Progress' AFTER bonusEligible
        `);
      } catch {
        // Column may already exist or DB may not support this ALTER syntax.
      }
    }
  }

  static getStatusFromQuantities(assignedQuantity, completedQuantity, fallbackStatus) {
    if (completedQuantity <= 0) return 'Pending';
    if (assignedQuantity > 0 && completedQuantity >= assignedQuantity) return 'Completed';
    return ['Pending', 'In Progress', 'Completed'].includes(fallbackStatus) ? fallbackStatus : 'In Progress';
  }

  static async create(data) {
    const quantity = parseFloat(data.quantity ?? data.completedQuantity) || 0;
    const assignedQuantity = parseFloat(data.assignedQuantity) || quantity;
    const rate = parseFloat(data.rate) || 0;
    const baseWage = quantity * rate;
    const bonusAmount = parseFloat(data.bonusAmount) || 0;
    const totalAmount = data.totalAmount ?? (baseWage + bonusAmount);
    const status = this.getStatusFromQuantities(assignedQuantity, quantity, data.status);
    const query = `
      INSERT INTO daily_work (workerId, workDate, workType, assignedQuantity, quantity, rate, totalAmount,
                              bonusAmount, bonusEligible, status, notes, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await promisePool.query(query, [
      data.workerId,
      data.workDate || data.date,
      data.workType,
      assignedQuantity,
      quantity,
      rate,
      totalAmount,
      bonusAmount,
      data.bonusEligible ? 1 : 0,
      status,
      data.notes || data.remarks || null,
      data.createdBy || 1
    ]);
    return result.insertId;
  }

  static async getAll(filters = {}) {
    let query = `
      SELECT 
        dw.*,
        w.name as workerName,
        COALESCE(dw.assignedQuantity, dw.quantity, 0) as assignedQuantity,
        COALESCE(dw.quantity, 0) as completedQuantity,
        GREATEST(COALESCE(dw.assignedQuantity, dw.quantity, 0) - COALESCE(dw.quantity, 0), 0) as pendingQuantity,
        (COALESCE(dw.quantity, 0) * COALESCE(dw.rate, 0)) as baseWage,
        COALESCE(dw.bonusAmount, GREATEST(COALESCE(dw.totalAmount, 0) - (COALESCE(dw.quantity, 0) * COALESCE(dw.rate, 0)), 0)) as bonusAmount,
        COALESCE(dw.totalAmount, 0) as totalPay
      FROM daily_work dw
      JOIN workers w ON dw.workerId = w.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.workerId) {
      query += ' AND dw.workerId = ?';
      params.push(filters.workerId);
    }

    if (filters.workType) {
      query += ' AND dw.workType = ?';
      params.push(filters.workType);
    }

    if (filters.status) {
      query += " AND COALESCE(dw.status, 'In Progress') = ?";
      params.push(filters.status);
    }

    if (filters.date) {
      query += ' AND DATE(dw.workDate) = ?';
      params.push(filters.date);
    }

    if (filters.startDate && filters.endDate) {
      query += ' AND dw.workDate BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }

    query += ' ORDER BY dw.workDate DESC';
    const [rows] = await promisePool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const [rows] = await promisePool.query(`
      SELECT
        dw.*,
        COALESCE(dw.status, 'In Progress') as status,
        COALESCE(dw.assignedQuantity, dw.quantity, 0) as assignedQuantity,
        COALESCE(dw.quantity, 0) as completedQuantity,
        GREATEST(COALESCE(dw.assignedQuantity, dw.quantity, 0) - COALESCE(dw.quantity, 0), 0) as pendingQuantity,
        (COALESCE(dw.quantity, 0) * COALESCE(dw.rate, 0)) as baseWage,
        COALESCE(dw.bonusAmount, GREATEST(COALESCE(dw.totalAmount, 0) - (COALESCE(dw.quantity, 0) * COALESCE(dw.rate, 0)), 0)) as bonusAmount,
        COALESCE(dw.totalAmount, 0) as totalPay
      FROM daily_work dw
      WHERE dw.id = ?
    `, [id]);
    return rows[0] || null;
  }

  static async update(id, data) {
    const updates = [];
    const params = [];

    // Normalize field names from frontend
    if (data.date) data.workDate = data.date;
    if (data.remarks) data.notes = data.remarks;
    if (data.status && !['Pending', 'In Progress', 'Completed'].includes(data.status)) {
      delete data.status;
    }
    if (data.completedQuantity !== undefined && data.quantity === undefined) {
      data.quantity = data.completedQuantity;
    }
    const quantity = parseFloat(data.quantity) || 0;
    const assignedQuantity = parseFloat(data.assignedQuantity) || quantity;
    const rate = parseFloat(data.rate) || 0;
    const bonusAmount = parseFloat(data.bonusAmount) || 0;
    if (data.totalAmount === undefined && (data.quantity !== undefined || data.rate !== undefined || data.bonusAmount !== undefined)) {
      data.totalAmount = (quantity * rate) + bonusAmount;
    }
    if (data.bonusAmount === undefined && (data.quantity !== undefined || data.rate !== undefined || data.totalAmount !== undefined)) {
      data.bonusAmount = bonusAmount;
    }
    if ((data.quantity !== undefined || data.assignedQuantity !== undefined) && data.status === undefined) {
      data.status = this.getStatusFromQuantities(assignedQuantity, quantity);
    }

    Object.entries(data).forEach(([key, value]) => {
      if (['workerId', 'workDate', 'workType', 'assignedQuantity', 'quantity', 'rate', 'totalAmount', 'bonusAmount', 'bonusEligible', 'status', 'notes'].includes(key)) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updates.length === 0) return false;
    params.push(id);
    const query = `UPDATE daily_work SET ${updates.join(', ')}, updatedAt = NOW() WHERE id = ?`;
    const [result] = await promisePool.query(query, params);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await promisePool.query('DELETE FROM daily_work WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getSummary(filters = {}) {
    let query = `
      SELECT 
        COUNT(*) as totalEntries,
        SUM(quantity) as totalQuantity,
        SUM(COALESCE(assignedQuantity, quantity, 0)) as totalAssignedQuantity,
        SUM(GREATEST(COALESCE(assignedQuantity, quantity, 0) - COALESCE(quantity, 0), 0)) as totalPendingQuantity,
        SUM(COALESCE(quantity, 0) * COALESCE(rate, 0)) as totalBaseWage,
        SUM(COALESCE(bonusAmount, GREATEST(COALESCE(totalAmount, 0) - (COALESCE(quantity, 0) * COALESCE(rate, 0)), 0))) as totalBonus,
        SUM(COALESCE(totalAmount, 0)) as totalPay,
        COUNT(DISTINCT workerId) as uniqueWorkers,
        SUM(CASE WHEN COALESCE(status, 'In Progress') = 'Pending' THEN 1 ELSE 0 END) as pendingTasks,
        SUM(CASE WHEN COALESCE(status, 'In Progress') = 'In Progress' THEN 1 ELSE 0 END) as inProgressTasks,
        SUM(CASE WHEN COALESCE(status, 'In Progress') = 'Completed' THEN 1 ELSE 0 END) as completedTasks
      FROM daily_work WHERE 1=1
    `;
    const params = [];

    if (filters.workerId) {
      query += ' AND workerId = ?';
      params.push(filters.workerId);
    }

    if (filters.workType) {
      query += ' AND workType = ?';
      params.push(filters.workType);
    }

    if (filters.status) {
      query += " AND COALESCE(status, 'In Progress') = ?";
      params.push(filters.status);
    }

    if (filters.date) {
      query += ' AND DATE(workDate) = ?';
      params.push(filters.date);
    }

    if (filters.startDate && filters.endDate) {
      query += ' AND workDate BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }

    const [rows] = await promisePool.query(query, params);
    return rows[0];
  }

  static getAllWorkTypes() {
    return ['Regular', 'Overtime', 'Maintenance', 'Training'];
  }
}

module.exports = DailyWork;
