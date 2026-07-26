const { promisePool } = require('../config/database');

// Ensure address & category columns exist (run once)
const ensureColumns = async () => {
  try {
    await promisePool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS address VARCHAR(255) DEFAULT NULL`);
    await promisePool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT NULL`);
    await promisePool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS normalizedPhone VARCHAR(20) DEFAULT NULL`);
  } catch {}
};
ensureColumns();

class Lead {
  static async create(data) {
    const query = `
      INSERT INTO leads (name, phone, normalizedPhone, status, source, waSent, notes, location, address, category, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await promisePool.query(query, [
      data.name || 'Unknown',
      data.phone || '',
      data.normalizedPhone || data._phone || null,
      data.status || 'New',
      data.source || null,
      data.waSent ? 1 : 0,
      data.notes || null,
      data.location || null,
      data.address || null,
      data.category || null,
      data.createdBy || 1
    ]);
    return result.insertId;
  }

  static async getAll(filters = {}) {
    let query = 'SELECT * FROM leads WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.campaignId) {
      query += ' AND campaignId = ?';
      params.push(filters.campaignId);
    }

    if (filters.waSent !== undefined && filters.waSent !== '') {
      query += ' AND waSent = ?';
      params.push(filters.waSent ? 1 : 0);
    }

    if (filters.search) {
      query += ' AND (name LIKE ? OR phone LIKE ? OR location LIKE ? OR category LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY createdAt DESC';

    // Only apply pagination if explicitly requested
    if (filters.limit) {
      const limit = parseInt(filters.limit) || 1000;
      const page = parseInt(filters.page) || 0;
      const offset = page * limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }

    const [rows] = await promisePool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const [rows] = await promisePool.query('SELECT * FROM leads WHERE id = ?', [id]);
    return rows[0] || null;
  }

  // Get all normalized phones for dedup checking
  static async getExistingPhones() {
    const [rows] = await promisePool.query('SELECT phone, normalizedPhone FROM leads WHERE phone IS NOT NULL AND phone != ""');
    const phones = new Set();
    rows.forEach(r => {
      if (r.normalizedPhone) phones.add(r.normalizedPhone);
      if (r.phone) phones.add(String(r.phone).trim());
    });
    return phones;
  }

  static async update(id, data) {
    const allowed = ['name', 'phone', 'normalizedPhone', 'status', 'source', 'campaignId', 'waSent', 'notes', 'location', 'address', 'category'];
    const updates = [];
    const params = [];

    Object.entries(data).forEach(([key, value]) => {
      // also accept _phone as normalizedPhone
      if (key === '_phone') {
        updates.push('normalizedPhone = ?');
        params.push(value);
      } else if (allowed.includes(key)) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updates.length === 0) return false;
    params.push(id);
    const query = `UPDATE leads SET ${updates.join(', ')}, updatedAt = NOW() WHERE id = ?`;
    const [result] = await promisePool.query(query, params);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await promisePool.query('DELETE FROM leads WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async deleteMany(ids) {
    if (!ids || ids.length === 0) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await promisePool.query(`DELETE FROM leads WHERE id IN (${placeholders})`, ids);
    return result.affectedRows;
  }

  static async markSent(ids) {
    if (!ids || ids.length === 0) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await promisePool.query(
      `UPDATE leads SET waSent = 1, updatedAt = NOW() WHERE id IN (${placeholders})`,
      ids
    );
    return result.affectedRows;
  }

  static async clearAll() {
    const [result] = await promisePool.query('DELETE FROM leads');
    return result.affectedRows;
  }

  // Bulk create with server-side dedup by phone
  static async bulkCreate(leads) {
    if (!leads || leads.length === 0) return { imported: 0, skipped: 0 };

    const existingPhones = await Lead.getExistingPhones();
    let imported = 0;
    let skipped = 0;

    for (const lead of leads) {
      const normalized = lead.normalizedPhone || lead._phone || '';
      const raw = String(lead.phone || '').trim();
      const key = normalized.length >= 10 ? normalized : raw;

      if (key && existingPhones.has(key)) {
        skipped++;
        continue;
      }

      // Add to set so we don't duplicate within this batch
      if (key) existingPhones.add(key);

      try {
        await promisePool.query(
          `INSERT INTO leads (name, phone, normalizedPhone, status, source, waSent, notes, location, address, category, createdBy)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            lead.name || 'Unknown',
            raw || null,
            normalized || null,
            lead.status || 'New',
            lead.source || null,
            lead.waSent ? 1 : 0,
            lead.notes || null,
            lead.location || null,
            lead.address || null,
            lead.category || null,
            1
          ]
        );
        imported++;
      } catch {
        skipped++;
      }
    }

    return { imported, skipped };
  }
}

module.exports = Lead;
