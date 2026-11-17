# Exports, scheduler & automation

Infrastructure modules: report export (Excel/PDF + email), cron scheduler, automation jobs (reminders via Twilio).

## Depends on / Used by
- **Depends on:** business-core data (sales, payments, stock, assets, GST) read via raw SQL; settings rows for Twilio creds and schedules (`backend/src/services/notificationService.js:67`).
- **Used by:** started from `backend/src/server.js` at boot unless `ENABLE_SCHEDULER=false`.

## Exports
- Router `backend/src/routes/export.routes.js` @ `/api/v1/exports` (`backend/src/server.js:123`), every handler `authenticate`.
- `backend/src/controllers/export.controller.js` → ExportTemplate / ExportHistory / ExportSchedule models.
- `backend/src/services/export.service.js` — ExcelJS + PDFKit; `backend/src/services/email.service.js` — nodemailer SMTP (`SMTP_*` env).
- Tables created by legacy `backend/create-export-tables.js` (not a numbered migration).
- Frontend: `ExportManagement` page, `frontend/src/services/exportService.js`.

## Scheduler — `backend/src/services/scheduler.service.js`
- Every minute: due export schedules (`:29`).
- Automation: payment reminders (`:238`), stock alerts every 6 h (`:246`), depreciation (`:255`), GST compile (`:264`); schedules come from settings.
- Runs in-process: on multiple backend instances jobs would run on each (inferred risk).

## Automation & notifications
- `backend/src/services/automationJobs.service.js` → `backend/src/services/notificationService.js` (Twilio REST, `:21`, `:43`; default channel WhatsApp).
- Frontend: `AutomationCenter`, `PaymentReminders`, `PaymentReconciliation` pages.
- Not the same as CashewFlowX's Meta WhatsApp integration — see [cashew-flow-x](cashew-flow-x.md).

## Tests
- None.
