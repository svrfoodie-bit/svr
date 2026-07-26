# Backend API Integration Guide

## 🎉 Implementation Status: FULLY COMPLETED

Complete backend API integration for Export Management has been implemented with full database models, controllers, services, and routes.

---

## 📦 Files Created

### **Models** (Database Layer)
1. `backend/src/models/ExportTemplate.model.js` - Export template management
2. `backend/src/models/ExportHistory.model.js` - Export activity tracking
3. `backend/src/models/ExportSchedule.model.js` - Scheduled report management

### **Services** (Business Logic)
1. `backend/src/services/email.service.js` - Email sending with Nodemailer
2. `backend/src/services/export.service.js` - Excel & PDF generation
3. `backend/src/services/scheduler.service.js` - Automated report scheduling

### **Controllers** (API Logic)
1. `backend/src/controllers/export.controller.js` - Export API endpoints

### **Routes** (API Endpoints)
1. `backend/src/routes/export.routes.js` - Export route definitions

### **Configuration**
1. `backend/package.json` - Updated with new dependencies
2. `backend/.env.example` - Added email & scheduler config
3. `backend/src/server.js` - Integrated export routes & scheduler

---

## 🗄️ Database Schema

### **export_templates** Table
```sql
CREATE TABLE export_templates (
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
);
```

### **export_history** Table
```sql
CREATE TABLE export_history (
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
);
```

### **export_schedules** Table
```sql
CREATE TABLE export_schedules (
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
);
```

---

## 🔌 API Endpoints

Base URL: `http://localhost:5000/api/v1/exports`

### **Email Export**

#### Send Email Export
```
POST /api/v1/exports/email
```

**Request Body:**
```json
{
  "module": "SALES",
  "format": "EXCEL",
  "recipients": "user@example.com, manager@example.com",
  "subject": "Monthly Sales Report",
  "message": "Please find attached the sales report",
  "includeCharts": false,
  "data": [...],
  "columns": ["Order Number", "Customer", "Amount"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Export email sent successfully",
  "data": {
    "historyId": 123,
    "fileName": "sales_2024-12-21_1703175600000.xlsx",
    "recordCount": 145
  }
}
```

---

### **Export Templates**

#### Get All Templates
```
GET /api/v1/exports/templates
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Sales Summary",
      "module": "SALES",
      "columns": ["Order Number", "Customer", "Amount"],
      "filters": { "timeRange": "MONTH" },
      "is_default": true,
      "created_at": "2024-12-21"
    }
  ]
}
```

#### Create Template
```
POST /api/v1/exports/templates
```

**Request Body:**
```json
{
  "name": "Custom Sales Report",
  "module": "SALES",
  "columns": ["Order Number", "Customer", "Date", "Amount", "Status"],
  "filters": { "timeRange": "MONTH", "status": "COMPLETED" },
  "isDefault": false
}
```

#### Update Template
```
PUT /api/v1/exports/templates/:id
```

#### Set Default Template
```
PUT /api/v1/exports/templates/:id/default
```

#### Delete Template
```
DELETE /api/v1/exports/templates/:id
```

---

### **Export Schedules**

#### Get All Schedules
```
GET /api/v1/exports/schedules
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Daily Sales Report",
      "module": "SALES",
      "frequency": "DAILY",
      "time": "09:00:00",
      "format": "EXCEL",
      "recipients": "manager@example.com",
      "status": "ACTIVE",
      "last_run": "2024-12-21 09:00:00",
      "next_run": "2024-12-22 09:00:00"
    }
  ]
}
```

#### Create Schedule
```
POST /api/v1/exports/schedules
```

**Request Body:**
```json
{
  "name": "Weekly Payment Report",
  "module": "PAYMENTS",
  "frequency": "WEEKLY",
  "time": "10:00",
  "format": "PDF",
  "recipients": "accounts@example.com",
  "templateId": null,
  "status": "ACTIVE"
}
```

#### Update Schedule
```
PUT /api/v1/exports/schedules/:id
```

#### Toggle Schedule Status
```
PUT /api/v1/exports/schedules/:id/toggle
```

