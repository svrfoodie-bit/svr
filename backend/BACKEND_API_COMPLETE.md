# Backend Setup & API Documentation

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Create `.env` file in the backend folder:

```bash
# Server
PORT=5000
NODE_ENV=development
API_VERSION=v1
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=svr_cashew_db

# JWT
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRY=7d

# Email (Optional for export features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Scheduler
ENABLE_SCHEDULER=true
```

### 3. Create Database Tables
```bash
npm run setup-db
```

Or manually:
```sql
CREATE DATABASE svr_cashew_db CHARACTER SET utf8mb4;
```

### 4. Start Backend Server
```bash
npm run dev
```

Server runs on `http://localhost:5000`

---

## Complete API Documentation

### Authentication Endpoints

#### Login
```
POST /api/v1/auth/login
Body: {
  "username": "admin",
  "password": "password123"
}
Response: {
  "success": true,
  "token": "jwt-token",
  "user": { id, name, email, username, role, isActive }
}
```

#### Get Current User
```
GET /api/v1/auth/me
Authorization: Bearer {token}
```

#### Change Password
```
PUT /api/v1/auth/change-password
Authorization: Bearer {token}
Body: {
  "oldPassword": "old123",
  "newPassword": "new123"
}
```

---

### Customers Module

#### Get All Customers
```
GET /api/v1/customers?type=Retail&isActive=true&area=Guntur&search=Rajesh
```

#### Get Customer by ID
```
GET /api/v1/customers/{id}
```

#### Create Customer
```
POST /api/v1/customers
Body: {
  "customerId": "C005",
  "name": "New Trader",
  "type": "Wholesale",
  "contactNumber": "9876543210",
  "area": "Bangalore",
  "email": "trader@example.com",
  "address": "123 Market St"
}
```

#### Update Customer
```
PUT /api/v1/customers/{id}
Body: { same fields as create }
```

#### Delete Customer
```
DELETE /api/v1/customers/{id}
```

#### Get Outstanding Customers
```
GET /api/v1/customers/outstanding/list
Returns: Array of customers with outstanding amounts
```

---

### Raw Purchase Module

#### Get All Purchases
```
GET /api/v1/raw-purchases?supplierId=1&startDate=2024-01-01&endDate=2024-12-31
```

#### Create Purchase
```
POST /api/v1/raw-purchases
Body: {
  "supplierId": 1,
  "purchaseDate": "2024-04-04",
  "quantity": 100,
  "ratePerUnit": 50,
  "totalAmount": 5000,
  "grade": "Standard",
  "moisture": 12.5
}
```

#### Get Summary Metrics
```
GET /api/v1/raw-purchases/summary/metrics?startDate=2024-01-01&endDate=2024-12-31
```

---

### Supplier Module

#### Get All Suppliers
```
GET /api/v1/suppliers?isActive=true&area=Andhra&search=vendor
```

#### Create Supplier
```
POST /api/v1/suppliers
Body: {
  "supplierId": "S001",
  "name": "Premium Supplies",
  "contactPerson": "Venkat",
  "phone": "9876543210",
  "area": "Hyderabad"
}
```

#### Get Supplier Summary
```
GET /api/v1/suppliers/summary/metrics?startDate=2024-01-01&endDate=2024-12-31
```

---

### Worker Module

#### Get All Workers
```
GET /api/v1/workers?status=Active&areaOfWork=Processing&search=raj
```

#### Get Active Workers
```
GET /api/v1/workers/active
```

#### Create Worker
```
POST /api/v1/workers
Body: {
  "workerId": "W001",
  "name": "Rajesh Kumar",
  "fatherName": "Kumar Reddy",
  "dateOfBirth": "1990-05-15",
  "mobileNumber": "9876543210",
  "areaOfWork": "Processing",
  "status": "Active",
  "dailyWages": 500
}
```

---

### Daily Work Module

#### Get All Daily Work
```
GET /api/v1/daily-work?workerId=1&startDate=2024-04-01&endDate=2024-04-30
```

#### Create Daily Work
```
POST /api/v1/daily-work
Body: {
  "workerId": 1,
  "workDate": "2024-04-04",
  "workType": "Regular",
  "quantity": 50,
  "rate": 10,
  "totalAmount": 500,
  "bonusEligible": true
}
```

#### Get Work Types
```
GET /api/v1/daily-work/types/list
Returns: ["Regular", "Overtime", "Maintenance", "Training"]
```

#### Get Summary
```
GET /api/v1/daily-work/summary/metrics?startDate=2024-04-01&endDate=2024-04-30
```

---

### Job Work Module

#### Get All Job Work
```
GET /api/v1/job-work?status=In%20Progress&startDate=2024-01-01&endDate=2024-12-31
```

#### Create Job Work
```
POST /api/v1/job-work
Body: {
  "jobWorkId": "JW001",
  "description": "Kernel Processing",
  "vendorName": "ABC Processors",
  "vendorPhone": "9876543210",
  "startDate": "2024-04-01",
  "quantityIn": 500,
  "ratePerUnit": 25,
  "totalAmount": 12500
}
```

---

### Processing Batch Module

#### Get All Batches
```
GET /api/v1/batches?status=In%20Progress
```

#### Create Batch
```
POST /api/v1/batches
Body: {
  "batchNumber": "B001",
  "startDate": "2024-04-01",
  "rawInputQuantity": 1000,
  "grade": "Raw"
}
```

