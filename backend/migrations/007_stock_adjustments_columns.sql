-- Formalizes columns previously added by FinishedGoodsStock.migrate(),
-- which ran as a side effect of importing inventory.controller.js.
ALTER TABLE stock_adjustments
  ADD COLUMN IF NOT EXISTS dateAdded DATE NULL AFTER quantity,
  ADD COLUMN IF NOT EXISTS approvedBy VARCHAR(100) NULL AFTER reason;
