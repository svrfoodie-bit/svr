# Complete Project Structure

## Full Directory Tree

```
svr-cashew-management/
│
├── backend/                                # Backend API (Node.js + Express + MySQL)
│   ├── src/
│   │   ├── config/                        # Configuration files
│   │   │   ├── database.js               # MySQL connection pool
│   │   │   └── logger.js                 # Winston logger setup
│   │   │
│   │   ├── controllers/                   # Request handlers
│   │   │   ├── auth.controller.js
│   │   │   ├── supplier.controller.js
│   │   │   ├── worker.controller.js
│   │   │   ├── workType.controller.js
│   │   │   ├── bonusRate.controller.js
│   │   │   ├── grade.controller.js
│   │   │   ├── customer.controller.js
│   │   │   ├── rawPurchase.controller.js
│   │   │   ├── jobWork.controller.js
│   │   │   ├── dailyWork.controller.js
│   │   │   ├── production.controller.js
│   │   │   ├── rework.controller.js
│   │   │   ├── parcel.controller.js
│   │   │   ├── payment.controller.js
│   │   │   ├── expense.controller.js
│   │   │   ├── cashflow.controller.js
│   │   │   └── report.controller.js
│   │   │
│   │   ├── models/                        # Database models (SQL queries)
│   │   │   ├── user.model.js
│   │   │   ├── supplier.model.js
│   │   │   ├── worker.model.js
│   │   │   ├── workType.model.js
│   │   │   ├── bonusRate.model.js
│   │   │   ├── grade.model.js
│   │   │   ├── customer.model.js
│   │   │   ├── rawPurchase.model.js
│   │   │   ├── jobWork.model.js
│   │   │   ├── dailyWork.model.js
│   │   │   ├── production.model.js
│   │   │   ├── rework.model.js
│   │   │   ├── parcel.model.js
│   │   │   ├── payment.model.js
│   │   │   ├── expense.model.js
│   │   │   ├── cashflow.model.js
│   │   │   └── auditLog.model.js
│   │   │
│   │   ├── routes/                        # API route definitions
│   │   │   ├── auth.routes.js
│   │   │   ├── supplier.routes.js
│   │   │   ├── worker.routes.js
│   │   │   ├── workType.routes.js
│   │   │   ├── bonusRate.routes.js
│   │   │   ├── grade.routes.js
│   │   │   ├── customer.routes.js
│   │   │   ├── rawPurchase.routes.js
│   │   │   ├── jobWork.routes.js
│   │   │   ├── dailyWork.routes.js
│   │   │   ├── production.routes.js
│   │   │   ├── rework.routes.js
│   │   │   ├── parcel.routes.js
│   │   │   ├── payment.routes.js
│   │   │   ├── expense.routes.js
│   │   │   ├── cashflow.routes.js
│   │   │   └── report.routes.js
│   │   │
│   │   ├── middleware/                    # Custom middleware
│   │   │   ├── auth.js                   # JWT authentication
│   │   │   ├── errorHandler.js           # Global error handler
│   │   │   └── auditLog.js               # Audit trail logger
│   │   │
│   │   ├── services/                      # Business logic layer
│   │   │   ├── auth.service.js
│   │   │   ├── worker.service.js         # Worker wage/bonus calculations
│   │   │   ├── production.service.js     # Yield/wastage calculations
│   │   │   ├── inventory.service.js      # Stock management
│   │   │   ├── profit.service.js         # Profit calculations
│   │   │   └── report.service.js         # Report generation
│   │   │
│   │   ├── validators/                    # Input validation schemas
│   │   │   ├── auth.validator.js
│   │   │   ├── supplier.validator.js
│   │   │   ├── worker.validator.js
│   │   │   ├── rawPurchase.validator.js
│   │   │   ├── dailyWork.validator.js
│   │   │   ├── production.validator.js
│   │   │   └── parcel.validator.js
│   │   │
│   │   ├── utils/                         # Utility functions
│   │   │   ├── responseHandler.js        # Standardized API responses
│   │   │   ├── dateHelper.js             # Date formatting utilities
│   │   │   └── calculationHelper.js      # Common calculations
│   │   │
│   │   ├── database/                      # Database scripts
│   │   │   ├── migrations/               # Schema migration files
│   │   │   │   ├── 001_create_users_table.sql
│   │   │   │   ├── 002_create_suppliers_table.sql
│   │   │   │   ├── 003_create_workers_table.sql
│   │   │   │   ├── 004_create_work_types_table.sql
│   │   │   │   ├── 005_create_bonus_rates_table.sql
│   │   │   │   ├── 006_create_grades_table.sql
│   │   │   │   ├── 007_create_customers_table.sql
│   │   │   │   ├── 008_create_raw_purchases_table.sql
│   │   │   │   ├── 009_create_job_work_table.sql
│   │   │   │   ├── 010_create_daily_work_table.sql
│   │   │   │   ├── 011_create_production_table.sql
│   │   │   │   ├── 012_create_rework_table.sql
│   │   │   │   ├── 013_create_parcels_table.sql
│   │   │   │   ├── 014_create_payments_table.sql
│   │   │   │   ├── 015_create_expenses_table.sql
│   │   │   │   ├── 016_create_cashflow_table.sql
│   │   │   │   └── 017_create_audit_logs_table.sql
│   │   │   │
│   │   │   ├── seeders/                  # Seed data files
│   │   │   │   ├── users.seed.sql
│   │   │   │   ├── work_types.seed.sql
│   │   │   │   └── grades.seed.sql
│   │   │   │
│   │   │   ├── migrate.js                # Migration runner script
│   │   │   └── seed.js                   # Seed runner script
│   │   │
│   │   └── server.js                      # Application entry point
│   │
│   ├── logs/                              # Application logs
│   │   ├── combined.log
│   │   └── error.log
│   │
│   ├── .env                               # Environment variables (not in git)
│   ├── .env.example                       # Environment variables template
│   ├── .gitignore
│   ├── package.json
│   └── README.md
│
├── frontend/                              # Frontend Application (React + Vite)
│   ├── public/                           # Public static assets
│   │   └── vite.svg
│   │
│   ├── src/
│   │   ├── components/                   # Reusable UI components
│   │   │   ├── layouts/                  # Layout components
│   │   │   │   ├── MainLayout.jsx
│   │   │   │   └── AuthLayout.jsx
│   │   │   │
│   │   │   ├── navigation/               # Navigation components
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── Header.jsx
│   │   │   │
│   │   │   ├── common/                   # Common UI components
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── Table.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── Badge.jsx
│   │   │   │   ├── Loader.jsx
│   │   │   │   └── Pagination.jsx
│   │   │   │
│   │   │   ├── forms/                    # Form components
│   │   │   │   ├── SupplierForm.jsx
│   │   │   │   ├── WorkerForm.jsx
│   │   │   │   ├── RawPurchaseForm.jsx
│   │   │   │   ├── DailyWorkForm.jsx
│   │   │   │   ├── ProductionForm.jsx
│   │   │   │   └── ParcelForm.jsx
│   │   │   │
│   │   │   └── charts/                   # Chart components
│   │   │       ├── ProductionChart.jsx
│   │   │       ├── RevenueChart.jsx
│   │   │       └── StockChart.jsx
│   │   │
│   │   ├── pages/                        # Page components
│   │   │   ├── auth/                     # Authentication pages
│   │   │   │   └── Login.jsx
│   │   │   │
│   │   │   ├── Dashboard.jsx             # Main dashboard
│   │   │   │
│   │   │   ├── masters/                  # Master data pages
│   │   │   │   ├── Suppliers.jsx
│   │   │   │   ├── Workers.jsx
│   │   │   │   ├── WorkTypes.jsx
│   │   │   │   ├── BonusRates.jsx
│   │   │   │   ├── Grades.jsx
│   │   │   │   └── Customers.jsx
│   │   │   │
│   │   │   ├── operations/               # Operations pages
│   │   │   │   ├── RawPurchases.jsx
│   │   │   │   ├── JobWork.jsx
│   │   │   │   ├── DailyWork.jsx
│   │   │   │   ├── Production.jsx
│   │   │   │   ├── Rework.jsx
│   │   │   │   └── Parcels.jsx
│   │   │   │
│   │   │   ├── financial/                # Financial pages
│   │   │   │   ├── WorkerPayments.jsx
│   │   │   │   ├── CustomerPayments.jsx
│   │   │   │   ├── Expenses.jsx
│   │   │   │   └── Cashflow.jsx
│   │   │   │
│   │   │   ├── inventory/                # Inventory pages
│   │   │   │   ├── RawStock.jsx
│   │   │   │   └── WhiteStock.jsx
│   │   │   │
│   │   │   ├── reports/                  # Reports pages
│   │   │   │   ├── Reports.jsx
│   │   │   │   ├── StockReport.jsx
│   │   │   │   ├── WorkerReport.jsx
│   │   │   │   ├── SalesReport.jsx
│   │   │   │   └── ProfitReport.jsx
│   │   │   │
│   │   │   └── NotFound.jsx              # 404 page
│   │   │
│   │   ├── services/                     # API service functions
│   │   │   ├── api.js                    # Axios instance with interceptors
│   │   │   ├── authService.js
│   │   │   ├── supplierService.js
│   │   │   ├── workerService.js
│   │   │   ├── workTypeService.js
│   │   │   ├── bonusRateService.js
│   │   │   ├── gradeService.js
│   │   │   ├── customerService.js
│   │   │   ├── rawPurchaseService.js
│   │   │   ├── jobWorkService.js
│   │   │   ├── dailyWorkService.js
│   │   │   ├── productionService.js
│   │   │   ├── reworkService.js
│   │   │   ├── parcelService.js
│   │   │   ├── paymentService.js
│   │   │   ├── expenseService.js
│   │   │   ├── cashflowService.js
│   │   │   └── reportService.js
│   │   │
│   │   ├── hooks/                        # Custom React hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useSuppliers.js
│   │   │   ├── useWorkers.js
│   │   │   ├── useProduction.js
│   │   │   └── useInventory.js
│   │   │
│   │   ├── context/                      # State management (Zustand)
│   │   │   ├── authStore.js             # Authentication state
│   │   │   ├── appStore.js              # Application state
│   │   │   └── inventoryStore.js        # Inventory state
│   │   │
│   │   ├── utils/                        # Utility functions
│   │   │   ├── formatters.js            # Data formatting
│   │   │   ├── validators.js            # Form validators
│   │   │   ├── constants.js             # App constants
│   │   │   └── helpers.js               # Helper functions
│   │   │
│   │   ├── assets/                       # Static assets
│   │   │   ├── images/
│   │   │   └── fonts/
│   │   │
│   │   ├── styles/                       # Global styles
│   │   │   └── index.css                # Tailwind + custom styles
│   │   │
│   │   ├── App.jsx                       # Main App component
│   │   └── main.jsx                      # Application entry point
│   │
│   ├── index.html                        # HTML template
│   ├── vite.config.js                    # Vite configuration
│   ├── tailwind.config.js                # Tailwind CSS configuration
│   ├── postcss.config.js                 # PostCSS configuration
│   ├── .env                              # Environment variables (not in git)
│   ├── .env.example                      # Environment variables template
│   ├── .gitignore
│   ├── package.json
│   └── README.md
│
├── README.md                             # Main project README
├── PROJECT_STRUCTURE.md                  # This file
└── .gitignore                            # Root gitignore
```

