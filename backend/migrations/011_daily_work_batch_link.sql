-- Links daily_work rows (Shelling/Peeling only) to the processing_batches row
-- their assignedQuantity was rolled into, so edits/deletes can reverse the
-- contribution and the UI can show/override which batch a log feeds.
ALTER TABLE daily_work
  ADD COLUMN IF NOT EXISTS batchId INT NULL AFTER workType,
  ADD INDEX IF NOT EXISTS idx_daily_work_batchId (batchId);
