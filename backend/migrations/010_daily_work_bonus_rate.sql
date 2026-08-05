-- The "Bonus per KG" entered when a work log is created had no column to
-- persist to, so it was silently discarded (bonusAmount = 0 x rate = 0,
-- since completed quantity is always 0 at creation time). Store the rate
-- itself so it survives until the collected weight is recorded.
ALTER TABLE daily_work
  ADD COLUMN IF NOT EXISTS bonusRate DECIMAL(10,2) DEFAULT 0 AFTER rate;
