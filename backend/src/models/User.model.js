const { promisePool } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class User {
  static async create(data) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const query = `
      INSERT INTO users (name, email, username, password, role, isActive, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await promisePool.query(query, [
      data.name,
      data.email || null,
      data.username,
      hashedPassword,
      data.role || 'User',
      data.isActive !== undefined ? data.isActive : 1,
      data.createdBy || 1
    ]);
    return result.insertId;
  }

  static async getByUsername(username) {
    const [rows] = await promisePool.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0] || null;
  }

  static async getById(id) {
    const [rows] = await promisePool.query('SELECT id, name, email, username, role, isActive, createdAt FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async getAll(filters = {}) {
    let query = 'SELECT id, name, email, username, role, isActive, createdAt FROM users WHERE 1=1';
    const params = [];

    if (filters.role) {
      query += ' AND role = ?';
      params.push(filters.role);
    }

    if (filters.isActive !== undefined) {
      query += ' AND isActive = ?';
      params.push(filters.isActive ? 1 : 0);
    }

    query += ' ORDER BY createdAt DESC';
    const [rows] = await promisePool.query(query, params);
    return rows;
  }

  static async verifyPassword(user, password) {
    return await bcrypt.compare(password, user.password);
  }

  static generateToken(user) {
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );
    return token;
  }

  static async update(id, data) {
    const updates = [];
    const params = [];

    if (data.name) {
      updates.push('name = ?');
      params.push(data.name);
    }

    if (data.email) {
      updates.push('email = ?');
      params.push(data.email);
    }

    if (data.role) {
      updates.push('role = ?');
      params.push(data.role);
    }

    if (data.isActive !== undefined) {
      updates.push('isActive = ?');
      params.push(data.isActive ? 1 : 0);
    }

    if (updates.length === 0) return false;

    params.push(id);
    const query = `UPDATE users SET ${updates.join(', ')}, updatedAt = NOW() WHERE id = ?`;
    const [result] = await promisePool.query(query, params);
    return result.affectedRows > 0;
  }

  static async changePassword(id, oldPassword, newPassword) {
    const user = await promisePool.query('SELECT password FROM users WHERE id = ?', [id]);
    if (!user[0][0]) throw new Error('User not found');

    const isValid = await bcrypt.compare(oldPassword, user[0][0].password);
    if (!isValid) throw new Error('Old password is incorrect');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await promisePool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
    return true;
  }

  static async delete(id) {
    const [result] = await promisePool.query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = User;
