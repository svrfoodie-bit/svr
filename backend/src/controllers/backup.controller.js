const { promisePool } = require('../config/database');
const Settings = require('../models/Settings.model');

// Escape a single value for SQL INSERT
const escapeValue = (val) => {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 1 : 0;
  if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
  const str = String(val)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\0/g, '\\0');
  return `'${str}'`;
};

const generateSQLBackup = async (req, res) => {
  try {
    const dbName = process.env.DB_NAME || 'svr_cashew';
    const companyName = await Settings.getCompanyName();
    const now = new Date();
    const lines = [];

    // ── Header ──────────────────────────────────────────────────────────────
    lines.push(`-- ============================================================`);
    lines.push(`-- ${companyName} Management System - Full SQL Backup`);
    lines.push(`-- Database  : ${dbName}`);
    lines.push(`-- Generated : ${now.toISOString()}`);
    lines.push(`-- ============================================================`);
    lines.push('');
    lines.push(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    lines.push(`USE \`${dbName}\`;`);
    lines.push('');
    lines.push('SET FOREIGN_KEY_CHECKS=0;');
    lines.push('SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";');
    lines.push('SET NAMES utf8mb4;');
    lines.push('SET time_zone="+05:30";');
    lines.push('');

    // ── Discover ALL tables in the database dynamically ──────────────────────
    const [tableRows] = await promisePool.query(
      `SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
       ORDER BY TABLE_NAME`,
      [dbName]
    );

    const tables = tableRows.map(r => r.TABLE_NAME);

    if (tables.length === 0) {
      lines.push('-- No tables found in database.');
    }

    let totalRows = 0;

    for (const table of tables) {
      // ── CREATE TABLE ────────────────────────────────────────────────────
      let createSQL = '';
      try {
        const [createRows] = await promisePool.query(`SHOW CREATE TABLE \`${table}\``);
        createSQL = createRows[0]?.['Create Table'] || '';
      } catch {
        createSQL = '';
      }

      lines.push(`-- --------------------------------------------------------`);
      lines.push(`-- Table: \`${table}\``);
      lines.push(`-- --------------------------------------------------------`);
      lines.push('');
      lines.push(`DROP TABLE IF EXISTS \`${table}\`;`);

      if (createSQL) {
        lines.push(createSQL + ';');
      }
      lines.push('');

      // ── INSERT DATA ─────────────────────────────────────────────────────
      const [rows] = await promisePool.query(`SELECT * FROM \`${table}\``);

      if (rows.length > 0) {
        totalRows += rows.length;
        lines.push(`-- Data for \`${table}\` : ${rows.length} row(s)`);

        const columns = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');

        // Batch inserts in groups of 200 for performance
        for (let i = 0; i < rows.length; i += 200) {
          const batch = rows.slice(i, i + 200);
          const values = batch
            .map(row => `(${Object.values(row).map(escapeValue).join(', ')})`)
            .join(',\n  ');
          lines.push(`INSERT INTO \`${table}\` (${columns}) VALUES`);
          lines.push(`  ${values};`);
        }
      } else {
        lines.push(`-- No data in \`${table}\``);
      }
      lines.push('');
    }

    // ── Footer ───────────────────────────────────────────────────────────────
    lines.push('SET FOREIGN_KEY_CHECKS=1;');
    lines.push('');
    lines.push(`-- ============================================================`);
    lines.push(`-- Backup summary`);
    lines.push(`--   Tables  : ${tables.length}`);
    lines.push(`--   Total rows : ${totalRows}`);
    lines.push(`--   Completed  : ${new Date().toISOString()}`);
    lines.push(`-- ============================================================`);

    const sqlContent = lines.join('\n');
    const timestamp = now.toISOString().replace(/[-:T]/g, '_').split('.')[0];
    const fileName = `svr_cashew_sql_backup_${timestamp}.sql`;

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', Buffer.byteLength(sqlContent, 'utf8'));
    res.send(sqlContent);

  } catch (error) {
    console.error('SQL backup error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate SQL backup: ' + error.message });
  }
};

module.exports = { generateSQLBackup };
