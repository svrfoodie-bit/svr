const { promisePool } = require('../config/database');

class Worker {
  static async generateWorkerId() {
    const [rows] = await promisePool.query('SELECT COUNT(*) as count FROM workers');
    const count = rows[0].count + 1;
    return `W${String(count).padStart(4, '0')}`;
  }

  static async create(data) {
    const workerId = data.workerId || await Worker.generateWorkerId();
    const query = `
      INSERT INTO workers (workerId, name, fatherName, dateOfBirth, mobileNumber, areaOfWork,
                          status, dailyWages, monthlyWages, notes, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await promisePool.query(query, [
      workerId,
      data.name,
      data.fatherName || null,
      data.dateOfBirth || data.joiningDate || null,
      data.mobileNumber || data.contactNumber || null,
      data.areaOfWork || data.type || null,
      data.status || 'Active',
      data.dailyWages || 0,
      data.monthlyWages || 0,
      data.notes || null,
      data.createdBy || 1
    ]);
    return result.insertId;
  }

  static async getAll(filters = {}) {
    let query = 'SELECT * FROM workers WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.areaOfWork) {
      query += ' AND areaOfWork = ?';
      params.push(filters.areaOfWork);
    }

    if (filters.search) {
      query += ' AND (name LIKE ? OR workerId LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY name ASC';
    const [rows] = await promisePool.query(query, params);
    return rows;
  }

  static async getActive() {
    const [rows] = await promisePool.query('SELECT * FROM workers WHERE status = "Active" ORDER BY name ASC');
    return rows;
  }

  static async getById(id) {
    const [rows] = await promisePool.query('SELECT * FROM workers WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async update(id, data) {
    const updates = [];
    const params = [];

    if (data.contactNumber && !data.mobileNumber) data.mobileNumber = data.contactNumber;
    if (data.type && !data.areaOfWork) data.areaOfWork = data.type;
    if (data.joiningDate && !data.dateOfBirth) data.dateOfBirth = data.joiningDate;

    Object.entries(data).forEach(([key, value]) => {
      if (['name', 'fatherName', 'dateOfBirth', 'mobileNumber', 'areaOfWork', 'status', 'dailyWages', 'monthlyWages', 'notes'].includes(key)) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updates.length === 0) return false;
    params.push(id);
    const query = `UPDATE workers SET ${updates.join(', ')}, updatedAt = NOW() WHERE id = ?`;
    const [result] = await promisePool.query(query, params);
    return result.affectedRows > 0;
  }

  static async getDeleteDependencies(id) {
    const dependencyQueries = [
      ['daily work entries', 'SELECT COUNT(*) AS count FROM daily_work WHERE workerId = ?'],
      ['worker advances', 'SELECT COUNT(*) AS count FROM worker_advances WHERE workerId = ?'],
      ['attendance records', 'SELECT COUNT(*) AS count FROM attendance WHERE workerId = ?'],
      ['payroll records', 'SELECT COUNT(*) AS count FROM payroll WHERE workerId = ?'],
    ];

    const results = await Promise.all(
      dependencyQueries.map(async ([label, query]) => {
        const [rows] = await promisePool.query(query, [id]);
        return { label, count: rows[0]?.count || 0 };
      })
    );

    return results.filter((item) => item.count > 0);
  }

  static async delete(id) {
    const dependencies = await Worker.getDeleteDependencies(id);
    if (dependencies.length > 0) {
      const details = dependencies.map((item) => `${item.count} ${item.label}`).join(', ');
      const error = new Error(`Cannot delete worker because linked records exist: ${details}. Deactivate the worker instead.`);
      error.statusCode = 400;
      throw error;
    }

    const [result] = await promisePool.query('DELETE FROM workers WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getTotalCount() {
    const [rows] = await promisePool.query('SELECT COUNT(*) as count FROM workers WHERE status = "Active"');
    return rows[0]?.count || 0;
  }
}

module.exports = Worker;
