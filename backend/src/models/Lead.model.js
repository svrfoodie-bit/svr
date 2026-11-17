const { promisePool } = require('../config/database');

// Must match the leads.status ENUM (migration 014) and LEAD_STATUSES in the frontend.
const LEAD_STATUSES = ['New', 'Contacted', 'Interested', 'Not Interested', 'Converted'];

// Same rules as normalisePhone() in frontend/src/services/leadService.js.
const normalisePhone = (raw = '') => {
  let d = String(raw).replace(/\D/g, '');
  if (d.startsWith('0')) d = '91' + d.slice(1);
  if (d.length === 10) d = '91' + d;
  return d;
};

// Last 10 digits, the format the customers module requires.
const tenDigitPhone = (raw = '') => {
  const d = String(raw).replace(/\D/g, '');
  return d.length >= 10 ? d.slice(-10) : d;
};

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
    // customerId / convertedAt are set only through convertToCustomer().
    const allowed = ['name', 'phone', 'normalizedPhone', 'status', 'source', 'campaignId', 'waSent', 'notes', 'location', 'address', 'category'];
    const updates = [];
    const params = [];

    // Keep the dedup key in step when the phone is edited.
    if (data.phone !== undefined && data.normalizedPhone === undefined && data._phone === undefined) {
      data = { ...data, normalizedPhone: normalisePhone(data.phone) || null };
    }

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

  /**
   * Turns a lead into a customer. If an active customer already has the same
   * 10-digit number, the lead is linked to that customer instead of creating a
   * duplicate. Returns { lead, customer, created }.
   * Throws an Error with .status set for client errors.
   */
  static async convertToCustomer(leadId, { name, type, area, contactNumber, address, createdBy }) {
    const fail = (status, message) => Object.assign(new Error(message), { status });

    const connection = await promisePool.getConnection();
    try {
      await connection.beginTransaction();

      const [[lead]] = await connection.query('SELECT * FROM leads WHERE id = ? FOR UPDATE', [leadId]);
      if (!lead) throw fail(404, 'Lead not found');
      if (lead.customerId) throw fail(409, 'This lead is already linked to a customer');

      const phone = tenDigitPhone(contactNumber || lead.normalizedPhone || lead.phone);
      if (!/^[0-9]{10}$/.test(phone)) throw fail(400, 'Contact number must be exactly 10 digits');
      if (!['Retail', 'Wholesale'].includes(type)) throw fail(400, 'Customer type must be Retail or Wholesale');
      const customerName = String(name || lead.name || '').trim();
      if (!customerName) throw fail(400, 'Customer name is required');
      const customerArea = String(area || lead.location || '').trim();
      if (!customerArea) throw fail(400, 'Area is required');

      const [[existing]] = await connection.query(
        'SELECT * FROM customers WHERE contactNumber = ? AND COALESCE(isDeleted, 0) = 0 LIMIT 1',
        [phone]
      );

      let customerId;
      let created = false;
      if (existing) {
        customerId = existing.id;
      } else {
        const [[{ count }]] = await connection.query('SELECT COUNT(*) AS count FROM customers');
        const code = `CUST-${String(count + 1).padStart(4, '0')}`;
        const [result] = await connection.query(
          `INSERT INTO customers (customerId, name, type, contactNumber, area, address, isActive, createdBy)
           VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
          [code, customerName.slice(0, 100), type, phone, customerArea, address ?? lead.address ?? null, createdBy || 1]
        );
        customerId = result.insertId;
        created = true;
      }

      await connection.query(
        `UPDATE leads SET customerId = ?, convertedAt = NOW(), status = 'Converted', updatedAt = NOW() WHERE id = ?`,
        [customerId, leadId]
      );

      await connection.commit();

      const [[customer]] = await promisePool.query('SELECT * FROM customers WHERE id = ?', [customerId]);
      return { lead: await Lead.getById(leadId), customer, created };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Bulk create with server-side dedup by phone
  static async bulkCreate(leads) {
    if (!leads || leads.length === 0) return { imported: 0, skipped: 0 };

    const existingPhones = await Lead.getExistingPhones();
    let imported = 0;
    let skipped = 0;

    for (const lead of leads) {
      const raw = String(lead.phone || '').trim();
      const normalized = lead.normalizedPhone || lead._phone || normalisePhone(raw);
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
            // 'Converted' needs a linked customer, which an import cannot create.
            LEAD_STATUSES.includes(lead.status) && lead.status !== 'Converted' ? lead.status : 'New',
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
module.exports.LEAD_STATUSES = LEAD_STATUSES;
module.exports.normalisePhone = normalisePhone;