#### Get Batch Grades
```
GET /api/v1/batches/grades/list
Returns: ["LWP", "HLP", "BBL", "Splits", "Kernels"]
```

---

### Finished Goods Stock Module

#### Get All Stock Entries
```
GET /api/v1/finished-goods?grade=LWP&startDate=2024-01-01&endDate=2024-12-31
```

#### Get Stock Summary
```
GET /api/v1/finished-goods/summary
Returns: Stock by grade
```

#### Get Specific Grade Stock
```
GET /api/v1/finished-goods/{grade}/stock
```

#### Record Stock Adjustment
```
POST /api/v1/finished-goods/adjustment
Body: {
  "grade": "LWP",
  "adjustmentType": "Issue",
  "quantity": 50,
  "reason": "Dispatch to customer"
}
```

---

### Sales Order Module

#### Get All Sales Orders
```
GET /api/v1/sales-orders?status=Pending&customerId=1
```

#### Create Sales Order
```
POST /api/v1/sales-orders
Body: {
  "salesOrderId": "SO001",
  "customerId": 1,
  "productGrade": "LWP",
  "quantity": 100,
  "ratePerUnit": 500,
  "totalAmount": 50000,
  "deliveryDate": "2024-05-01"
}
```

#### Get Outstanding Orders
```
GET /api/v1/sales-orders/outstanding/list
```

#### Get Customer-wise Summary
```
GET /api/v1/sales-orders/customer-wise/summary
```

---

### Sales Payment Module

#### Record Payment
```
POST /api/v1/sales-payments
Body: {
  "salesOrderId": 1,
  "paymentDate": "2024-04-05",
  "amount": 25000,
  "paymentMode": "Bank Transfer",
  "reference": "TXN123456"
}
```

#### Get All Payments
```
GET /api/v1/sales-payments?startDate=2024-01-01&endDate=2024-12-31
```

---

### Expense Module

#### Get All Expenses
```
GET /api/v1/expenses?category=Utilities&startDate=2024-01-01&endDate=2024-12-31
```

#### Create Expense
```
POST /api/v1/expenses
Body: {
  "expenseCode": "EXP001",
  "category": "Utilities",
  "description": "Electricity Bill",
  "amount": 5000,
  "paymentMode": "Bank Transfer",
  "date": "2024-04-01"
}
```

#### Get Category-wise Summary
```
GET /api/v1/expenses/category-wise/summary?startDate=2024-01-01&endDate=2024-12-31
```

#### Get Expense Categories
```
GET /api/v1/expenses/categories/list
Returns: ["Utilities", "Transport", "Maintenance", "Packaging", "Labor", "Other"]
```

---

### Worker Advance Module

#### Get Worker Advances
```
GET /api/v1/worker-advances?workerId=1&status=Pending
```

#### Create Advance
```
POST /api/v1/worker-advances
Body: {
  "workerId": 1,
  "advanceDate": "2024-04-01",
  "amount": 5000,
  "reason": "Emergency needs"
}
```

#### Get Worker Outstanding Advances
```
GET /api/v1/worker-advances/worker/{workerId}/outstanding
```

---

### Lead Management Module

#### Get All Leads
```
GET /api/v1/leads?status=New&search=john&limit=50&page=0
```

#### Create Lead
```
POST /api/v1/leads
Body: {
  "name": "John Doe",
  "phone": "9876543210",
  "status": "New",
  "source": "Website",
  "notes": "Interested in bulk orders"
}
```

#### Bulk Import Leads
```
POST /api/v1/leads/bulk-import
Body: {
  "leads": [
    { "name": "Lead 1", "phone": "9876543210" },
    { "name": "Lead 2", "phone": "9988776655" }
  ]
}
```

#### Bulk Delete Leads
```
POST /api/v1/leads/bulk-delete
Body: {
  "ids": [1, 2, 3]
}
```

---

### Lead Campaign Module

#### Get All Campaigns
```
GET /api/v1/lead-campaigns
```

#### Create Campaign
```
POST /api/v1/lead-campaigns
Body: {
  "name": "Summer Sale 2024",
  "description": "Special offer campaign"
}
```

---

### Export Management (Already Implemented)

#### Send Email Export
```
POST /api/v1/exports/email
Body: {
  "module": "SALES",
  "format": "EXCEL",
  "recipients": ["user@example.com"],
  "filters": { "startDate": "2024-01-01" }
}
```

#### Create Export Template
```
POST /api/v1/exports/templates
Body: {
  "name": "Monthly Sales Report",
  "module": "SALES",
  "columns": ["salesOrderId", "customerName", "quantity", "totalAmount"],
  "filters": {}
}
```

#### Get Export History
```
GET /api/v1/exports/history?module=SALES&status=SUCCESS&limit=10
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": []
}
```

Common Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

---

## Database Schema Notes

- All timestamps are in UTC
- Foreign keys are properly linked
- Indexes created for optimal query performance
- Enum fields for limited options (Status, Type, etc.)
- DECIMAL used for monetary values for precision

---

## Next Steps

1. Update frontend API base URL to match backend
2. Create initial admin user in database
3. Set up SMTP for email exports
4. Configure backup schedules
5. Set environment variables for production

---

## Support

For issues or questions, check:
- Backend logs in `logs/` folder
- Database connection in `.env`
- JWT token expiry if auth fails
- CORS settings for frontend URL