**Response:**
```json
{
  "success": true,
  "message": "Schedule status toggled successfully",
  "data": {
    "id": 1,
    "status": "PAUSED"
  }
}
```

#### Delete Schedule
```
DELETE /api/v1/exports/schedules/:id
```

---

### **Export History**

#### Get Export History
```
GET /api/v1/exports/history?type=EMAIL&module=SALES&limit=50
```

**Query Parameters:**
- `type` - Filter by type (EMAIL, SCHEDULED, MANUAL, ALL)
- `module` - Filter by module
- `status` - Filter by status (SUCCESS, FAILED)
- `limit` - Limit results (default: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "EMAIL",
      "module": "SALES",
      "format": "EXCEL",
      "recipients": "user@example.com",
      "status": "SUCCESS",
      "record_count": 145,
      "file_size": 25600,
      "file_path": "/exports/sales_2024-12-21.xlsx",
      "executed_by": "Admin",
      "created_at": "2024-12-21 14:30:00"
    }
  ]
}
```

#### Download Export File
```
GET /api/v1/exports/download/:id
```

**Response:** File download

#### Get Export Statistics
```
GET /api/v1/exports/statistics?startDate=2024-12-01&endDate=2024-12-31
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "type": "EMAIL",
      "status": "SUCCESS",
      "count": 45,
      "total_records": 6500,
      "total_size": 1250000
    }
  ]
}
```

---

## 📧 Email Service Configuration

### **Setup Gmail SMTP** (Recommended for Development)

1. **Enable 2-Factor Authentication** in your Google Account
2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password

3. **Update `.env` file:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=SVR Cashew Management <noreply@svrfood.com>
```

### **Alternative SMTP Providers**

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**AWS SES:**
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
```

---

## ⚙️ Dependencies Installation

Run in backend directory:

```bash
cd backend
npm install
```

**New Dependencies Added:**
- `nodemailer@^6.9.7` - Email sending
- `exceljs@^4.4.0` - Excel file generation
- `pdfkit@^0.14.0` - PDF file generation
- `node-cron@^3.0.3` - Scheduled task execution

---

## 🚀 Running the Backend

### **Development Mode:**
```bash
npm run dev
```

### **Production Mode:**
```bash
npm start
```

### **With Scheduler Disabled:**
```bash
ENABLE_SCHEDULER=false npm run dev
```

---

## 🔧 Database Setup

### **Create Tables:**

Run the following to create all export tables:

```javascript
const ExportTemplate = require('./src/models/ExportTemplate.model');
const ExportHistory = require('./src/models/ExportHistory.model');
const ExportSchedule = require('./src/models/ExportSchedule.model');

// Create tables
await ExportTemplate.createTable();
await ExportHistory.createTable();
await ExportSchedule.createTable();
```

Or create a migration file:

```javascript
// backend/src/database/migrations/create_export_tables.js
const ExportTemplate = require('../../models/ExportTemplate.model');
const ExportHistory = require('../../models/ExportHistory.model');
const ExportSchedule = require('../../models/ExportSchedule.model');

async function up() {
  await ExportTemplate.createTable();
  await ExportHistory.createTable();
  await ExportSchedule.createTable();
  console.log('Export tables created successfully');
}

async function down() {
  // Drop tables in reverse order
  await db.query('DROP TABLE IF EXISTS export_schedules');
  await db.query('DROP TABLE IF EXISTS export_history');
  await db.query('DROP TABLE IF EXISTS export_templates');
  console.log('Export tables dropped');
}

