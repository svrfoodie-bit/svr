/**
 * Migration runner.
 *
 * Usage:
 *   node scripts/migrate.js            Apply all pending migrations
 *   node scripts/migrate.js --status   List applied/pending migrations, apply nothing
 *
 * Reads backend/.env for connection details (same config the app uses).
 * If DB_HOST is not localhost/127.0.0.1, you must pass --yes to actually
 * apply migrations, as a guard against accidentally running against a
 * remote/production database from a local machine.
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

async function main() {
  const args = process.argv.slice(2);
  const statusOnly = args.includes('--status');
  const confirmed = args.includes('--yes');

  const host = process.env.DB_HOST || 'localhost';
  const isLocal = host === 'localhost' || host === '127.0.0.1';

  if (!statusOnly && !isLocal && !confirmed) {
    console.error(
      `Refusing to run: DB_HOST="${host}" is not localhost.\n` +
      `If you intend to apply migrations to this database, re-run with --yes.`
    );
    process.exit(1);
  }

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const conn = await mysql.createConnection({
    host,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
    ssl: host === 'localhost' || host === '127.0.0.1' ? undefined : { rejectUnauthorized: false }
  });

  await conn.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  const [appliedRows] = await conn.query('SELECT name FROM schema_migrations');
  const applied = new Set(appliedRows.map((r) => r.name));

  console.log(`Database: ${host}/${process.env.DB_NAME}`);
  console.log(`Found ${files.length} migration file(s).\n`);

  for (const file of files) {
    const isApplied = applied.has(file);
    console.log(`  [${isApplied ? 'applied' : 'pending'}] ${file}`);
  }
  console.log('');

  if (statusOnly) {
    await conn.end();
    return;
  }

  const pending = files.filter((f) => !applied.has(f));
  if (pending.length === 0) {
    console.log('Nothing to apply.');
    await conn.end();
    return;
  }

  for (const file of pending) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    console.log(`Applying ${file}...`);
    try {
      await conn.query(sql);
      await conn.query('INSERT INTO schema_migrations (name) VALUES (?)', [file]);
      console.log(`  OK`);
    } catch (err) {
      console.error(`  FAILED: ${err.message}`);
      console.error('Stopping. Fix the migration file and re-run (already-applied migrations will be skipped).');
      await conn.end();
      process.exit(1);
    }
  }

  console.log('\nAll pending migrations applied.');
  await conn.end();
}

main().catch((err) => {
  console.error('Migration runner failed:', err.message);
  process.exit(1);
});
