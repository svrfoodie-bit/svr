const { promisePool } = require('../config/database');

// Ensure columns exist
const ensureColumns = async () => {
  try {
    await promisePool.query(`ALTER TABLE lead_campaigns ADD COLUMN IF NOT EXISTS template TEXT DEFAULT NULL`);
    await promisePool.query(`ALTER TABLE lead_campaigns ADD COLUMN IF NOT EXISTS contactIds JSON DEFAULT NULL`);
    await promisePool.query(`ALTER TABLE lead_campaigns ADD COLUMN IF NOT EXISTS sentIds JSON DEFAULT NULL`);
  } catch {}
};
ensureColumns();

class LeadCampaign {
  static async create(data) {
    const query = `
      INSERT INTO lead_campaigns (name, description, template, contactIds, sentIds, createdBy)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await promisePool.query(query, [
      data.name,
      data.description || null,
      data.template || null,
      JSON.stringify(data.contactIds || []),
      JSON.stringify([]),
      data.createdBy || 1
    ]);
    return result.insertId;
  }

  static async getAll() {
    const [rows] = await promisePool.query('SELECT * FROM lead_campaigns ORDER BY createdAt DESC');
    return rows.map(r => ({
      ...r,
      contactIds: r.contactIds ? JSON.parse(r.contactIds) : [],
      sentIds: r.sentIds ? JSON.parse(r.sentIds) : [],
    }));
  }

  static async getById(id) {
    const [rows] = await promisePool.query('SELECT * FROM lead_campaigns WHERE id = ?', [id]);
    if (!rows[0]) return null;
    const r = rows[0];
    return {
      ...r,
      contactIds: r.contactIds ? JSON.parse(r.contactIds) : [],
      sentIds: r.sentIds ? JSON.parse(r.sentIds) : [],
    };
  }

  static async markSent(campaignId, contactId) {
    const campaign = await LeadCampaign.getById(campaignId);
    if (!campaign) throw new Error('Campaign not found');
    const sentIds = campaign.sentIds || [];
    if (!sentIds.includes(contactId)) sentIds.push(contactId);
    await promisePool.query(
      'UPDATE lead_campaigns SET sentIds = ? WHERE id = ?',
      [JSON.stringify(sentIds), campaignId]
    );
    return LeadCampaign.getById(campaignId);
  }

  static async delete(id) {
    const [result] = await promisePool.query('DELETE FROM lead_campaigns WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

class LeadTemplate {
  static async create(data) {
    const query = `INSERT INTO lead_templates (name, content, createdBy) VALUES (?, ?, ?)`;
    const [result] = await promisePool.query(query, [
      data.name,
      data.content || data.message || '',
      data.createdBy || 1
    ]);
    return result.insertId;
  }

  static async getAll() {
    const [rows] = await promisePool.query('SELECT * FROM lead_templates ORDER BY createdAt DESC');
    return rows;
  }

  static async delete(id) {
    const [result] = await promisePool.query('DELETE FROM lead_templates WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = { LeadCampaign, LeadTemplate };
