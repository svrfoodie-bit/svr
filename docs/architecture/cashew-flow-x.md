# CashewFlowX

Self-contained stock-flow module with Meta WhatsApp notifications. Own router, own tables, own tests.

## Depends on / Used by
- **Depends on:** `middleware/auth` (`authenticate`), `middleware/validate`, `config/database`, `config/logger` only.
- **Used by:** nothing else in the backend. SQL touches only `cashew_flow_x_*` tables.

## Backend
- Router: `backend/src/routes/cashewFlowX.routes.js`, mounted `/api/v1/cashew-flow-x` (`backend/src/server.js:117`); `router.use(authenticate)` for all routes; express-validator with a reusable `optionalText` helper.
- Controllers: `backend/src/controllers/cashewFlowX.controller.js`, `backend/src/controllers/cashewFlowXWhatsApp.controller.js`.
- Models: `backend/src/models/CashewFlowX*.model.js` (6 files, incl. WhatsApp settings).
- Balance logic: `backend/src/utils/cashewFlowXBalance.js` — balances are **derived, not stored**.
- WhatsApp: `backend/src/services/cashewFlowXWhatsApp.service.js` — Meta Graph API base (`:22`, override `CASHEW_FLOW_X_WHATSAPP_API_BASE`), `fetch` POST (`:113`); access token lives in the settings row, not env.

## Data
- `backend/migrations/012_cashew_flow_x.sql` (tables, InnoDB/utf8mb4, named FKs `ON DELETE RESTRICT`), `backend/migrations/013_cashew_flow_x_whatsapp.sql`.

## Frontend
- Pages `frontend/src/pages/cashewFlowX/` (6), components `frontend/src/components/cashewFlowX/` (13), service `frontend/src/services/cashewFlowXService.js` (uses `apiHelpers`).
- Setup guide for WhatsApp: `docs/CashewFlowX-WhatsApp-Setup-Guide.html`.

## Tests
- `backend/tests/cashewFlowX.test.js` (balance/totals/activity), `backend/tests/cashewFlowXWhatsApp.test.js` (templates + Meta call). The only tests in the repo — follow their mocking shape.
