-- Creates grade_prices if missing, and seeds the 5 generic default grades
-- ONLY if they don't already exist (INSERT IGNORE - never overwrites or
-- deactivates existing rows). This replaces GradePriceList.createTable(),
-- which used to run on every server start and force-deactivate any grade
-- not in its hardcoded list (see migration 004 for the data fix that undoes
-- the damage that caused).
CREATE TABLE IF NOT EXISTS grade_prices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  grade VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255),
  pricePerKg DECIMAL(10,2) NOT NULL DEFAULT 0,
  minPrice DECIMAL(10,2) DEFAULT 0,
  maxPrice DECIMAL(10,2) DEFAULT 0,
  isActive TINYINT(1) DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO grade_prices (grade, description, pricePerKg, minPrice, maxPrice, isActive) VALUES
  ('Full Kaju', 'Whole kaju / full kernels', 1000, 800, 1200, 1),
  ('Split Kaju', 'Split kaju pieces', 800, 600, 950, 1),
  ('4 Pieces', 'Kaju broken into 4 pieces', 600, 450, 750, 1),
  ('8 Pieces', 'Kaju broken into 8 pieces', 420, 300, 550, 1),
  ('Chura', 'Small kaju bits / chura', 250, 150, 350, 1);
