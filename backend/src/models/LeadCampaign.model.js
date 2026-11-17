const { promisePool } = require('../config/database');

// contactIds / sentIds come back as a string on MariaDB (JSON = LONGTEXT) and on
// TEXT columns, but already parsed on MySQL 8 JSON columns. Accept both, and
// store ids as numbers so includes() comparisons are reliable.
const parseIds = (value) => {
  let list = value;
  if (typeof value === 'string') {
    try { list = JSON.parse(value); } catch { list = []; }
  }
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map(Number).filter(Number.isFinite))];
};

const toCampaign = (r) => ({ ...r, contactIds: parseIds(r.contactIds), sentIds: parseIds(r.sentIds) });

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
      JSON.stringify(parseIds(data.contactIds || [])),
      JSON.stringify([]),
      data.createdBy || 1
    ]);
    return result.insertId;
  }

  static async getAll() {
    const [rows] = await promisePool.query('SELECT * FROM lead_campaigns ORDER BY createdAt DESC');
    return rows.map(toCampaign);
  }

  static async getById(id) {
    const [rows] = await promisePool.query('SELECT * FROM lead_campaigns WHERE id = ?', [id]);
    return rows[0] ? toCampaign(rows[0]) : null;
  }

  // Returns null when the campaign does not exist.
  static async markSent(campaignId, contactId) {
    const campaign = await LeadCampaign.getById(campaignId);
    if (!campaign) return null;
    const id = Number(contactId);
    const sentIds = campaign.sentIds;
    if (Number.isFinite(id) && !sentIds.includes(id)) sentIds.push(id);
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
    // The UI reads `message`; the column is `content`.
    return rows.map((r) => ({ ...r, message: r.content || '' }));
  }

  static async delete(id) {
    const [result] = await promisePool.query('DELETE FROM lead_templates WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = { LeadCampaign, LeadTemplate };
