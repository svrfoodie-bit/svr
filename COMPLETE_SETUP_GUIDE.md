# 🚀 Complete Setup & Ready-to-Run Guide

## System Requirements

- **Node.js:** v14+ 
- **MySQL:** v5.7+
- **npm:** v6+

---

## ⚡ Quick Setup (5 Minutes)

### **Step 1: Setup Backend Database**

```bash
cd backend

# Create database tables
npm run setup-db

# Seed sample data + create admin user
npm run seed
```

✅ This creates:
- All 17 database tables
- Admin user (username: `admin`, password: `SVRadmin2024!`)
- Manager user (username: `manager`, password: `manager@123`)
- 50+ sample records for testing

### **Step 2: Start Backend**

```bash
npm run dev
```

Expected output:
```
🚀 Server running on port 5000
🔗 API Base URL: http://localhost:5000/api/v1
⏰ Export scheduler started
```

### **Step 3: Start Frontend**

In a new terminal:

```bash
cd frontend
npm run dev
```

Expected output:
```
VITE v5.0.8 ready in XXX ms

➜ Local: http://localhost:5173/
```

### **Step 4: Login to Application**

1. Open http://localhost:5173
2. Login with:
   - **Username:** `admin`
   - **Password:** `SVRadmin2024!`

🎉 **You're done!** The application is now running.

---

## 📋 Manual Step-by-Step Setup

If you prefer manual setup or need troubleshooting:

### **Backend Setup**

**1. Install Dependencies**
```bash
cd backend
npm install
```

**2. Create `.env` file**

```bash
# Server Config
PORT=5000
NODE_ENV=development
API_VERSION=v1
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Database Config
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=svr_cashew_db

# JWT Config
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRY=7d

# Email Config (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password

# Features
ENABLE_SCHEDULER=true
```

**3. Create Database**

Via MySQL:
```sql
CREATE DATABASE svr_cashew_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**4. Initialize Tables & Data**

```bash
# Create all tables
npm run setup-db

# Insert sample data and users
npm run seed

# Or do both at once
npm run setup
```

**5. Start Backend**

```bash
npm run dev

# Or for production
npm start
```

---

### **Frontend Setup**

**1. Install Dependencies**
```bash
cd frontend
npm install
```

**2. Create `.env` file**

Already created for you! Located at `frontend/.env`:
```
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

**3. Start Development Server**

```bash
npm run dev
```

**4. Open in Browser**

Navigate to: **http://localhost:5173**

---

## 🔐 Access Credentials

After running `npm run seed`, these users are available:

### **Admin Account**
```
Username: admin
Password: SVRadmin2024!
Email: admin@svr.com
Role: Admin (full access)
```

### **Manager Account**
```
Username: manager
Password: manager@123
Email: manager@svr.com
Role: Manager (limited access)
```

---

## 📊 Sample Data Created

The seeder creates realistic test data:

```
✓ 2 Users (Admin + Manager)
✓ 3 Suppliers with contact info
✓ 5 Customers (Mix of Retail/Wholesale)
✓ 4 Workers with wages
✓ 3 Raw Purchases
✓ 3 Processing Batches
✓ 3 Finished Goods Stock entries
✓ 3 Sales Orders
✓ 2 Sales Payments
✓ 4 Daily Work entries
✓ 4 Expenses
✓ 4 Leads
✓ 2 Job Work orders
✓ 2 Worker Advances
```

---

## 🧪 Testing the API

### **Using Postman** (Recommended)

1. Import the collection: [API Documentation](./BACKEND_API_COMPLETE.md)
2. Set Bearer token in Auth tab
3. Start making requests

### **Using cURL**

**Login:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"SVRadmin2024!"}'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@svr.com",
    "username": "admin",
    "role": "Admin"
  }
}
```

**Get Customers:**
```bash
curl -X GET http://localhost:5000/api/v1/customers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Backend running on http://localhost:5000
- [ ] Frontend running on http://localhost:5173
- [ ] Can login with admin/SVRadmin2024!
- [ ] Dashboard displays sample data
- [ ] Customer list shows customers
- [ ] Can create new customer
- [ ] Export function works

---

## 🐛 Troubleshooting

### **Issue: "Database connection failed"**

✅ **Solution:**
```bash
# Check MySQL is running
mysql -u root -p   # You should be able to login

# Verify .env credentials
cat backend/.env | grep DB_

# Recreate database if needed
npm run setup-db
```

### **Issue: "Port 5000 already in use"**

✅ **Solution:**
```bash
# Change port in backend/.env
# Or kill existing process:

# Windows
netstat -ano | findstr :5000
taskkill /PID {PID} /F

# Mac/Linux
lsof -i :5000
kill -9 {PID}
```

### **Issue: "Cannot find module 'exports'"**

✅ **Solution:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### **Issue: "CORS error in browser console"**

✅ **Solution:**
Update `backend/.env`:
```
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

Then restart backend.

### **Issue: "Login fails - invalid credentials"**

✅ **Solution:**
```bash
# Re-seed database
npm run seed

# Or check users in MySQL
mysql> SELECT * FROM users;
```

---

## 🚀 Next Steps After Setup

1. **Customize Sample Data**
   - Edit `seed-database.js` with your actual data
   - Run `npm run seed` again

2. **Configure Email** (for export features)
   - Update SMTP settings in `.env`
   - Get app-specific password from Gmail

3. **Add Your Users**
   - Create additional users via admin panel
   - Or manually insert in database

4. **Configure Backups**
   - Set up automated MySQL backups
   - Consider cloud storage

5. **Deploy to Production**
   - Setup separate production database
   - Use strong JWT_SECRET
   - Enable HTTPS
   - Set NODE_ENV=production

---

## 📚 File Locations

| Location | Purpose |
|----------|---------|
| `backend/src/controllers/` | API business logic |
| `backend/src/models/` | Database models |
| `backend/src/routes/business.routes.js` | All API routes |
| `backend/create-tables.js` | Database schema |
| `backend/seed-database.js` | Sample data |
| `frontend/src/services/` | Frontend API calls |
| `frontend/.env` | Frontend config |
| `backend/.env` | Backend config |

---

## 🎯 Available Commands

### **Backend**
```bash
npm run dev          # Start in development mode
npm start            # Start in production mode
npm run setup-db     # Create database tables
npm run seed         # Insert sample data
npm run setup        # Both setup-db + seed
npm test             # Run tests
```

### **Frontend**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Check code quality
```

---

## 🔗 Important URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000/api/v1 |
| API Health Check | http://localhost:5000/health |
| MySQL | localhost:3306 |

---

## 📞 Support

If you encounter issues:

1. **Check Backend Logs**
   - Look in `backend/logs/` folder
   - Enable debug mode in `.env`

2. **Verify Environment**
   - MySQL running: `mysql -u root -p`
   - Node version: `node --version`
   - npm updated: `npm update -g npm`

3. **Database Reset**
   ```bash
   npm run setup-db && npm run seed
   ```

4. **Complete Reset**
   ```bash
   # Delete database
   mysql> DROP DATABASE svr_cashew_db;
   
   # Run setup
   npm run setup
   ```

---

## ✨ You're All Set!

Your SVR Cashew Factory Management System is ready to use with:

✅ Complete backend API with 70+ endpoints
✅ Beautiful React frontend with 40+ pages  
✅ Sample data for testing
✅ Admin & Manager users
✅ Full CRUD operations
✅ Authentication & authorization
✅ Export functionality
✅ Reporting dashboards

**Start using the application now!** 🎉
