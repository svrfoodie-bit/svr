# Backend Setup Guide - Export Management

This guide will help you set up and test the backend API integration for Export Management.

---

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL Database running
- Gmail account (for SMTP) OR other email provider

---

## 🚀 Step-by-Step Setup

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

This will install the new dependencies:
- `nodemailer@^6.9.7` - Email sending
- `exceljs@^4.4.0` - Excel file generation
- `pdfkit@^0.14.0` - PDF file generation
- `node-cron@^3.0.3` - Scheduled task execution

### Step 2: Configure Email Service (Gmail)

#### 2.1 Enable 2-Factor Authentication
1. Go to your Google Account: https://myaccount.google.com
2. Navigate to **Security**
3. Enable **2-Step Verification** if not already enabled

#### 2.2 Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select **Mail** as the app
3. Select **Windows Computer** (or your device)
4. Click **Generate**
5. Copy the 16-character password (example: `abcd efgh ijkl mnop`)

#### 2.3 Update `.env` File

Create `backend/.env` file (if it doesn't exist) and add:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=svr_cashew_db

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Other Configuration
ALLOWED_ORIGINS=http://localhost:3000
LOG_LEVEL=info

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM=SVR Cashew Management <noreply@svrfood.com>

# Scheduler Configuration
ENABLE_SCHEDULER=true
```

**Replace:**
- `your-email@gmail.com` with your actual Gmail address
- `abcd efgh ijkl mnop` with your 16-character app password (remove spaces)

### Step 3: Create Database Tables

You have two options:

#### Option A: Using Node.js Script

Create `backend/create-export-tables.js`:

```javascript
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

Run it:
```bash
node create-export-tables.js
```

#### Option B: Using MySQL Workbench or CLI

Run these SQL commands:

```sql
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

### Step 4: Create Exports Directory

The backend needs a directory to store generated files:

```bash
# From backend directory
mkdir -p exports
```

Or on Windows:
```cmd
mkdir exports
```

### Step 5: Start the Backend Server

```bash
# Development mode with auto-reload
npm run dev

# OR Production mode
npm start
```

You should see:
```
✅ Server running on port 5000
✅ Database connected successfully
✅ Export scheduler started
```

---

## 🧪 Testing the APIs

### Test 1: Email Export

```bash
curl -X POST http://localhost:5000/api/v1/exports/email \
  -H "Content-Type: application/json" \
  -d "{
    \"module\": \"SALES\",
    \"format\": \"EXCEL\",
    \"recipients\": \"your-email@gmail.com\",
    \"subject\": \"Test Export Report\",
    \"message\": \"This is a test export from SVR Cashew Management\",
    \"includeCharts\": false,
    \"data\": [
      {\"id\": 1, \"orderNumber\": \"ORD-001\", \"customer\": \"John Doe\", \"amount\": 50000, \"status\": \"COMPLETED\"},
      {\"id\": 2, \"orderNumber\": \"ORD-002\", \"customer\": \"Jane Smith\", \"amount\": 75000, \"status\": \"PENDING\"}
    ],
    \"columns\": [\"Order Number\", \"Customer\", \"Amount\", \"Status\"]
  }"
```

**Expected Result:** You should receive an email with an Excel file attached.

### Test 2: Create Export Template

```bash
curl -X POST http://localhost:5000/api/v1/exports/templates \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Sales Summary Report\",
    \"module\": \"SALES\",
    \"columns\": [\"Order Number\", \"Customer\", \"Date\", \"Amount\", \"Status\"],
    \"filters\": {\"timeRange\": \"MONTH\", \"status\": \"COMPLETED\"},
    \"isDefault\": true
  }"
```

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Sales Summary Report",
    "module": "SALES",
    "columns": ["Order Number", "Customer", "Date", "Amount", "Status"],
    "is_default": true
  }
}
```

### Test 3: Get All Templates

```bash
curl http://localhost:5000/api/v1/exports/templates
```

### Test 4: Create Schedule

```bash
curl -X POST http://localhost:5000/api/v1/exports/schedules \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Daily Sales Report\",
    \"module\": \"SALES\",
    \"frequency\": \"DAILY\",
    \"time\": \"09:00\",
    \"format\": \"EXCEL\",
    \"recipients\": \"your-email@gmail.com\",
    \"status\": \"ACTIVE\"
  }"
```

### Test 5: Get Export History

```bash
curl "http://localhost:5000/api/v1/exports/history?type=EMAIL&limit=10"
```

### Test 6: Get Export Statistics

```bash
curl "http://localhost:5000/api/v1/exports/statistics?startDate=2024-01-01&endDate=2024-12-31"
```

---

## 🔧 Troubleshooting

### Issue: Email Not Sending

**Symptoms:**
- API returns success but no email received
- Error: "Invalid login" or "Authentication failed"

**Solutions:**

