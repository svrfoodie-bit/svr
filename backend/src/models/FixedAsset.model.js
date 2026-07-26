const { promisePool } = require('../config/database');

const ASSET_TYPES   = ['Machinery', 'Land', 'Building', 'Vehicle', 'Furniture', 'Equipment', 'Other'];
const ASSET_STATUSES = ['Active', 'Disposed', 'Under Maintenance'];

class FixedAsset {
  static async createTable() {
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS fixed_assets (
        id                   INT AUTO_INCREMENT PRIMARY KEY,
        assetCode            VARCHAR(20) UNIQUE NOT NULL,
        assetName            VARCHAR(150) NOT NULL,
        assetType            ENUM('Machinery','Land','Building','Vehicle','Furniture','Equipment','Other') NOT NULL,
        purchaseDate         DATE NOT NULL,
        purchaseCost         DECIMAL(14,2) NOT NULL,
        currentValue         DECIMAL(14,2) NOT NULL,
        depreciationRate     DECIMAL(5,2) DEFAULT 10.00 COMMENT 'Annual % e.g. 10 = 10% per year',
        lastDepreciationDate DATE NULL,
        location             VARCHAR(200),
        description          VARCHAR(300),
        status               ENUM('Active','Disposed','Under Maintenance') DEFAULT 'Active',
        notes                TEXT,
        createdBy            INT DEFAULT 1,
        createdAt            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    // Migration: add columns for existing installations
    try { await promisePool.query(`ALTER TABLE fixed_assets ADD COLUMN depreciationRate DECIMAL(5,2) DEFAULT 10.00 AFTER currentValue`); } catch { /* exists */ }
    try { await promisePool.query(`ALTER TABLE fixed_assets ADD COLUMN lastDepreciationDate DATE NULL AFTER depreciationRate`); } catch { /* exists */ }
  }

  static async generateCode() {
    const [rows] = await promisePool.query('SELECT COUNT(*) AS cnt FROM fixed_assets');
    return `FA-${String(rows[0].cnt + 1).padStart(4, '0')}`;
  }

  static async create(data) {
    const assetCode = await FixedAsset.generateCode();
    const [result] = await promisePool.query(
      `INSERT INTO fixed_assets
         (assetCode, assetName, assetType, purchaseDate, purchaseCost, currentValue,
          depreciationRate, location, description, status, notes, createdBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        assetCode,
        data.assetName,
        data.assetType,
        data.purchaseDate,
        data.purchaseCost,
        data.currentValue ?? data.purchaseCost,
        data.depreciationRate ?? 10.00,
        data.location    || null,
        data.description || null,
        data.status      || 'Active',
        data.notes       || null,
        data.createdBy   || 1,
      ]
    );
    return result.insertId;
  }

  static async getAll(filters = {}) {
    let query = 'SELECT * FROM fixed_assets WHERE 1=1';
    const params = [];

    if (filters.assetType) { query += ' AND assetType = ?'; params.push(filters.assetType); }
    if (filters.status)    { query += ' AND status = ?';    params.push(filters.status); }

    query += ' ORDER BY purchaseDate DESC';
    const [rows] = await promisePool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const [rows] = await promisePool.query('SELECT * FROM fixed_assets WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async update(id, data) {
    const fields = ['assetName','assetType','purchaseDate','purchaseCost','currentValue',
                    'depreciationRate','location','description','status','notes'];
    const updates = [];
    const params  = [];

    fields.forEach((f) => {
      if (data[f] !== undefined) { updates.push(`${f} = ?`); params.push(data[f]); }
    });

    if (!updates.length) return false;
    params.push(id);
    const [result] = await promisePool.query(
      `UPDATE fixed_assets SET ${updates.join(', ')}, updatedAt = NOW() WHERE id = ?`, params
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await promisePool.query('DELETE FROM fixed_assets WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getSummary() {
    const [rows] = await promisePool.query(`
      SELECT
        assetType,
        COUNT(*)                    AS count,
        SUM(purchaseCost)           AS totalCost,
        SUM(currentValue)           AS totalCurrentValue,
        SUM(CASE WHEN status = 'Active' THEN currentValue ELSE 0 END) AS activeValue
      FROM fixed_assets
      GROUP BY assetType
      ORDER BY assetType
    `);
    const [totals] = await promisePool.query(`
      SELECT
        COUNT(*)                                                       AS totalAssets,
        COALESCE(SUM(purchaseCost),   0)                               AS totalCost,
        COALESCE(SUM(currentValue),   0)                               AS totalCurrentValue,
        COALESCE(SUM(CASE WHEN status = 'Active' THEN currentValue ELSE 0 END), 0) AS activeValue
      FROM fixed_assets
    `);
    return { byType: rows, totals: totals[0] };
  }
}

module.exports = { FixedAsset, ASSET_TYPES, ASSET_STATUSES };
