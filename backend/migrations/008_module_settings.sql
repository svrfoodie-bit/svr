ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS module_settings JSON NULL;