1. **Verify Gmail App Password:**
   - Make sure you copied the 16-character password correctly
   - Remove all spaces: `abcd efgh ijkl mnop` → `abcdefghijklmnop`

2. **Check `.env` Configuration:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false  # Must be false for port 587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password-without-spaces
   ```

3. **Test Email Service Manually:**
   Create `backend/test-email.js`:
   ```javascript
   const emailService = require('./src/services/email.service');

   async function testEmail() {
     try {
       await emailService.initialize();
       const isReady = await emailService.verify();

       if (isReady) {
         console.log('✅ Email service is ready');

         const result = await emailService.sendEmail({
           to: 'your-email@gmail.com',
           subject: 'Test Email',
           text: 'This is a test email',
           html: '<h1>This is a test email</h1>'
         });

         console.log('✅ Email sent:', result);
       } else {
         console.log('❌ Email service not ready');
       }
     } catch (error) {
       console.error('❌ Error:', error);
     }
   }

   testEmail();
   ```

   Run: `node test-email.js`

4. **Check Firewall:**
   - Ensure port 587 is not blocked by firewall
   - Try disabling antivirus temporarily

5. **Alternative: Use Different SMTP Provider**

   **SendGrid:**
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   ```

### Issue: Tables Not Created

**Solution:**
```bash
# Check if database exists
mysql -u root -p -e "SHOW DATABASES LIKE 'svr_cashew_db';"

# Check if tables exist
mysql -u root -p svr_cashew_db -e "SHOW TABLES LIKE 'export_%';"

# Manually create tables using SQL from Step 3
```

### Issue: Scheduler Not Running

**Symptoms:**
- Scheduled reports not being sent
- No scheduler logs in console

**Solutions:**

1. **Check `.env` Configuration:**
   ```env
   ENABLE_SCHEDULER=true  # Must be true
   ```

2. **Check Scheduler Status:**
   Add this endpoint to test (temporary):
   ```javascript
   // In server.js or routes file
   app.get('/api/v1/scheduler/status', (req, res) => {
     const status = schedulerService.getStatus();
     res.json(status);
   });
   ```

   Then: `curl http://localhost:5000/api/v1/scheduler/status`

3. **View Scheduler Logs:**
   Check console for messages like:
   ```
   Export scheduler started successfully
   Found X due schedules
   Running schedule: Daily Sales Report
   ```

### Issue: Files Not Generating

**Symptoms:**
- API returns success but no file created
- Error: "ENOENT: no such file or directory"

**Solution:**
```bash
# Create exports directory
mkdir -p backend/exports

# Check directory permissions (Linux/Mac)
chmod 755 backend/exports

# Verify in code
ls -la backend/exports
```

### Issue: PDF Generation Fails

**Symptoms:**
- Excel works but PDF fails
- Error: "Cannot find module 'pdfkit'"

**Solution:**
```bash
# Reinstall pdfkit
cd backend
npm uninstall pdfkit
npm install pdfkit@^0.14.0
```

---

## 📊 Monitoring Scheduled Reports

### View Next Scheduled Runs

```sql
SELECT id, name, module, frequency, time, next_run, status
FROM export_schedules
WHERE status = 'ACTIVE'
ORDER BY next_run ASC;
```

### View Recent Export History

```sql
SELECT id, type, module, format, status, record_count, created_at
FROM export_history
ORDER BY created_at DESC
LIMIT 10;
```

### Check Failed Exports

```sql
SELECT id, type, module, error_message, created_at
FROM export_history
WHERE status = 'FAILED'
ORDER BY created_at DESC;
```

---

## 🔐 Security Best Practices

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Use environment variables** for all sensitive data
3. **Rotate SMTP passwords** regularly
4. **Add authentication middleware** to routes before production
5. **Implement rate limiting** for email sending
6. **Validate file paths** to prevent directory traversal
7. **Set up file cleanup** to prevent disk space issues

---

## 🎯 Next Steps

After successful setup:

1. **Integrate with Frontend:**
   - The `exportService.js` is already created
   - Update `ExportManagement.jsx` to use real API calls instead of mock data

2. **Connect Module Data:**
   - Update `scheduler.service.js` → `getModuleData()` method
   - Connect to actual `salesOrderService`, `rawPurchaseService`, etc.

3. **Add Authentication:**
   - Protect routes with auth middleware
   - Associate exports with logged-in users

4. **Test Scheduled Reports:**
   - Create a test schedule for 2 minutes from now
   - Verify email is received automatically

5. **Production Deployment:**
   - Use production-grade SMTP service (SendGrid, AWS SES)
   - Set up S3 for file storage
   - Configure email queue (Bull/BullMQ)
   - Enable HTTPS
   - Set up monitoring and logging

---

## 📞 Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify all dependencies are installed
3. Ensure database is running and accessible
4. Test email service separately
5. Check file permissions for `exports/` directory

---

**Last Updated:** December 21, 2025
**Version:** 1.0.0
**Status:** ✅ Ready for Testing
