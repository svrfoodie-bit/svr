# Quick Start Checklist - Export Management Backend

## ✅ Current Status

- ✅ Dependencies installed (nodemailer, exceljs, pdfkit, node-cron)
- ✅ Nodemailer error fixed (createTransport method)
- ✅ Email service initialization fixed
- ✅ `.env` file updated with email/scheduler configuration
- ❌ MySQL service not running
- ❌ Database tables not created

---

## 🔧 Required Setup Steps

### Step 1: Start MySQL Service ⚠️ **REQUIRED NOW**

The backend needs MySQL to be running. You have several options:

#### Option A: Start MySQL as Windows Service
```cmd
# Check if MySQL service exists
sc query | findstr MySQL

# If found, start it
net start MySQL
# or
net start MySQL80  (if using MySQL 8.0)
```

#### Option B: Start XAMPP/WAMP
If you're using XAMPP or WAMP:
1. Open XAMPP/WAMP Control Panel
2. Click "Start" next to MySQL
3. Wait for it to turn green

#### Option C: Start MySQL manually
```cmd
# Navigate to MySQL bin directory (adjust path as needed)
cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"

# Start MySQL
mysqld --console
```

### Step 2: Verify Database Connection

After starting MySQL, verify the connection:

```cmd
# Try connecting to MySQL
mysql -u root -p

# Once connected, check if database exists
SHOW DATABASES LIKE 'svr_cashew_db';

# If it exists, you're good. If not, create it:
CREATE DATABASE svr_cashew_db;
```

### Step 3: Update Database Password in `.env`

Edit `backend\.env` and update line 10:

```env
DB_PASSWORD=your_actual_mysql_password
```

Replace `your_actual_mysql_password` with your MySQL root password.

### Step 4: Create Export Management Tables

Once the backend starts successfully, create the tables. You have two options:

#### Option A: Using Node.js Script (Recommended)

Create `backend/create-export-tables.js`:

```javascript
require('dotenv').config();
const ExportTemplate = require('./src/models/ExportTemplate.model');
const ExportHistory = require('./src/models/ExportHistory.model');
const ExportSchedule = require('./src/models/ExportSchedule.model');

async function createTables() {
  try {
    console.log('Creating export tables...');

    await ExportTemplate.createTable();
    console.log('✅ export_templates table created');

    await ExportHistory.createTable();
    console.log('✅ export_history table created');

    await ExportSchedule.createTable();
    console.log('✅ export_schedules table created');

    console.log('\n🎉 All export tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
}

createTables();
```

Then run:
```cmd
cd backend
node create-export-tables.js
```

#### Option B: Using MySQL Workbench or CLI

Run these SQL commands:

