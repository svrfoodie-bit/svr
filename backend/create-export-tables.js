require('dotenv').config();
const ExportTemplate = require('./src/models/ExportTemplate.model');
const ExportHistory = require('./src/models/ExportHistory.model');
const ExportSchedule = require('./src/models/ExportSchedule.model');

async function createTables() {
  try {
    console.log('Creating export tables...\n');

    // Create export_templates table
    console.log('Creating export_templates table...');
    await ExportTemplate.createTable();
    console.log('✅ export_templates table created successfully\n');

    // Create export_history table
    console.log('Creating export_history table...');
    await ExportHistory.createTable();
    console.log('✅ export_history table created successfully\n');

    // Create export_schedules table
    console.log('Creating export_schedules table...');
    await ExportSchedule.createTable();
    console.log('✅ export_schedules table created successfully\n');

    console.log('🎉 All export tables created successfully!');
    console.log('\nYou can now:');
    console.log('1. Start the backend server: npm run dev');
    console.log('2. Test the export APIs');
    console.log('3. Use the Export Management UI in the frontend\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating tables:', error.message);
    console.error('\nPossible solutions:');
    console.error('1. Make sure MySQL is running');
    console.error('2. Verify DB credentials in .env file');
    console.error('3. Check if database "svr_cashew_db" exists');
    console.error('4. Ensure you have permissions to create tables\n');

    process.exit(1);
  }
}

// Run the function
createTables();
