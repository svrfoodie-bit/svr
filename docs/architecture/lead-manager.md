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
- Conversion conflict errors carry `error.status`, mapped inline (`backend/src/controllers/lead.controller.js:155`).
- **Status `Converted` is set only by `convertToCustomer`.** `PUT/POST /leads` reject a manual change to Converted (400), and a lead with a `customerId` can't leave Converted (400). Re-saving an unchanged status is allowed, so older hand-marked leads still edit. Bulk import maps Converted → New. Rules: `backend/src/controllers/lead.controller.js:12-17`; tests `backend/tests/leadStatus.test.js`. UI hides Converted from pickers (`MANUAL_STATUSES` in `frontend/src/services/leadService.js`).

## Data
- Tables `leads`, `lead_campaigns`, `lead_templates`: bootstrap `backend/create-tables.js:310,337`; changes in `backend/migrations/014_lead_manager_fixes.sql` (status ENUM remap; adds address, category, normalizedPhone, customerId, convertedAt; campaign template/contactIds/sentIds).
- `create-tables.js` mirrors every 014 column, so a fresh `setup-db` DB works before `migrate`; 014 still runs cleanly on top.
- Customer code on conversion is `CUST-<count+1>` — racy under concurrency (inferred).

## Frontend
- `frontend/src/pages/LeadManager.jsx` (single large page, `useDebounce` search, direct toasts), `frontend/src/services/leadService.js` (status styles + API calls via `apiHelpers`).
