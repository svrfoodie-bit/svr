-- Formalizes columns previously added by ad-hoc boot-time ALTERs scattered
-- across ProcessingBatch.model.js, RawPurchase.model.js, SalesOrder.model.js,
-- and FixedAsset.model.js. IF NOT EXISTS is used because these may already
-- exist on an existing database (added by the old code paths this replaces).
ALTER TABLE processing_batches
  ADD COLUMN IF NOT EXISTS wastage DECIMAL(10, 2) DEFAULT 0 AFTER quantity;

ALTER TABLE raw_purchases
  ADD COLUMN IF NOT EXISTS fundedByLoanId INT NULL,
  ADD COLUMN IF NOT EXISTS fundedByLoanCode VARCHAR(20) NULL;

ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS orderDate DATE NULL AFTER customerId,
  ADD COLUMN IF NOT EXISTS paymentType VARCHAR(30) DEFAULT 'Cash' AFTER deliveryDate,
  ADD COLUMN IF NOT EXISTS notes TEXT NULL AFTER status;

ALTER TABLE fixed_assets
  ADD COLUMN IF NOT EXISTS depreciationRate DECIMAL(5,2) DEFAULT 10.00 AFTER currentValue,
  ADD COLUMN IF NOT EXISTS lastDepreciationDate DATE NULL AFTER depreciationRate;