```sql
USE svr_cashew_db;

-- Export Templates Table
CREATE TABLE IF NOT EXISTS export_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  module ENUM('SALES', 'PAYMENTS', 'RAW_PURCHASE', 'JOB_WORK', 'EXPENSES', 'CUSTOMERS') NOT NULL,
  columns JSON NOT NULL,
  filters JSON,
  is_default BOOLEAN DEFAULT FALSE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_module (module),
  INDEX idx_is_default (is_default),
  INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Export History Table
CREATE TABLE IF NOT EXISTS export_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type ENUM('EMAIL', 'SCHEDULED', 'MANUAL') NOT NULL,
  module ENUM('SALES', 'PAYMENTS', 'RAW_PURCHASE', 'JOB_WORK', 'EXPENSES', 'CUSTOMERS') NOT NULL,
  format ENUM('EXCEL', 'PDF') NOT NULL,
  recipients TEXT,
  status ENUM('SUCCESS', 'FAILED', 'IN_PROGRESS') DEFAULT 'IN_PROGRESS',
  record_count INT DEFAULT 0,
  file_size INT DEFAULT 0,
  file_path VARCHAR(500),
  error_message TEXT,
  executed_by VARCHAR(100),
  user_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_module (module),
  INDEX idx_status (status),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Export Schedules Table
CREATE TABLE IF NOT EXISTS export_schedules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  module ENUM('SALES', 'PAYMENTS', 'RAW_PURCHASE', 'JOB_WORK', 'EXPENSES', 'CUSTOMERS') NOT NULL,
  frequency ENUM('DAILY', 'WEEKLY', 'MONTHLY') NOT NULL,
  time TIME NOT NULL,
  format ENUM('EXCEL', 'PDF') NOT NULL,
  recipients TEXT NOT NULL,
  template_id INT,
  status ENUM('ACTIVE', 'PAUSED') DEFAULT 'ACTIVE',
  last_run TIMESTAMP NULL,
  next_run TIMESTAMP NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_next_run (next_run),
  INDEX idx_frequency (frequency),
  FOREIGN KEY (template_id) REFERENCES export_templates(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

Verify tables were created:
```sql
SHOW TABLES LIKE 'export_%';
```

### Step 5: Create Exports Directory

```cmd
cd backend
mkdir exports
```

Or if it already exists, that's fine.

### Step 6: Configure Email (Optional - for testing email features)

If you want to test email sending:

1. **Get Gmail App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Generate app password for "Mail"
   - Copy the 16-character password

2. **Update `.env` file:**
   ```env
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=abcdefghijklmnop  (your 16-char app password without spaces)
   ```

---

## 🚀 Testing After Setup

### Test 1: Start Backend

```cmd
cd backend
npm run dev
```

**Expected Output:**
```
✅ Server running on port 5000
✅ Database connected successfully
info: Email service initialized successfully
info: Export scheduler started successfully
```

### Test 2: Verify Tables

```sql
USE svr_cashew_db;
SHOW TABLES LIKE 'export_%';

-- Should show:
-- export_history
-- export_schedules
-- export_templates
```

### Test 3: Test API Endpoint

```cmd
curl http://localhost:5000/api/v1/exports/templates
```

**Expected Response:**
```json
{
  "success": true,
  "data": []
}
```

### Test 4: Create a Template (Optional)

```cmd
curl -X POST http://localhost:5000/api/v1/exports/templates ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test Template\",\"module\":\"SALES\",\"columns\":[\"Order Number\",\"Customer\",\"Amount\"],\"isDefault\":true}"
```

---

## 🐛 Troubleshooting

### Issue: "Database connection failed"

**Solutions:**
1. ✅ Verify MySQL is running: `sc query MySQL` or check XAMPP/WAMP
2. ✅ Verify password in `.env` matches your MySQL password
3. ✅ Verify database exists: `mysql -u root -p -e "SHOW DATABASES LIKE 'svr_cashew_db';"`
4. ✅ Check if port 3306 is being used by MySQL

### Issue: "Email service initialization failed"

This is OK for now - email will only work when you configure SMTP credentials. The backend will still start and work for all other features.

### Issue: "Table doesn't exist"

Run the table creation SQL from Step 4.

### Issue: "Access denied for user 'root'"

Update `DB_PASSWORD` in `.env` file with correct MySQL password.

---

## 📋 Summary

**What's Working:**
- ✅ Nodemailer error fixed
- ✅ Backend code ready
- ✅ `.env` file configured

**What You Need to Do:**
1. ⚠️ **Start MySQL** (most important)
2. ⚠️ **Update DB_PASSWORD** in `.env`
3. ⚠️ **Create export tables** (run SQL)
4. ✅ Start backend with `npm run dev`
5. 🎯 Test API endpoints

**Optional (for email testing):**
- Configure Gmail SMTP credentials in `.env`

---

## 🎯 Next Steps After Setup

Once the backend is running successfully:

1. **Test the Export Management UI** in the frontend
2. **Integrate with real module data** (sales, payments, etc.)
3. **Test email sending** (if SMTP configured)
4. **Test scheduled reports** (create a schedule and wait for execution)

---

**Current Status:** Ready to start MySQL and create tables! 🚀

**Estimated Setup Time:** 5-10 minutes

**Last Updated:** December 22, 2025
