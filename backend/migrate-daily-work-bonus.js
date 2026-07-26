const { promisePool } = require('./src/config/database');

const migrateDailyWorkBonus = async () => {
  try {
    console.log('Adding bonusAmount column to daily_work if needed...');

    await promisePool.query(`
      ALTER TABLE daily_work
      ADD COLUMN IF NOT EXISTS bonusAmount DECIMAL(12, 2) DEFAULT 0 AFTER totalAmount
    `);

    console.log('Backfilling bonusAmount from existing totalAmount values...');

    await promisePool.query(`
      UPDATE daily_work
      SET bonusAmount = GREATEST(COALESCE(totalAmount, 0) - (COALESCE(quantity, 0) * COALESCE(rate, 0)), 0)
      WHERE bonusAmount IS NULL OR bonusAmount = 0
    `);

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateDailyWorkBonus();
