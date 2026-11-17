# Business core

All non-CashewFlowX, non-export modules share ONE router: `backend/src/routes/business.routes.js`
(~375 lines, mounted at `/api/v1` — `backend/src/server.js:120`). Document changes per section of that file.

## Depends on / Used by
- **Used by:** lead-manager (writes `customers`), exports-automation (reads sales/payments/settings for reminders & reports).
- **Depends on:** nothing outside itself except `config/database`, `middleware/*`, `config/logger`.

## Sub-domains
| Domain | Routes (business.routes.js) | Controller → Model | Frontend |
|--------|-----------------------------|--------------------|----------|
| Auth / users | `/auth/*` | auth.controller → User.model (JWT sign `backend/src/models/User.model.js:60`) | `pages/auth/Login`, `authService` |
| Customers | `/customers*` (`:73-79`) | customer.controller → Customer.model (soft delete) | CustomerList/Entry/Ledger |
| Raw purchase & suppliers | `/raw-purchases*` (`:91-93`), `/suppliers*` (`:117-123`) | rawPurchase(+Payment).controller, inventory.controller → RawPurchase, Supplier | RawPurchaseList/Entry, SupplierSummary |
| Workers / attendance / payroll | `/workers*`, `/daily-work*`, `/attendance*`, payroll | worker, attendance, payroll controllers | WorkerList, DailyWork*, PayrollDashboard |
| Production | `/job-work*` (`:156-158`), batches, yield, finished goods | jobWork, batch, jobWorkPayment, inventory | JobWork*, Batch*, YieldEntry, FinishedGoodsStock |
| Sales, payments, expenses | sales orders/payments, expenses | sales.controller → SalesOrder (JOINs customers), SalesPayment, Expense | SalesOrder*, OutstandingReport, ExpenseList |
| Accounting | loans, fixed assets, seasons, grades, GST, ledger, balance sheet | per-entity controllers | Loan*, FixedAssets, BalanceSheet, GSTReports |
| Settings / backup / audit / search / dashboard | `/settings*`, `/backup/sql`, `/audit*`, `/search`, dashboard | settings, backup, auditLog, search, dashboard | Settings, BackupManagement, AuditLog, EnhancedDashboard |

## Conventions specific here
- Validators are declared as arrays right above their routes (`customerValidators` `:67`, `supplierValidators` `:112`); `paymentAmountValidator` (`:35`) is a cross-field example.
- Audited tables use `autoAudit('<table>')` (`:91`).
- Many models JOIN across sub-domains in raw SQL (Sales→customers, Payroll→workers, RawPurchase→suppliers) — renaming a column ripples; grep `backend/src/models` and `backend/src/controllers` (balanceSheet, gst, ledger, search) for the column.

## Data
- Bootstrap tables in `backend/create-tables.js`; later additions in `backend/migrations/005_baseline_tables.sql` onward.
- Soft delete on customers/suppliers (`backend/src/models/Supplier.model.js:34`).
- Demo users (owner/supervisor/accountant) seeded at every boot — `backend/src/utils/seeder.js:9`, `backend/src/server.js:141`.

## Known gaps
- `authorize()` imported (`backend/src/routes/business.routes.js:19`) but never applied → every authenticated user has full access.
- No tests for any business-core module.
