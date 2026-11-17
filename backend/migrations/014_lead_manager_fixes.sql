-- Lead Manager fixes.
--
-- 1. leads.status: the UI uses New / Contacted / Interested / Not Interested / Converted,
--    but the column only allowed Qualified / Lost, so Interested and Not Interested
--    were silently blanked (MariaDB non-strict) or rejected with a 500 (MySQL 8 strict).
--    Widen first, remap the old values, then narrow to the UI's list.
ALTER TABLE leads MODIFY COLUMN status
  ENUM('New','Contacted','Qualified','Interested','Not Interested','Converted','Lost')
  NOT NULL DEFAULT 'New';

UPDATE leads SET status = 'Interested' WHERE status = 'Qualified';
UPDATE leads SET status = 'Not Interested' WHERE status = 'Lost';
-- Values blanked by the old bug are stored as the empty enum member.
UPDATE leads SET status = 'New' WHERE status = '' OR status IS NULL;

ALTER TABLE leads MODIFY COLUMN status
  ENUM('New','Contacted','Interested','Not Interested','Converted')
  NOT NULL DEFAULT 'New';

-- 2. Columns the models used to add at runtime; recorded here so every
--    database gets them through the migration runner.
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS address VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS normalizedPhone VARCHAR(20) DEFAULT NULL,
  -- Lead -> customer conversion link.
  ADD COLUMN IF NOT EXISTS customerId INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS convertedAt TIMESTAMP NULL DEFAULT NULL,
  ADD INDEX IF NOT EXISTS idx_leads_normalized_phone (normalizedPhone);

ALTER TABLE lead_campaigns
  ADD COLUMN IF NOT EXISTS template TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS contactIds TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sentIds TEXT DEFAULT NULL;
