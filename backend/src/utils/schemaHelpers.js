/**
 * Portable schema helpers.
 *
 * `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` / `ADD INDEX IF NOT EXISTS` is
 * MariaDB-only syntax; MySQL 8 (e.g. Aiven) rejects it with a syntax error.
 * These helpers check information_schema first, so the same code works on
 * both MariaDB (local) and MySQL 8 (production).
 *
 * `db` can be a mysql2/promise pool or connection — anything with .query().
 */

const quoteIdent = (name) => `\`${String(name).replace(/`/g, '``')}\``;

async function columnExists(db, table, column) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS count FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return Number(rows[0].count) > 0;
}

async function indexExists(db, table, index) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS count FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [table, index]
  );
  return Number(rows[0].count) > 0;
}

// `definition` is everything after the column name, e.g. "INT NULL AFTER workType".
async function addColumnIfMissing(db, table, column, definition) {
  if (await columnExists(db, table, column)) return false;
  await db.query(`ALTER TABLE ${quoteIdent(table)} ADD COLUMN ${quoteIdent(column)} ${definition}`);
  return true;
}

// `definition` is everything after the index name, e.g. "(batchId)".
async function addIndexIfMissing(db, table, index, definition) {
  if (await indexExists(db, table, index)) return false;
  await db.query(`ALTER TABLE ${quoteIdent(table)} ADD INDEX ${quoteIdent(index)} ${definition}`);
  return true;
}

// Splits on `separator` only at top level (outside quotes, backticks and parentheses).
function splitTopLevel(text, separator) {
  const parts = [];
  let current = '';
  let depth = 0;
  let quote = null;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      current += ch;
      if (ch === '\\' && quote !== '`') {
        current += text[++i] ?? '';
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') quote = ch;
    else if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === separator && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  parts.push(current);
  return parts.map((p) => p.trim()).filter(Boolean);
}

const stripLineComments = (sql) =>
  sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');

const ALTER_RE = /^ALTER\s+TABLE\s+`?(\w+)`?\s+([\s\S]+)$/i;
const ADD_COLUMN_RE = /^ADD\s+(?:COLUMN\s+)?IF\s+NOT\s+EXISTS\s+`?(\w+)`?\s+([\s\S]+)$/i;
const ADD_INDEX_RE = /^ADD\s+(?:INDEX|KEY)\s+IF\s+NOT\s+EXISTS\s+`?(\w+)`?\s*([\s\S]*)$/i;

/**
 * Runs a SQL script, translating MariaDB-only `ADD COLUMN/INDEX IF NOT EXISTS`
 * clauses into existence checks + plain ALTERs. Scripts without those clauses
 * are sent unchanged in one query (requires multipleStatements on `db`).
 */
async function runPortableSql(db, sql) {
  if (!/ADD\s+(?:COLUMN\s+|INDEX\s+|KEY\s+)?IF\s+NOT\s+EXISTS/i.test(sql)) {
    await db.query(sql);
    return;
  }

  for (const statement of splitTopLevel(stripLineComments(sql), ';')) {
    const alter = statement.match(ALTER_RE);
    if (!alter) {
      await db.query(statement);
      continue;
    }

    const [, table, body] = alter;
    // Clauses run one at a time, in order, so "AFTER <column added earlier>" still works.
    for (const clause of splitTopLevel(body, ',')) {
      const col = clause.match(ADD_COLUMN_RE);
      const idx = clause.match(ADD_INDEX_RE);
      if (col) await addColumnIfMissing(db, table, col[1], col[2]);
      else if (idx) await addIndexIfMissing(db, table, idx[1], idx[2]);
      else await db.query(`ALTER TABLE ${quoteIdent(table)} ${clause}`);
    }
  }
}

module.exports = {
  columnExists,
  indexExists,
  addColumnIfMissing,
  addIndexIfMissing,
  runPortableSql,
};
