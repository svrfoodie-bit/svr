# Lead Manager

Prospect list + campaigns/templates, with lead → customer conversion.

## Depends on / Used by
- **Depends on:** business-core `customers` table — `Lead.convertToCustomer` reads/inserts customers in a transaction (`backend/src/models/Lead.model.js:159-179`).
- **Used by:** none.
- No outbound messaging: `waSent` is only a stored flag (marked via `markSent`, `backend/src/models/Lead.model.js:138`); nothing calls Twilio or Meta from leads.

## Backend
- Routes in `backend/src/routes/business.routes.js` (`/leads*`, `/lead-campaigns*`, `/lead-templates*`); `/leads/clear-all` must stay before `/leads/:id`. No express-validator — status validated manually in `backend/src/controllers/lead.controller.js:6`.
- Model `backend/src/models/Lead.model.js`: filters + 0-based `page`/`limit` pagination (`:42-73`), whitelist update (`:99`), **hard delete** (`:127`, `clearAll` `:148`), bulk create (`:217`).
- `backend/src/models/LeadCampaign.model.js` (LeadCampaign + LeadTemplate); `parseIds` handles TEXT vs JSON columns (`:6`).
- Conversion conflict errors carry `error.status`, mapped inline (`backend/src/controllers/lead.controller.js:132`).

## Data
- Tables `leads`, `lead_campaigns`, `lead_templates`: bootstrap `backend/create-tables.js:310,331`; changes in `backend/migrations/014_lead_manager_fixes.sql` (status ENUM remap; adds address, category, normalizedPhone, customerId, convertedAt).
- ⚠ `create-tables.js` leads block lacks the 014 columns — fresh `setup-db` DBs need `npm run migrate` too.
- Customer code on conversion is `CUST-<count+1>` — racy under concurrency (inferred).

## Frontend
- `frontend/src/pages/LeadManager.jsx` (single large page, `useDebounce` search, direct toasts), `frontend/src/services/leadService.js` (status styles + API calls via `apiHelpers`).
