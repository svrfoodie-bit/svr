-- Soft-delete migration
-- Run once against your database

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS isDeleted TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS isDeleted TINYINT(1) NOT NULL DEFAULT 0;
