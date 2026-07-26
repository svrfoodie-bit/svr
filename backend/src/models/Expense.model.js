const { promisePool } = require('../config/database');

class Expense {
  static async generateExpenseCode() {
    const [rows] = await promisePool.query('SELECT COUNT(*) as count FROM expenses');
    return `EXP-${String(rows[0].count + 1).padStart(4, '0')}`;
  }

  static async create(data) {
    const expenseCode = data.expenseCode || await Expense.generateExpenseCode();
    const query = `
      INSERT INTO expenses (expenseCode, category, description, amount, paymentMode, date, notes, paidTo, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await promisePool.query(query, [
      expenseCode,
      data.category,
      data.description,
      data.amount,
      data.paymentMode,
      data.date,
      data.notes || null,
      data.paidTo || null,
      data.createdBy || 1
    ]);
    return result.insertId;
  }

  static async getAll(filters = {}) {
    let query = 'SELECT *, expenseCode as expenseNumber FROM expenses WHERE 1=1';
    const params = [];

    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.paymentMode) {
      query += ' AND paymentMode = ?';
      params.push(filters.paymentMode);
    }

    if (filters.startDate && filters.endDate) {
      query += ' AND date BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    } else if (filters.timeRange) {
      const now = new Date();
      let startDate;
      if (filters.timeRange === 'DAY') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (filters.timeRange === 'WEEK') {
        const day = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - day);
        startDate.setHours(0, 0, 0, 0);
      } else if (filters.timeRange === 'MONTH') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      if (startDate) {
        query += ' AND date >= ?';
        params.push(startDate.toISOString().split('T')[0]);
      }
    }

    query += ' ORDER BY date DESC';
    const [rows] = await promisePool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const [rows] = await promisePool.query('SELECT * FROM expenses WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async update(id, data) {
    const updates = [];
    const params = [];

    Object.entries(data).forEach(([key, value]) => {
      if (['amount', 'category', 'description', 'paymentMode', 'notes', 'paidTo'].includes(key)) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updates.length === 0) return false;
    params.push(id);
    const query = `UPDATE expenses SET ${updates.join(', ')}, updatedAt = NOW() WHERE id = ?`;
    const [result] = await promisePool.query(query, params);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await promisePool.query('DELETE FROM expenses WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getCategoryWiseSummary(filters = {}) {
    let query = 'SELECT category, SUM(amount) as totalAmount, COUNT(*) as count FROM expenses WHERE 1=1';
    const params = [];

    if (filters.startDate && filters.endDate) {
      query += ' AND date BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }

    query += ' GROUP BY category ORDER BY totalAmount DESC';
    const [rows] = await promisePool.query(query, params);
    return rows;
  }

  static async getPaymentModeWiseSummary(filters = {}) {
    let query = 'SELECT paymentMode, SUM(amount) as totalAmount, COUNT(*) as count FROM expenses WHERE 1=1';
    const params = [];

    if (filters.startDate && filters.endDate) {
      query += ' AND date BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }

    query += ' GROUP BY paymentMode ORDER BY totalAmount DESC';
    const [rows] = await promisePool.query(query, params);
    return rows;
  }

  static async getSummaryMetrics(filters = {}) {
    let where = '1=1';
    const params = [];

    if (filters.startDate && filters.endDate) {
      where += ' AND date BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    } else if (filters.timeRange) {
      const now = new Date();
      let startDate;
      if (filters.timeRange === 'DAY') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (filters.timeRange === 'WEEK') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
      } else if (filters.timeRange === 'MONTH') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      if (startDate) {
        where += ' AND date >= ?';
        params.push(startDate.toISOString().split('T')[0]);
      }
    }

    const query = `
      SELECT
        COUNT(*) as totalExpenses,
        SUM(amount) as totalAmount,
        SUM(CASE WHEN paymentMode = 'Cash' THEN amount ELSE 0 END) as cashExpenses,
        SUM(CASE WHEN paymentMode = 'PhonePe' THEN amount ELSE 0 END) as phonePeExpenses,
        SUM(CASE WHEN paymentMode = 'Bank' THEN amount ELSE 0 END) as bankExpenses
      FROM expenses WHERE ${where}
    `;
    const [rows] = await promisePool.query(query, params);
    return rows[0];
  }

  static getCategories() {
    return ['Utilities', 'Transport', 'Maintenance', 'Packaging', 'Labor', 'Loan Interest', 'Other'];
  }
}

module.exports = Expense;