## Key Files Description

### Backend

| File | Purpose |
|------|---------|
| `server.js` | Express app initialization, middleware setup, server startup |
| `config/database.js` | MySQL connection pool configuration |
| `config/logger.js` | Winston logger configuration |
| `middleware/auth.js` | JWT authentication and role-based authorization |
| `middleware/errorHandler.js` | Global error handling middleware |
| `middleware/auditLog.js` | Audit trail creation for critical operations |
| `utils/responseHandler.js` | Standardized API response formats |

### Frontend

| File | Purpose |
|------|---------|
| `main.jsx` | React app entry point, providers setup |
| `App.jsx` | Root component, route definitions |
| `services/api.js` | Axios instance with request/response interceptors |
| `context/authStore.js` | Zustand store for authentication state |
| `components/layouts/MainLayout.jsx` | Main app layout with sidebar & header |
| `components/navigation/Sidebar.jsx` | Navigation sidebar component |

## Module Organization

Each major feature follows a consistent pattern:

```
Feature (e.g., Worker Management)
│
Backend:
├── routes/worker.routes.js          → API endpoints
├── controllers/worker.controller.js → Request handling
├── models/worker.model.js          → Database queries
├── services/worker.service.js      → Business logic
└── validators/worker.validator.js  → Input validation

Frontend:
├── pages/masters/Workers.jsx       → Main page
├── components/forms/WorkerForm.jsx → Form component
├── services/workerService.js       → API calls
└── hooks/useWorkers.js            → React Query hooks
```

## Next Steps for Development

1. Create database migration files
2. Implement authentication module
3. Build master data modules
4. Develop operations modules
5. Add financial tracking
6. Create reporting system
7. Add analytics dashboard
8. Deploy and test

