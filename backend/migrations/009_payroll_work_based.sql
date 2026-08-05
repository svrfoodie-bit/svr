-- Payroll now derives Basic Salary from daily_work (quantity x rate + bonus)
-- instead of attendance-based daily/monthly wages. Add a column to record
-- the KG completed that the salary was calculated from.
ALTER TABLE payroll
  ADD COLUMN IF NOT EXISTS totalQuantity DECIMAL(10,2) DEFAULT 0 AFTER absentDays;
