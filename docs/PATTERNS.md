# SVR Cashew Management — code patterns & conventions

> Learned from the code by `/ml-specs:repo-init` (2026-11-17). New code must match this. The code is
> the source of truth — if a line here drifts, fix this file. `(inferred)` = seen once or guessed;
> re-check against the code before relying on it.

## Stack snapshot
- **Backend** (`backend/`): Node (no version pin) + Express 4, CommonJS, plain JavaScript. `backend/package.json:6-15`
- **Frontend** (`frontend/`): React 18 + Vite 5 + Tailwind 3, react-router-dom v6, Zustand, axios. `frontend/package.json:33-38`
- **Database:** MySQL via `mysql2` raw SQL, **no ORM**. Prod = MySQL 8 (Aiven), local = MariaDB. `backend/src/config/database.js:21`
- **Tests:** Jest + supertest (backend only, 2 files). Frontend: ESLint only, no tests, no typecheck.
- Not a monorepo — two independent npm packages, no root `package.json`.

## Directory layout
```
backend/src/
  server.js        # app bootstrap, middleware chain, route mounts
  config/          # database.js (mysql2 pool), logger.js (winston)
  routes/          # business.routes.js (most modules), cashewFlowX.routes.js, export.routes.js
  controllers/     # <name>.controller.js — class, exported as singleton instance
  models/          # <Name>.model.js — static-method class over promisePool (raw SQL)
  middleware/      # auth, validate, errorHandler, auditMiddleware
  services/        # scheduler (node-cron), email, export, notification (Twilio), WhatsApp (Meta)
  utils/           # responseHandler, schemaHelpers (portable DDL), seeder
backend/migrations/NNN_*.sql   # numbered migrations, applied by backend/scripts/migrate.js
backend/tests/                 # Jest
frontend/src/
  App.jsx          # router; pages/  components/  context/ (zustand)  services/  hooks/  utils/
```

## Naming conventions
- **Backend files:** `lead.controller.js`, `Lead.model.js` (PascalCase models), `business.routes.js`, `export.service.js`.
- **Frontend:** PascalCase `.jsx` pages/components (`frontend/src/pages/LeadManager.jsx`); camelCase `<domain>Service.js` (`frontend/src/services/leadService.js`); hooks `useX.js` (`frontend/src/hooks/useDebounce.js:4`).
- **DB tables:** snake_case plural (`lead_campaigns`, `cashew_flow_x_*`). **Columns: camelCase** (`createdAt`, `isDeleted`, `normalizedPhone`) — `backend/create-tables.js:310`. Don't introduce snake_case columns.
- **JSON fields:** camelCase, matching the columns.
- **Controllers:** class, `module.exports = new XController()` — `backend/src/controllers/lead.controller.js:218`.

## How a feature is structured (Supplier = cleanest reference)
- Mount: `/api/v1` → `business.routes.js` — `backend/src/server.js:120` (CashewFlowX: `backend/src/server.js:117`, exports: `backend/src/server.js:123`)
- Route: `authenticate, <xValidators>, validate, Controller.method` — `backend/src/routes/business.routes.js:119`; validators declared just above (`backend/src/routes/business.routes.js:112`)
- Audited writes add `autoAudit('<table>')` — `backend/src/routes/business.routes.js:91`
- Controller: `try { … res.json({ success, data }) } catch (e) { next(e) }` — `backend/src/controllers/lead.controller.js:47`
- Model: static async methods, `promisePool.query(sql, params)` — `backend/src/models/Supplier.model.js:34`
- Frontend: page → `<domain>Service` object → `apiHelpers.get/post/put/del` → axios `api` — `frontend/src/services/apiHelpers.js:57`
- Static paths before `/:id` (e.g. `/leads/clear-all`) — order matters in `business.routes.js`.

