require('dotenv').config();
const RawPurchasePayment = require('./src/models/RawPurchasePayment.model');
const JobWorkPayment = require('./src/models/JobWorkPayment.model');

async function createPaymentTables() {
  try {
    console.log('Creating payment tracking tables...\n');

    // Create raw purchase payments table
    console.log('Creating raw_purchase_payments table...');
    await RawPurchasePayment.createTable();
    console.log('✅ raw_purchase_payments table created successfully\n');

    // Create job work payments table
    console.log('Creating job_work_payments table...');
    await JobWorkPayment.createTable();
    console.log('✅ job_work_payments table created successfully\n');

    console.log('🎉 All payment tables created successfully!');
    console.log('\nYou can now:');
    console.log('1. Record payments for raw purchases');
    console.log('2. Track payments for job work operations');
    console.log('3. Access payment APIs via frontend\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating payment tables:', error.message);
    console.error('\nPossible solutions:');
    console.error('1. Make sure MySQL is running');
    console.error('2. Verify DB credentials in .env file');
    console.error('3. Check if database "svr_cashew_db" exists');
    console.error('4. Ensure you have permissions to create tables\n');

    process.exit(1);
  }
}

// Run the function
createPaymentTables();
