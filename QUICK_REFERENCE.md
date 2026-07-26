# SVR System - Quick Reference Guide

## 🚀 Quick Start (First Time Setup)

**Windows:**
```bash
setup.bat
```

This single command will:
- ✓ Install all dependencies
- ✓ Create database tables
- ✓ Seed sample data
- ✓ Configure frontend

## ▶️ Running the Application

### Automatic (Recommended)
```bash
start-servers.bat
```

### Manual (Two Terminals)
**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend runs on: `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on: `http://localhost:5173`

## 🔐 Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `SVRadmin2024!` |
| Manager | `manager` | `manager@123` |

## ✅ Verify Setup

Before running for the first time, check everything is installed:
```bash
verify-setup.bat
```

This checks:
- Node.js installation
- npm installation
- MySQL server running
- Dependencies installed
- Configuration files present

## 📁 Project Structure

```
svr/
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── server.js       # Main server entry point
│   │   ├── config/         # Database & logger config
│   │   ├── models/         # 17 database models
│   │   ├── controllers/    # Business logic (9 controllers)
│   │   ├── routes/         # API endpoints (70+)
│   │   ├── middleware/     # Auth, logging, error handling
│   │   ├── services/       # Email, scheduler, export services
│   │   └── utils/          # Helper functions
│   ├── create-tables.js    # Initialize database schema
│   ├── seed-database.js    # Populate sample data
│   └── package.json        # Dependencies
│
├── frontend/               # React/Vite application
│   ├── src/
│   │   ├── main.jsx        # Entry point
│   │   ├── App.jsx         # Main component
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # 40+ page components
│   │   ├── context/        # Auth state (Zustand)
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API client (Axios)
│   │   ├── styles/         # Global CSS
│   │   └── utils/          # Helper functions
│   ├── index.html          # HTML template
│   ├── vite.config.js      # Vite configuration
│   ├── tailwind.config.js  # Tailwind CSS config
│   └── package.json        # Dependencies
│
└── setup.bat               # Automatic setup script
```

## 🔧 NPM Commands

### Backend Commands
```bash
cd backend

npm run dev          # Start development server with auto-reload
npm run setup-db     # Create database tables
npm run seed         # Populate sample data
npm run setup        # Both setup-db and seed
npm start            # Start production server
```

### Frontend Commands
```bash
cd frontend

npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Check code quality
```

## 📊 Sample Data Included

The seed script creates realistic test data:

- **2 Users** (Admin + Manager with different permissions)
- **3 Suppliers** (with contact information)
- **5 Customers** (mix of retail and wholesale)
- **4 Workers** (with wage details)
- **3 Raw Purchases** (material procurement)
- **3 Processing Batches** (production batches)
- **3 Finished Goods** (inventory by grade)
- **3 Sales Orders** (customer orders)
- **2 Sales Payments** (payment recording)
- **4 Daily Work Entries** (work tracking)
- **4 Expenses** (expense tracking)
- **4 Leads** (CRM leads)
- **2 Job Work Orders** (external processing)
- **2 Worker Advances** (salary advances)

## 🛠️ Common Commands

| Task | Command |
|------|---------|
| First time setup | `setup.bat` |
| Check setup | `verify-setup.bat` |
| Start servers | `start-servers.bat` |
| Reset database | `cd backend && npm run setup && npm run seed` |
| Backend only | `cd backend && npm run dev` |
| Frontend only | `cd frontend && npm run dev` |
| Clear cache | `cd frontend && rmdir /s /q node_modules` then `npm install` |

## 🌐 API Endpoints

Backend serves 70+ REST endpoints organized by feature:

**Base URL:** `http://localhost:5000/api/v1`

### Available Modules
- **Authentication** - User login, JWT tokens
- **Customers** - CRUD + outstanding tracking
- **Suppliers** - Supplier management
- **Raw Purchases** - Material procurement
- **Workers** - Employee management
- **Daily Work** - Work tracking
- **Job Work** - External processing
- **Processing** - Production batches
- **Inventory** - Stock management
- **Sales** - Orders, payments, reports
- **Expenses** - Expense tracking
- **Leads** - CRM management
- **Export** - CSV export functionality
- **Payments** - Payment reconciliation

## 📝 Configuration Files

### Backend (.env)
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=svr_factory
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
NODE_ENV=development
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## 🐛 Troubleshooting

### MySQL Connection Failed
```bash
# Windows - Start MySQL service
net start MySQL80

# Or restart from Services (services.msc)
```

### Port Already in Use
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID with actual number)
taskkill /PID <PID> /F
```

### Dependencies Not Installing
```bash
cd backend
rmdir /s /q node_modules
npm install
```

### Database Reset
```bash
cd backend
npm run setup    # Recreates tables
npm run seed     # Repopulates data
```

## 📖 Full Documentation

For detailed information, see:
- [COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md) - Complete setup guide
- [BACKEND_SETUP_GUIDE.md](./BACKEND_SETUP_GUIDE.md) - Backend configuration
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Project architecture
- [QUICK_START_CHECKLIST.md](./QUICK_START_CHECKLIST.md) - Setup checklist
- [backend/README.md](./backend/README.md) - Backend documentation
- [frontend/README.md](./frontend/README.md) - Frontend documentation

## 🎯 Next Steps After Startup

1. ✓ Login with `admin` / `SVRadmin2024!`
2. ✓ Navigate to Dashboard to see sample data
3. ✓ Try creating a new Customer/Supplier
4. ✓ Export data to CSV (Export Management page)
5. ✓ Review sample data in different modules
6. ✓ Read documentation for customization

## 🚨 Getting Help

If something doesn't work:

1. **Check verify-setup.bat** for missing components
2. **Review error logs** - Check browser console (F12) and terminal output
3. **Check COMPLETE_SETUP_GUIDE.md** for detailed troubleshooting
4. **Restart services** - Sometimes restarting MySQL and servers helps
5. **Database reset** - Run `npm run setup && npm run seed` to reset everything

---

**System is ready to use!** 🎉

Choose one method to start:
- Quick: `setup.bat` then `start-servers.bat`
- Manual: Follow instructions above for each terminal
