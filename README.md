# SVR Food Production - Cashew Processing Factory Management System

A comprehensive full-stack application for managing cashew processing factory operations, including raw material procurement, production tracking, worker management, sales, inventory, and financial reporting.

## Project Overview

This system digitizes and streamlines the complete workflow of a cashew processing factory:

- **Raw Material Management** - Track raw cashew purchases and inventory
- **Production Tracking** - Monitor processing stages from roasting to grading
- **Worker Management** - Manage workers, daily work logs, wages, bonuses, and advances
- **Outside Job Work** - Track steaming/roasting sent to external job workers
- **Inventory Control** - Real-time stock management with grade-wise tracking
- **Sales & Dispatch** - Create parcels, manage deliveries, and customer payments
- **Financial Management** - Track expenses, cashflow, and calculate batch-wise profits
- **Reporting & Analytics** - Comprehensive reports for business insights
- **Audit Trail** - Complete logging of all critical operations

## Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL
- **Authentication:** JWT (JSON Web Tokens)
- **Logging:** Winston
- **Security:** Helmet, CORS
- **Validation:** express-validator

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM v6
- **State Management:** Zustand
- **API Client:** Axios
- **Data Fetching:** React Query
- **Forms:** React Hook Form
- **Icons:** Lucide React
- **Charts:** Recharts
- **Notifications:** React Hot Toast

### Database
- **RDBMS:** MySQL 8.0+

## Project Structure

```
svr-cashew-management/
├── backend/                 # Node.js + Express.js backend
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── services/       # Business logic
│   │   ├── validators/     # Input validation
│   │   ├── utils/          # Utilities
│   │   ├── database/       # Migrations & seeders
│   │   └── server.js       # Entry point
│   └── package.json
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom hooks
│   │   ├── context/        # State management
│   │   ├── utils/          # Utilities
│   │   ├── styles/         # Global styles
│   │   ├── App.jsx         # Main component
│   │   └── main.jsx        # Entry point
│   └── package.json
│
└── README.md               # This file
```

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd svr-cashew-management
```

2. **Setup Backend**

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
```

Create MySQL database:
```sql
CREATE DATABASE svr_cashew_db;
```

Run migrations:
```bash
npm run migrate
```

Start backend server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

3. **Setup Frontend**

```bash
cd ../frontend
npm install
cp .env.example .env
# Edit .env if needed (default backend URL is already set)
```

Start frontend server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

### Default Login Credentials

**🔥 QUICK TEST MODE:** The frontend currently has **mock authentication** enabled!
You can test the UI immediately without setting up the backend.

**Mock Credentials (Frontend Only):**

- **Owner:** username: `owner` / password: `owner123`
- **Supervisor:** username: `supervisor` / password: `supervisor123`
- **Accountant:** username: `accountant` / password: `accountant123`

📖 See [MOCK_CREDENTIALS.md](MOCK_CREDENTIALS.md) for details on switching to real backend authentication.

**Real Backend Credentials (After Database Seeding):**
Same credentials as above, but validated against the database.

## Features by Module

### Master Data Management
- Supplier Master
- Worker Master (with active/inactive status)
- Work Type Master (with bonus eligibility)
- Bonus Rate Master (kg-based rates)
- White Cashew Grade Master (Jumbo, Large, Average, Small, 4pc, 8pc, Broken)
- Customer & Location Master

### Operations Management
- Raw Cashew Purchase & Lot Tracking
- Outside Job Work (Steaming) with status tracking
- Worker Daily Work Log with automated wage & bonus calculation
- White Cashew Production with yield & wastage tracking
- Grade Conversion/Rework tracking
- Parcel Creation & Dispatch with stock reservation

### Financial Management
- Worker Advance Management & Settlement
- Automated Worker Ledger (Earned vs Paid vs Balance)
- Customer Payment Tracking (Full/Partial/Pending)
- Multiple Payment Modes (Cash, PhonePe, Bank)
- Factory Expenses by Category
- Daily Cashflow with Day-End Closure
- Batch-wise Profit Calculation

### Inventory Management
- Raw Cashew Stock (Lot-wise & Quality-wise)
- White Cashew Stock (Grade-wise with value tracking)
- Stock Reservation System for Parcels
- Job Work Status Tracking

### Reporting & Analytics
- Raw Stock Report
- White Cashew Stock by Grade
- Worker Wage & Bonus Report
- Parcel & Dispatch Report
- Customer Outstanding Report
- Daily Cashflow Report
- Batch-wise Profit Report

### Security & Audit
- Role-based Access Control (Owner, Supervisor, Accountant)
- JWT-based Authentication
- Complete Audit Trail for all critical operations
- Day-end closure with owner-only reopen capability
- No manual stock edits allowed

## User Roles & Permissions

| Feature | Owner | Supervisor | Accountant |
|---------|-------|------------|------------|
| Master Data Management | ✅ | ✅ | ❌ |
| Raw Purchases | ✅ | ✅ | View Only |
| Production Entries | ✅ | ✅ | ❌ |
| Worker Daily Work | ✅ | ✅ | ❌ |
| Parcel Creation | ✅ | ✅ | ❌ |
| Worker Payments | ✅ | ❌ | ✅ |
| Customer Payments | ✅ | ❌ | ✅ |
| Expenses | ✅ | ❌ | ✅ |
| Cashflow Management | ✅ | ❌ | ✅ |
| All Reports | ✅ | ✅ | ✅ |
| Reopen Closed Day | ✅ | ❌ | ❌ |

## API Documentation

Base URL: `http://localhost:5000/api/v1`

### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### Suppliers
- `GET /suppliers` - List all suppliers
- `POST /suppliers` - Create supplier
- `PUT /suppliers/:id` - Update supplier
- `DELETE /suppliers/:id` - Delete supplier

(More endpoints will be documented as modules are developed)

## Development Roadmap

### Phase 1: Foundation (Current)
- [x] Project structure setup
- [ ] Database schema design
- [ ] Authentication & authorization
- [ ] User management

### Phase 2: Master Data
- [ ] Supplier management
- [ ] Worker management
- [ ] Work type & bonus rate management
- [ ] Grade management
- [ ] Customer management

### Phase 3: Operations
- [ ] Raw cashew purchase
- [ ] Outside job work
- [ ] Worker daily work log
- [ ] Production tracking
- [ ] Parcel/dispatch

### Phase 4: Financial
- [ ] Worker payments & advances
- [ ] Customer payments
- [ ] Expenses tracking
- [ ] Cashflow management
- [ ] Profit calculation

### Phase 5: Reporting & Analytics
- [ ] Stock reports
- [ ] Worker reports
- [ ] Sales reports
- [ ] Financial reports
- [ ] Dashboard analytics

## Contributing

This is a proprietary project for SVR Food Production. For internal team members:

1. Create a feature branch from `develop`
2. Follow coding standards and naming conventions
3. Write clean, documented code
4. Test your changes thoroughly
5. Create a pull request for review

## License

Proprietary - © 2024 SVR Food Production. All rights reserved.

## Support

For technical support or queries, contact:
- Email: support@svrfoodproduction.com
- Phone: [Contact Number]

---

**Built with ❤️ for SVR Food Production**