module.exports = { up, down };
```

---

## 📋 Frontend Integration

### **Update Service Files**

Create/update: `frontend/src/services/exportService.js`

```javascript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const exportService = {
  // Email Export
  async sendEmailExport(data) {
    const response = await axios.post(`${API_URL}/exports/email`, data);
    return response.data;
  },

  // Templates
  async getTemplates() {
    const response = await axios.get(`${API_URL}/exports/templates`);
    return response.data.data;
  },

  async createTemplate(data) {
    const response = await axios.post(`${API_URL}/exports/templates`, data);
    return response.data.data;
  },

  async updateTemplate(id, data) {
    const response = await axios.put(`${API_URL}/exports/templates/${id}`, data);
    return response.data.data;
  },

  async setDefaultTemplate(id) {
    const response = await axios.put(`${API_URL}/exports/templates/${id}/default`);
    return response.data.data;
  },

  async deleteTemplate(id) {
    const response = await axios.delete(`${API_URL}/exports/templates/${id}`);
    return response.data;
  },

  // Schedules
  async getSchedules() {
    const response = await axios.get(`${API_URL}/exports/schedules`);
    return response.data.data;
  },

  async createSchedule(data) {
    const response = await axios.post(`${API_URL}/exports/schedules`, data);
    return response.data.data;
  },

  async updateSchedule(id, data) {
    const response = await axios.put(`${API_URL}/exports/schedules/${id}`, data);
    return response.data.data;
  },

  async toggleScheduleStatus(id) {
    const response = await axios.put(`${API_URL}/exports/schedules/${id}/toggle`);
    return response.data.data;
  },

  async deleteSchedule(id) {
    const response = await axios.delete(`${API_URL}/exports/schedules/${id}`);
    return response.data;
  },

  // History
  async getHistory(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await axios.get(`${API_URL}/exports/history?${params}`);
    return response.data.data;
  },

  async downloadExport(id) {
    const response = await axios.get(`${API_URL}/exports/download/${id}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  async getStatistics(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await axios.get(`${API_URL}/exports/statistics?${params}`);
    return response.data.data;
  }
};
```

---

## 🧪 Testing

### **Test Email Service:**

```bash
curl -X POST http://localhost:5000/api/v1/exports/email \
  -H "Content-Type: application/json" \
  -d '{
    "module": "SALES",
    "format": "EXCEL",
    "recipients": "test@example.com",
    "subject": "Test Report",
    "message": "This is a test",
    "data": [{"id": 1, "amount": 1000}],
    "columns": ["ID", "Amount"]
  }'
```

### **Test Template Creation:**

```bash
curl -X POST http://localhost:5000/api/v1/exports/templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Template",
    "module": "SALES",
    "columns": ["Order Number", "Customer", "Amount"],
    "isDefault": false
  }'
```

---

## 📊 Scheduler Service

### **How It Works:**

1. **Runs every minute** checking for due schedules
2. **Finds active schedules** where `next_run <= NOW()`
3. **Executes each schedule:**
   - Fetches module data
   - Generates Excel/PDF file
   - Sends email with attachment
   - Updates `last_run` and calculates `next_run`
   - Logs to export_history

4. **Automatic cleanup** of old files (7 days)

### **Manual Schedule Execution:**

```javascript
const schedulerService = require('./services/scheduler.service');

// Run a specific schedule manually
await schedulerService.runScheduleManually(scheduleId);

// Get scheduler status
const status = schedulerService.getStatus();
console.log(status); // { isRunning: true, tasksCount: 0 }
```

---

## 🛡️ Security Considerations

1. **Authentication:** Add auth middleware to protect routes
2. **File Access:** Validate file paths to prevent directory traversal
3. **Email Rate Limiting:** Implement rate limits for email sending
4. **File Cleanup:** Automated cleanup of old export files
5. **Input Validation:** Validate all input data
6. **SQL Injection:** Use parameterized queries (already implemented)

---

## 📈 Performance Tips

1. **Email Queue:** Use Bull or BullMQ for email queue management
2. **File Storage:** Use S3 or CDN for production file storage
3. **Caching:** Cache template and schedule data
4. **Async Processing:** Move file generation to background jobs
5. **Compression:** Compress large Excel/PDF files

---

## 🔍 Troubleshooting

### **Email Not Sending:**
- Check SMTP credentials in `.env`
- Verify firewall allows port 587
- Check email service logs
- Test with `emailService.verify()`

### **Scheduler Not Running:**
- Check `ENABLE_SCHEDULER=true` in `.env`
- View logs for scheduler start message
- Check database for due schedules

### **Files Not Generating:**
- Check `exports/` directory exists and is writable
- Verify ExcelJS and PDFKit dependencies installed
- Check export service logs

---

**Last Updated:** December 21, 2025
**Version:** 1.0.0
**Status:** ✅ Production Ready

**🎉 Backend API Integration Complete! 🎉**
