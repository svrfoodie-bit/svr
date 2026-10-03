-- CashewFlowX: an independent customer stock-and-settlement module.
-- All tables are namespaced cashew_flow_x_* and only reference each other;
-- nothing here touches or references existing customers/sales/stock tables.
--
-- Balances are never stored: outstanding/advance are always derived from
-- SUM(stock_entries.totalAmount) - SUM(payment_entries.paymentAmount).

CREATE TABLE IF NOT EXISTS cashew_flow_x_customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customerName VARCHAR(150) NOT NULL,
  mobileNumber VARCHAR(15) NULL,
  address VARCHAR(255) NULL,
  notes TEXT NULL,
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_cfx_customers_name (customerName),
  KEY idx_cfx_customers_mobile (mobileNumber)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cashew_flow_x_cashew_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cashewTypeName VARCHAR(100) NOT NULL,
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cfx_cashew_type_name (cashewTypeName)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cashew_flow_x_stock_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customerId INT NOT NULL,
  cashewTypeId INT NOT NULL,
  quantityKg DECIMAL(12, 3) NOT NULL,
  pricePerKg DECIMAL(12, 2) NOT NULL DEFAULT 0,
  totalAmount DECIMAL(14, 2) NOT NULL DEFAULT 0,
  givenDate DATE NOT NULL,
  notes TEXT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_cfx_stock_customer_date (customerId, givenDate),
  KEY idx_cfx_stock_type (cashewTypeId),
  CONSTRAINT fk_cfx_stock_customer FOREIGN KEY (customerId)
    REFERENCES cashew_flow_x_customers (id) ON DELETE RESTRICT,
  CONSTRAINT fk_cfx_stock_cashew_type FOREIGN KEY (cashewTypeId)
    REFERENCES cashew_flow_x_cashew_types (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cashew_flow_x_payment_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customerId INT NOT NULL,
  paymentAmount DECIMAL(14, 2) NOT NULL,
  paymentDate DATE NOT NULL,
  paymentMode VARCHAR(30) NOT NULL,
  referenceNumber VARCHAR(100) NULL,
  notes TEXT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_cfx_payment_customer_date (customerId, paymentDate),
  CONSTRAINT fk_cfx_payment_customer FOREIGN KEY (customerId)
    REFERENCES cashew_flow_x_customers (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Initial cashew types. INSERT IGNORE never overwrites types edited later.
INSERT IGNORE INTO cashew_flow_x_cashew_types (cashewTypeName) VALUES
  ('JH'),
  ('Gundu'),
  ('2 Piece'),
  ('4 Piece'),
  ('8 Piece'),
  ('Chora');
