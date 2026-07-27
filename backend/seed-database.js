const { promisePool } = require('./src/config/database');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database with initial data...\n');

    // ==================== USERS ====================
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin@123', 10);
    
    await promisePool.query(
      `INSERT IGNORE INTO users (name, email, username, password, role, isActive, createdBy) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['Admin User', 'admin@svr.com', 'admin', hashedPassword, 'Admin', 1, 1]
    );
    
    const hashedPassword2 = await bcrypt.hash('manager@123', 10);
    await promisePool.query(
      `INSERT IGNORE INTO users (name, email, username, password, role, isActive, createdBy) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['Manager User', 'manager@svr.com', 'manager', hashedPassword2, 'Manager', 1, 1]
    );
    
    console.log('✓ Admin & Manager users created\n');

    // ==================== SUPPLIERS ====================
    console.log('🏢 Creating sample suppliers...');
    const suppliers = [
      ['S001', 'Premium Cashew Suppliers', 'Venkat Reddy', '9876543210', 'Hyderabad'],
      ['S002', 'Quality Imports Ltd', 'Rajesh Kumar', '9988776655', 'Bangalore'],
      ['S003', 'Best Nuts Trading', 'Suresh Nair', '9123456789', 'Guntur']
    ];

    for (const [id, name, contact, phone, area] of suppliers) {
      await promisePool.query(
        `INSERT IGNORE INTO suppliers (supplierId, name, contactPerson, phone, area, isActive, createdBy) 
         VALUES (?, ?, ?, ?, ?, 1, 1)`,
        [id, name, contact, phone, area]
      );
    }
    console.log('✓ 3 suppliers created\n');

    // ==================== CUSTOMERS ====================
    console.log('👥 Creating sample customers...');
    const customers = [
      ['C001', 'Rajesh Traders', 'Wholesale', '9876543210', 'Guntur'],
      ['C002', 'Sri Sai Store', 'Retail', '9988776655', 'Vijayawada'],
      ['C003', 'Venkat Enterprises', 'Wholesale', '9123456789', 'Hyderabad'],
      ['C004', 'Lakshmi Dry Fruits', 'Retail', '9876512345', 'Guntur'],
      ['C005', 'Metro Supermarket', 'Wholesale', '9456123789', 'Bangalore']
    ];

    for (const [id, name, type, phone, area] of customers) {
      await promisePool.query(
        `INSERT IGNORE INTO customers (customerId, name, type, contactNumber, area, isActive, createdBy) 
         VALUES (?, ?, ?, ?, ?, 1, 1)`,
        [id, name, type, phone, area]
      );
    }
    console.log('✓ 5 customers created\n');

    // ==================== WORKERS ====================
    console.log('👷 Creating sample workers...');
    const workers = [
      ['W001', 'Rajesh Kumar', 'Kumar Reddy', '1990-05-15', '9876543210', 'Processing', 'Active', 500, 12000],
      ['W002', 'Suresh Nair', 'Nair Reddy', '1992-08-22', '9988776655', 'Sorting', 'Active', 400, 10000],
      ['W003', 'Ganesh Patel', 'Patel Reddy', '1991-03-10', '9123456789', 'Packaging', 'Active', 350, 8500],
      ['W004', 'Mohan Singh', 'Singh Reddy', '1993-11-05', '9876512345', 'Processing', 'Active', 500, 12000]
    ];

    for (const [id, name, fname, dob, phone, area, status, daily, monthly] of workers) {
      await promisePool.query(
        `INSERT IGNORE INTO workers (workerId, name, fatherName, dateOfBirth, mobileNumber, areaOfWork, status, dailyWages, monthlyWages, createdBy) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [id, name, fname, dob, phone, area, status, daily, monthly]
      );
    }
    console.log('✓ 4 workers created\n');

    // ==================== RAW PURCHASES ====================
    console.log('📦 Creating sample raw purchases...');
    const suppliers_ids_data = await promisePool.query('SELECT id FROM suppliers LIMIT 3');
    const supplier_ids = suppliers_ids_data[0].map(s => s.id);

    const purchases = [
      [supplier_ids[0], '2024-03-01', 1000, 50, 50000, 'Standard', 12.5],
      [supplier_ids[1], '2024-03-05', 800, 48, 38400, 'Premium', 11.0],
      [supplier_ids[2], '2024-03-10', 1200, 52, 62400, 'Standard', 13.0]
    ];

    for (const [supp_id, date, qty, rate, total, grade, moisture] of purchases) {
      await promisePool.query(
        `INSERT IGNORE INTO raw_purchases (supplierId, purchaseDate, quantity, ratePerUnit, totalAmount, grade, moisture, createdBy) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [supp_id, date, qty, rate, total, grade, moisture]
      );
    }
    console.log('✓ 3 raw purchases created\n');

    // ==================== PROCESSING BATCHES ====================
    console.log('⚙️  Creating sample processing batches...');
    const batches = [
      ['B001', '2024-03-01', '2024-03-05', 1000, 800, 'Raw', 'LWP', 'Completed'],
      ['B002', '2024-03-06', '2024-03-10', 800, 640, 'Raw', 'HLP', 'Completed'],
      ['B003', '2024-03-11', null, 1200, 960, 'Raw', null, 'In Progress']
    ];

    for (const [num, start, end, input, output, grade, fgrade, status] of batches) {
      await promisePool.query(
        `INSERT IGNORE INTO processing_batches (batchNumber, startDate, endDate, rawInputQuantity, quantity, grade, finishedGrade, status, createdBy) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [num, start, end, input, output, grade, fgrade, status]
      );
    }
    console.log('✓ 3 processing batches created\n');

    // ==================== FINISHED GOODS STOCK ====================
    console.log('📊 Creating finished goods stock...');
    const batches_data = await promisePool.query("SELECT id FROM processing_batches WHERE status = 'Completed'");
    
    for (let i = 0; i < batches_data[0].length; i++) {
      const grades = ['LWP', 'HLP', 'BBL'];
      await promisePool.query(
        `INSERT IGNORE INTO finished_goods_stock (batchId, grade, quantity, dateAdded, createdBy) 
         VALUES (?, ?, ?, NOW(), 1)`,
        [batches_data[0][i].id, grades[i], 400 + (i * 100)]
      );
    }
    console.log('✓ Stock entries created\n');

    // ==================== SALES ORDERS ====================
    console.log('🛒 Creating sample sales orders...');
    const customers_data = await promisePool.query('SELECT id FROM customers LIMIT 3');
    const cust_ids = customers_data[0].map(c => c.id);

    const orders = [
      ['SO001', cust_ids[0], 'LWP', 100, 600, 60000, '2024-04-05', 'Delivered'],
      ['SO002', cust_ids[1], 'HLP', 50, 550, 27500, '2024-04-10', 'Pending'],
      ['SO003', cust_ids[2], 'LWP', 200, 600, 120000, '2024-04-15', 'Pending']
    ];

    for (const [id, cust, grade, qty, rate, total, delivery, status] of orders) {
      await promisePool.query(
        `INSERT IGNORE INTO sales_orders (salesOrderId, customerId, productGrade, quantity, ratePerUnit, totalAmount, deliveryDate, status, createdBy) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [id, cust, grade, qty, rate, total, delivery, status]
      );
    }
    console.log('✓ 3 sales orders created\n');

    // ==================== SALES PAYMENTS ====================
    console.log('💳 Creating sample payments...');
    const orders_data = await promisePool.query('SELECT id FROM sales_orders LIMIT 2');
    const order_ids = orders_data[0].map(o => o.id);

    const payments = [
      [order_ids[0], '2024-04-06', 60000, 'Bank Transfer', 'TXN001'],
      [order_ids[1], '2024-04-12', 13750, 'Cheque', 'CHQ001']
    ];

    for (const [order_id, date, amount, mode, ref] of payments) {
      await promisePool.query(
        `INSERT IGNORE INTO sales_payments (salesOrderId, paymentDate, amount, paymentMode, reference, createdBy) 
         VALUES (?, ?, ?, ?, ?, 1)`,
        [order_id, date, amount, mode, ref]
      );
    }
    console.log('✓ 2 payments recorded\n');

    // ==================== DAILY WORK ====================
    console.log('📅 Creating sample daily work entries...');
    const workers_data = await promisePool.query('SELECT id FROM workers LIMIT 2');
    const worker_ids = workers_data[0].map(w => w.id);

    const works = [
      [worker_ids[0], '2024-04-01', 'Regular', 50, 10, 500, 1],
      [worker_ids[0], '2024-04-02', 'Regular', 55, 10, 550, 1],
      [worker_ids[1], '2024-04-01', 'Overtime', 40, 12, 480, 0],
      [worker_ids[1], '2024-04-02', 'Regular', 45, 10, 450, 1]
    ];

    for (const [w_id, date, type, qty, rate, total, bonus] of works) {
      await promisePool.query(
        `INSERT IGNORE INTO daily_work (workerId, workDate, workType, quantity, rate, totalAmount, bonusEligible, createdBy) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [w_id, date, type, qty, rate, total, bonus]
      );
    }
    console.log('✓ 4 daily work entries created\n');

    // ==================== EXPENSES ====================
    console.log('💰 Creating sample expenses...');
    const expenses = [
      ['EXP001', 'Utilities', 'Electricity Bill', 5000, 'Bank Transfer', '2024-04-01'],
      ['EXP002', 'Transport', 'Truck Fuel', 3000, 'Cash', '2024-04-02'],
      ['EXP003', 'Maintenance', 'Equipment Service', 2500, 'Cheque', '2024-04-03'],
      ['EXP004', 'Packaging', 'Boxes & Labels', 4000, 'Bank Transfer', '2024-04-04']
    ];

    for (const [code, category, desc, amount, mode, date] of expenses) {
      await promisePool.query(
        `INSERT IGNORE INTO expenses (expenseCode, category, description, amount, paymentMode, date, createdBy) 
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [code, category, desc, amount, mode, date]
      );
    }
    console.log('✓ 4 expenses recorded\n');

    // ==================== LEADS ====================
    console.log('📞 Creating sample leads...');
    const leads = [
      ['Arjun Kumar', '9876543210', 'New', 'Website'],
      ['Priya Singh', '9988776655', 'Contacted', 'Referral'],
      ['Vikram Reddy', '9123456789', 'Qualified', 'Website'],
      ['Neha Patel', '9456789123', 'New', 'Phone Call']
    ];

    for (const [name, phone, status, source] of leads) {
      await promisePool.query(
        `INSERT IGNORE INTO leads (name, phone, status, source, createdBy) 
         VALUES (?, ?, ?, ?, 1)`,
        [name, phone, status, source]
      );
    }
    console.log('✓ 4 leads created\n');

    // ==================== JOB WORK ====================
    console.log('🎁 Creating sample job work...');
    const jobworks = [
      ['JW001', 'Kernel Processing', 'ABC Processors', '9876543210', '2024-03-15', '2024-03-20', 500, 400, 25, 12500, 'Completed'],
      ['JW002', 'Grade Sorting', 'Quality Services', '9123456789', '2024-04-01', null, 300, 0, 30, 9000, 'In Progress']
    ];

    for (const [id, desc, vendor, phone, start, end, input, output, rate, total, status] of jobworks) {
      await promisePool.query(
        `INSERT IGNORE INTO job_work (jobWorkId, description, vendorName, vendorPhone, startDate, endDate, quantityIn, quantityOut, ratePerUnit, totalAmount, status, createdBy) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [id, desc, vendor, phone, start, end, input, output, rate, total, status]
      );
    }
    console.log('✓ 2 job work orders created\n');

    // ==================== WORKER ADVANCES ====================
    console.log('💸 Creating sample worker advances...');
    const advances = [
      [worker_ids[0], '2024-04-01', 5000, 'Emergency needs', 'Approved'],
      [worker_ids[1], '2024-04-02', 3000, 'Medical expenses', 'Pending']
    ];

    for (const [w_id, date, amount, reason, status] of advances) {
      await promisePool.query(
        `INSERT IGNORE INTO worker_advances (workerId, advanceDate, amount, reason, status, createdBy) 
         VALUES (?, ?, ?, ?, ?, 1)`,
        [w_id, date, amount, reason, status]
      );
    }
    console.log('✓ 2 worker advances created\n');

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📋 Summary of created data:');
    console.log('   • 2 Users (Admin + Manager)');
    console.log('   • 3 Suppliers');
    console.log('   • 5 Customers');
    console.log('   • 4 Workers');
    console.log('   • 3 Raw Purchases');
    console.log('   • 3 Processing Batches');
    console.log('   • 3 Finished Goods Stock entries');
    console.log('   • 3 Sales Orders');
    console.log('   • 2 Sales Payments');
    console.log('   • 4 Daily Work entries');
    console.log('   • 4 Expenses');
    console.log('   • 4 Leads');
    console.log('   • 2 Job Work orders');
    console.log('   • 2 Worker Advances');
    console.log('\n🔐 Login Credentials:');
    console.log('   Admin - username: admin, password: admin@123');
    console.log('   Manager - username: manager, password: manager@123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
