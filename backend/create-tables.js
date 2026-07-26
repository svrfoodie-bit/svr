const { promisePool } = require('./src/config/database');

const createTables = async () => {
  try {
    console.log('📋 Creating database tables...');

    // Users table
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('Admin', 'Manager', 'User') DEFAULT 'User',
        isActive BOOLEAN DEFAULT 1,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        createdBy INT,
        INDEX(username),
        INDEX(role)
      )
    `);
    console.log('✓ Users table created');

    // Customers table
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        customerId VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        type ENUM('Retail', 'Wholesale') NOT NULL,
        contactNumber VARCHAR(20),
        area VARCHAR(100),
        email VARCHAR(255),
        address TEXT,
        isActive BOOLEAN DEFAULT 1,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        createdBy INT,
        INDEX(customerId),
        INDEX(type),
        INDEX(isActive)
      )
    `);
    console.log('✓ Customers table created');

    // Suppliers table
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        supplierId VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        contactPerson VARCHAR(255),
        phone VARCHAR(20),
        area VARCHAR(100),
        address TEXT,
        notes TEXT,
        isActive BOOLEAN DEFAULT 1,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        createdBy INT,
        INDEX(supplierId),
        INDEX(isActive)
      )
    `);
    console.log('✓ Suppliers table created');

    // Raw Purchases table
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS raw_purchases (
        id INT PRIMARY KEY AUTO_INCREMENT,
        supplierId INT NOT NULL,
        purchaseDate DATE NOT NULL,
        quantity DECIMAL(10, 2) NOT NULL,
        ratePerUnit DECIMAL(10, 2) NOT NULL,
        totalAmount DECIMAL(12, 2) NOT NULL,
        grade VARCHAR(100),
        moisture DECIMAL(5, 2),
        weight DECIMAL(10, 2),
        notes TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        createdBy INT,
        FOREIGN KEY (supplierId) REFERENCES suppliers(id),
        INDEX(supplierId),
        INDEX(purchaseDate)
      )
    `);
    console.log('✓ Raw Purchases table created');

    // Workers table
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS workers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        workerId VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        fatherName VARCHAR(255),
        dateOfBirth DATE,
        mobileNumber VARCHAR(20),
        areaOfWork VARCHAR(100),
        status ENUM('Active', 'Inactive', 'On Leave') DEFAULT 'Active',
        dailyWages DECIMAL(10, 2),
        monthlyWages DECIMAL(10, 2),
        notes TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        createdBy INT,
        INDEX(workerId),
        INDEX(status)
      )
    `);
    console.log('✓ Workers table created');

    // Daily Work table
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS daily_work (
        id INT PRIMARY KEY AUTO_INCREMENT,
        workerId INT NOT NULL,
        workDate DATE NOT NULL,
        workType VARCHAR(50),
        assignedQuantity DECIMAL(10, 2),
        quantity DECIMAL(10, 2),
        rate DECIMAL(10, 2),
        totalAmount DECIMAL(12, 2),
        bonusAmount DECIMAL(12, 2) DEFAULT 0,
        bonusEligible BOOLEAN DEFAULT 0,
        status ENUM('Pending', 'In Progress', 'Completed') DEFAULT 'In Progress',
        notes TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        createdBy INT,
        FOREIGN KEY (workerId) REFERENCES workers(id),
        INDEX(workerId),
        INDEX(workDate)
      )
    `);
    console.log('✓ Daily Work table created');

    // Job Work table
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS job_work (
        id INT PRIMARY KEY AUTO_INCREMENT,
        jobWorkId VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        vendorName VARCHAR(255),
        vendorPhone VARCHAR(20),
        startDate DATE,
        endDate DATE,
        quantityIn DECIMAL(10, 2),
        quantityOut DECIMAL(10, 2),
        ratePerUnit DECIMAL(10, 2),
        totalAmount DECIMAL(12, 2),
        status ENUM('In Progress', 'Completed', 'Cancelled') DEFAULT 'In Progress',
        notes TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        createdBy INT,
        INDEX(jobWorkId),
        INDEX(status)
      )
    `);
    console.log('✓ Job Work table created');

    // Processing Batches table
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS processing_batches (
        id INT PRIMARY KEY AUTO_INCREMENT,
        batchNumber VARCHAR(50) UNIQUE NOT NULL,
        startDate DATE,
        endDate DATE,
        rawInputQuantity DECIMAL(10, 2),
        quantity DECIMAL(10, 2),
        wastage DECIMAL(10, 2) DEFAULT 0,
        grade VARCHAR(100),
        finishedGrade VARCHAR(100),
        status ENUM('In Progress', 'Completed', 'Cancelled') DEFAULT 'In Progress',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        createdBy INT,
        INDEX(batchNumber),
        INDEX(status)
      )
    `);
    console.log('✓ Processing Batches table created');

    // Finished Goods Stock table
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS finished_goods_stock (
        id INT PRIMARY KEY AUTO_INCREMENT,
        batchId INT,
        grade VARCHAR(100) NOT NULL,
        quantity DECIMAL(10, 2),
        dateAdded DATE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        createdBy INT,
        FOREIGN KEY (batchId) REFERENCES processing_batches(id),
        INDEX(grade),
        INDEX(dateAdded)
      )
    `);
    console.log('✓ Finished Goods Stock table created');

    // Stock Adjustments table
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS stock_adjustments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        grade VARCHAR(100),
        adjustmentType ENUM('Issue', 'Damage') NOT NULL,
        quantity DECIMAL(10, 2),
        dateAdded DATE,
        reason TEXT,
        approvedBy VARCHAR(100),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        createdBy INT,
        INDEX(grade),
        INDEX(adjustmentType)
      )
    `);
    console.log('✓ Stock Adjustments table created');

    // Sales Orders table
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS sales_orders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        salesOrderId VARCHAR(50) UNIQUE NOT NULL,
        customerId INT NOT NULL,
        orderDate DATE,
        productGrade VARCHAR(100),
        quantity DECIMAL(10, 2),
        ratePerUnit DECIMAL(10, 2),
        totalAmount DECIMAL(12, 2),
        deliveryDate DATE,
        paymentType VARCHAR(30) DEFAULT 'Cash',
        status ENUM('Pending', 'Delivered', 'Partial', 'Cancelled') DEFAULT 'Pending',
        notes TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        createdBy INT,
        FOREIGN KEY (customerId) REFERENCES customers(id),
        INDEX(salesOrderId),
        INDEX(customerId),
        INDEX(status)
      )
    `);
    console.log('✓ Sales Orders table created');

    // Sales Payments table
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS sales_payments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        salesOrderId INT NOT NULL,
        paymentDate DATE,
        amount DECIMAL(12, 2),
        paymentMode ENUM('Cash', 'Cheque', 'Bank Transfer', 'UPI') NOT NULL,
        reference VARCHAR(255),
        notes TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        createdBy INT,
        FOREIGN KEY (salesOrderId) REFERENCES sales_orders(id),
        INDEX(salesOrderId),
        INDEX(paymentDate)
      )
    `);
    console.log('✓ Sales Payments table created');

    // Expenses table
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INT PRIMARY KEY AUTO_INCREMENT,
        expenseCode VARCHAR(50),
        category VARCHAR(100) NOT NULL,
        description TEXT,
        amount DECIMAL(12, 2),
        paymentMode VARCHAR(50),
        date DATE,
        notes TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        createdBy INT,
        INDEX(category),
        INDEX(date)
      )
    `);
    console.log('✓ Expenses table created');

    // Worker Advances table
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS worker_advances (
        id INT PRIMARY KEY AUTO_INCREMENT,
        workerId INT NOT NULL,
        advanceDate DATE,
        amount DECIMAL(12, 2),
        reason TEXT,
        status ENUM('Pending', 'Approved', 'Settled', 'Cancelled') DEFAULT 'Pending',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        createdBy INT,
        FOREIGN KEY (workerId) REFERENCES workers(id),
        INDEX(workerId),
        INDEX(status)
      )
    `);
    console.log('✓ Worker Advances table created');

    // Leads table
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255),
        phone VARCHAR(20),
        status ENUM('New', 'Contacted', 'Qualified', 'Converted', 'Lost') DEFAULT 'New',
        source VARCHAR(100),
        campaignId INT,
        waSent BOOLEAN DEFAULT 0,
        notes TEXT,
        location VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        createdBy INT,
        INDEX(phone),
        INDEX(status)
      )
    `);
    console.log('✓ Leads table created');

    // Lead Campaigns table
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS lead_campaigns (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255),
        description TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        createdBy INT
      )
    `);
    console.log('✓ Lead Campaigns table created');

    // Lead Templates table
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS lead_templates (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255),
        content TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        createdBy INT
      )
    `);
    console.log('✓ Lead Templates table created');

    // Payment Reconciliations table
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS payment_reconciliations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        orderId INT,
        expectedAmount DECIMAL(12, 2),
        receivedAmount DECIMAL(12, 2),
        reconciliationDate DATE,
        remarks TEXT,
        status ENUM('Pending', 'Reconciled', 'Mismatch') DEFAULT 'Pending',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        createdBy INT
      )
    `);
    console.log('✓ Payment Reconciliations table created');

    // Payment Reminders table
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS payment_reminders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        orderId INT,
        customerId INT,
        reminderDate DATE,
        status ENUM('Pending', 'Notified', 'Completed') DEFAULT 'Pending',
        notifiedAt TIMESTAMP NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        createdBy INT
      )
    `);
    console.log('✓ Payment Reminders table created');

    console.log('✅ All tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
};

createTables();
