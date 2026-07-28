-- Formalizes columns that were previously added by an ad-hoc boot-time ALTER
-- in DailyWork.model.js (ran on every server start via worker.controller.js).
-- Uses IF NOT EXISTS as a one-time safety net because production may already
-- have these columns from that legacy code path; the schema_migrations
-- tracking table did not exist yet when they were first added there.
ALTER TABLE daily_work
  ADD COLUMN IF NOT EXISTS assignedQuantity DECIMAL(10, 2) NULL AFTER workType,
  ADD COLUMN IF NOT EXISTS status ENUM('Pending', 'In Progress', 'Completed') DEFAULT 'In Progress' AFTER bonusEligible;
