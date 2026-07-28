-- Data fix: GradePriceList.createTable() ran on every server boot and force
-- deactivated any grade not in its hardcoded 5-name list. This silently
-- deactivated real industry-standard cashew grades already in use
-- (W180/W210/W240/W320/W450/Splits/Broken/Pieces). Restoring them here.
-- Safe to re-run: only touches rows that are currently inactive.
UPDATE grade_prices
SET isActive = 1
WHERE grade IN ('W180', 'W210', 'W240', 'W320', 'W450', 'Splits', 'Broken', 'Pieces')
  AND isActive = 0;