## Data access & migrations
- One pool: `promisePool` from `backend/src/config/database.js:21`. Always `?` placeholders; build `IN (…)` from `?` marks — `backend/src/models/Lead.model.js:134`.
- Transactions: `getConnection` → `beginTransaction` → `commit`/`rollback` → `finally release`; lock with `SELECT … FOR UPDATE` — `backend/src/models/Lead.model.js:164-166`.
- Dynamic UPDATE: whitelist `allowed = [...]` fields — `backend/src/models/Lead.model.js:99`.
- **Soft delete** for master data: `isDeleted` flag, filter `COALESCE(isDeleted, 0) = 0`, delete = `UPDATE … SET isDeleted = 1`, restore exists — `backend/src/models/Supplier.model.js:34,82,90`. (Leads hard-delete — `backend/src/models/Lead.model.js:127` — the exception, not the rule.)
- Pagination is rare; leads use `limit` + 0-based `page` → `LIMIT ? OFFSET ?` — `backend/src/models/Lead.model.js:73` (inferred 0-based).
- No tenancy: no `businessId`; ownership is `createdBy = req.user?.id`.
- JSON columns must parse both TEXT (MariaDB) and JSON (MySQL 8) — `backend/src/models/LeadCampaign.model.js:6`.
- **Schema changes:** add the next `backend/migrations/NNN_<slug>.sql` and run `npm run migrate` (`backend/scripts/migrate.js`, tracks `schema_migrations`). The runner passes SQL through `runPortableSql` (`backend/src/utils/schemaHelpers.js:93`), which makes `ADD COLUMN/INDEX IF NOT EXISTS` work on MySQL 8 — **never run migration SQL raw** against prod.
- New tables: `CREATE TABLE IF NOT EXISTS … ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, named FKs — `backend/migrations/012_cashew_flow_x.sql:1`.
- ENUM changes: remap rows with `UPDATE` before `MODIFY COLUMN` (MySQL 8 strict mode errors where MariaDB silently blanks) — `backend/migrations/014_lead_manager_fixes.sql:8`.
- `backend/create-tables.js` is the fresh-DB bootstrap (`npm run setup-db`) and is **not** linked to migrations. If you change a table it defines (users, leads, lead_campaigns…), mirror the change there too (inferred convention; currently drifts for `leads` — see CLAUDE.md).

## API / interface contracts
- Success `200 { success: true, data }`; create `201 { success: true, message, data }` — `backend/src/controllers/lead.controller.js:47`.
- Not found `404 { success: false, message: '<X> not found' }` — `backend/src/controllers/lead.controller.js:34`.
- Validation `400 { success: false, message, errors: [...] }` from `backend/src/middleware/validate.js`.
- `backend/src/utils/responseHandler.js:3` has `success/created/…` helpers but most controllers inline `res.status().json()` — either is accepted; match the file you're in.
- Frontend axios interceptor unwraps `response.data.data` — `frontend/src/services/api.js:40` — and `apiHelpers.unwrapResponse` unwraps again (`frontend/src/services/apiHelpers.js:50`). Don't return a payload whose own top-level key is `data`.

## Error handling
- Controllers `next(error)`; central `errorHandler` maps `ValidationError`→400, `ER_DUP_ENTRY`→409, `ER_NO_REFERENCED_ROW_2`→400, else `err.statusCode || 500` — `backend/src/middleware/errorHandler.js:4-54`; mounted `backend/src/server.js:126-127`.
- Prefer setting `err.statusCode` and calling `next(err)` over inline mapping (leads map `error.status` inline — `backend/src/controllers/lead.controller.js:132`; don't spread that).
- Frontend: interceptor toasts by status and sets `error.__toastHandled` — `frontend/src/services/api.js:70`; 401 logs out. Pages should not toast again for handled errors.

## Validation, config & secrets
- express-validator arrays in the route file + `validate` middleware — `backend/src/routes/business.routes.js:112-119`; cross-field custom validator `backend/src/routes/business.routes.js:35`. (Leads validate manually in the controller — `backend/src/controllers/lead.controller.js:6`; prefer the route style for new code.)
- Env via dotenv; names in `backend/.env.example` and `frontend/.env.example` (`VITE_API_BASE_URL`). Never commit `.env`.
- Auth: `authenticate` verifies Bearer JWT and sets `req.user = { id, username, role }` — `backend/src/middleware/auth.js:16-17`. `authorize(...roles)` exists (`backend/src/middleware/auth.js:29`) but is **not applied anywhere** — role checks are absent; ask before relying on roles.

## Logging & observability
- winston (`backend/src/config/logger.js`) with morgan piped in (`backend/src/server.js:60`). Use `logger`, not `console.log`, in new backend code (many existing files still use `console.*`).

## Frontend patterns
- Data fetching: `useEffect` + `useState` calling the service. react-query and react-hook-form are installed but unused — don't introduce them piecemeal without agreement.
- Search inputs: `useDebounce` (300 ms) — `frontend/src/hooks/useDebounce.js:4`.
- Toasts: `react-hot-toast` called directly in pages. Styling: Tailwind utility classes inline; icons `lucide-react`.
- Global state: Zustand stores with `persist` in `frontend/src/context/` (auth, company, moduleSettings, theme).

## Testing patterns
- Jest unit tests in `backend/tests/*.test.js`, mocking the DB pool: `jest.mock('../src/config/database', …)` — `backend/tests/cashewFlowX.test.js:7`; mock logger too — `backend/tests/cashewFlowXWhatsApp.test.js:2`.
- No integration/E2E harness exists (supertest is installed, unused). New user-facing criteria: add supertest tests against the Express app with mocked `promisePool` (inferred — no precedent yet).
- Commands: `cd backend && npm test` (jest --coverage); `cd frontend && npm run lint`; `cd frontend && npm run build` as the frontend smoke check.

## Don'ts
- No string-concatenated user values in SQL; no ORM additions.
- No raw execution of `backend/migrations/*.sql` against MySQL 8; no ad-hoc `run-*-migration.js` scripts (legacy) — use a numbered migration.
- No snake_case columns; no new response envelope shapes.
- Don't edit the stray root-level `apiHelpers.js` / `customerService.js` / `supplierService.js` — they're dead copies; the real ones live in `frontend/src/services/`.
- Don't conflate the two WhatsApp integrations (Meta Cloud API for CashewFlowX vs Twilio for automation).
