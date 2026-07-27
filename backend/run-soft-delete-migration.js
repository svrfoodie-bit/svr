const mysql = require('mysql2/promise');
require('dotenv').config();

async function columnExists(connection, tableName, columnName) {
  const [rows] = await connection.query(
    `
      SELECT COUNT(*) AS count
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
    `,
    [process.env.DB_NAME, tableName, columnName]
  );

  return rows[0].count > 0;
}

async function addSoftDeleteColumn(connection, tableName) {
  const exists = await columnExists(connection, tableName, 'isDeleted');

  if (exists) {
    console.log(`✓ ${tableName}.isDeleted already exists`);
    return;
  }

  // Table names are controlled by this script, not user input.
  await connection.query(
    `ALTER TABLE \`${tableName}\`
     ADD COLUMN \`isDeleted\` TINYINT(1) NOT NULL DEFAULT 0`
  );

  console.log(`✓ Added isDeleted to ${tableName}`);
}

async function runMigration() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    await addSoftDeleteColumn(connection, 'customers');
    await addSoftDeleteColumn(connection, 'suppliers');

    console.log('✅ Soft-delete migration completed successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();