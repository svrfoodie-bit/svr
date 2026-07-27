const mysql = require('mysql2/promise');
require('dotenv').config();

async function columnExists(connection, table, column) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [process.env.DB_NAME, table, column]
  );

  return Number(rows[0].count) > 0;
}

async function addColumn(connection, column, definition) {
  const exists = await columnExists(connection, 'job_work', column);

  if (exists) {
    console.log(`✓ job_work.${column} already exists`);
    return;
  }

  await connection.query(
    `ALTER TABLE job_work ADD COLUMN \`${column}\` ${definition}`
  );

  console.log(`✓ Added job_work.${column}`);
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

    await addColumn(connection, 'jobDate', 'DATE NULL');
    await addColumn(connection, 'jobWorkerName', 'VARCHAR(255) NULL');
    await addColumn(connection, 'cashewType', "VARCHAR(50) NOT NULL DEFAULT 'Premium'");
    await addColumn(connection, 'quantitySent', 'DECIMAL(10,2) NOT NULL DEFAULT 0');
    await addColumn(connection, 'quantityReceived', 'DECIMAL(10,2) NOT NULL DEFAULT 0');
    await addColumn(connection, 'ratePerKg', 'DECIMAL(10,2) NOT NULL DEFAULT 0');
    await addColumn(connection, 'remarks', 'TEXT NULL');

    console.log('✅ Job-work migration completed successfully.');
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