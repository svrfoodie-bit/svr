-- Consolidates table definitions that were previously created as a side
-- effect of importing various controller/model files (CREATE TABLE IF NOT
-- EXISTS running on every server boot, scattered across ~10 files). All
-- statements here are idempotent and safe to run against a database that
-- already has these tables.

CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workerId INT NOT NULL,
  attendanceDate DATE NOT NULL,
  status ENUM('Present','Absent','Half Day','Leave') DEFAULT 'Present',
  hoursWorked DECIMAL(4,2) DEFAULT 8.00,
  overtimeHours DECIMAL(4,2) DEFAULT 0,
  notes VARCHAR(255),
  createdBy INT DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_worker_date (workerId, attendanceDate),
  FOREIGN KEY (workerId) REFERENCES workers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payroll (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workerId INT NOT NULL,
  payrollMonth INT NOT NULL COMMENT '1-12',
  payrollYear INT NOT NULL,
  presentDays INT DEFAULT 0,
  halfDays INT DEFAULT 0,
  absentDays INT DEFAULT 0,
  overtimeHours DECIMAL(6,2) DEFAULT 0,
  basicSalary DECIMAL(10,2) DEFAULT 0,
  overtimePay DECIMAL(10,2) DEFAULT 0,
  bonus DECIMAL(10,2) DEFAULT 0,
  deductions DECIMAL(10,2) DEFAULT 0,
  advanceDeduction DECIMAL(10,2) DEFAULT 0,
  netSalary DECIMAL(10,2) DEFAULT 0,
  paymentMode ENUM('Cash','UPI','Bank Transfer') DEFAULT 'Cash',
  paymentDate DATE,
  status ENUM('Draft','Paid') DEFAULT 'Draft',
  notes VARCHAR(255),
  createdBy INT DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_worker_month (workerId, payrollMonth, payrollYear),
  FOREIGN KEY (workerId) REFERENCES workers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS seasons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  targetProcurementKg DECIMAL(12,2) DEFAULT 0,
  targetRevenueAmount DECIMAL(12,2) DEFAULT 0,
  budgetAmount DECIMAL(12,2) DEFAULT 0,
  expectedWorkers INT DEFAULT 0,
  notes TEXT,
  status ENUM('Planned','Active','Completed','Cancelled') DEFAULT 'Planned',
  createdBy INT DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loanCode VARCHAR(20) UNIQUE NOT NULL,
  loanType ENUM('Bank','Hand') NOT NULL,
  lenderName VARCHAR(100) NOT NULL,
  lenderPhone VARCHAR(15),
  principalAmount DECIMAL(12,2) NOT NULL,
  interestRate DECIMAL(5,2) NOT NULL,
  interestPaymentType ENUM('Monthly','EndOfTerm') NOT NULL DEFAULT 'Monthly',
  repaymentType ENUM('EMI','Custom') NOT NULL DEFAULT 'Custom',
  tenureMonths INT,
  startDate DATE NOT NULL,
  purpose VARCHAR(200),
  bankAccountNo VARCHAR(30),
  status ENUM('Active','Closed') NOT NULL DEFAULT 'Active',
  notes TEXT,
  createdBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loan_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loanId INT NOT NULL,
  paymentDate DATE NOT NULL,
  principalAmount DECIMAL(12,2) NOT NULL DEFAULT 0,
  interestAmount DECIMAL(12,2) NOT NULL DEFAULT 0,
  paymentMode ENUM('Cash','Bank Transfer','PhonePe','Cheque') NOT NULL DEFAULT 'Cash',
  paymentType ENUM('EMI','InterestOnly','PrincipalOnly','Prepayment','FullSettlement') NOT NULL,
  notes TEXT,
  createdBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loanId) REFERENCES loans(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS capital_investments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  capitalCode VARCHAR(20) UNIQUE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  investmentDate DATE NOT NULL,
  description VARCHAR(200) NOT NULL,
  notes TEXT,
  createdBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_work_payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  jobWorkId INT NOT NULL,
  paymentDate DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  paymentMode ENUM('Cash', 'Cheque', 'Bank Transfer', 'UPI') NOT NULL,
  reference VARCHAR(100),
  notes TEXT,
  createdBy INT DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (jobWorkId) REFERENCES job_work(id) ON DELETE CASCADE,
  KEY (paymentDate),
  KEY (jobWorkId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS raw_purchase_payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  rawPurchaseId INT NOT NULL,
  paymentDate DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  paymentMode ENUM('Cash', 'Cheque', 'Bank Transfer', 'UPI') NOT NULL,
  reference VARCHAR(100),
  notes TEXT,
  createdBy INT DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (rawPurchaseId) REFERENCES raw_purchases(id) ON DELETE CASCADE,
  KEY (paymentDate),
  KEY (rawPurchaseId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fixed_assets (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  assetCode            VARCHAR(20) UNIQUE NOT NULL,
  assetName            VARCHAR(150) NOT NULL,
  assetType            ENUM('Machinery','Land','Building','Vehicle','Furniture','Equipment','Other') NOT NULL,
  purchaseDate         DATE NOT NULL,
  purchaseCost         DECIMAL(14,2) NOT NULL,
  currentValue         DECIMAL(14,2) NOT NULL,
  depreciationRate     DECIMAL(5,2) DEFAULT 10.00 COMMENT 'Annual % e.g. 10 = 10% per year',
  lastDepreciationDate DATE NULL,
  location             VARCHAR(200),
  description          VARCHAR(300),
  status               ENUM('Active','Disposed','Under Maintenance') DEFAULT 'Active',
  notes                TEXT,
  createdBy            INT DEFAULT 1,
  createdAt            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS automation_logs (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  jobType  ENUM('payment_reminder','stock_alert','depreciation','gst_compile') NOT NULL,
  status   ENUM('success','failed','skipped') NOT NULL,
  summary  VARCHAR(500),
  details  JSON,
  runAt    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS automation_settings (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  settingKey   VARCHAR(100) NOT NULL UNIQUE,
  settingValue TEXT,
  updatedAt    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO automation_settings (settingKey, settingValue) VALUES
  ('payment_reminder_enabled',   'false'),
  ('payment_reminder_days',      '30'),
  ('payment_reminder_channel',   'whatsapp'),
  ('payment_reminder_schedule',  '0 9 * * *'),
  ('stock_alert_enabled',        'false'),
  ('stock_alert_threshold_kg',   '100'),
  ('stock_alert_phone',          ''),
  ('stock_alert_schedule',       '0 */6 * * *'),
  ('depreciation_enabled',       'false'),
  ('depreciation_day_of_month',  '1'),
  ('gst_compile_enabled',        'false'),
  ('gst_compile_day_of_month',   '5'),
  ('twilio_account_sid',         ''),
  ('twilio_auth_token',          ''),
  ('twilio_whatsapp_from',       'whatsapp:+14155238886'),
  ('twilio_sms_from',            ''),
  ('owner_phone',                '');

CREATE TABLE IF NOT EXISTS export_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  module ENUM('SALES', 'PAYMENTS', 'RAW_PURCHASE', 'JOB_WORK', 'EXPENSES', 'CUSTOMERS') NOT NULL,
  columns JSON NOT NULL,
  filters JSON,
  is_default BOOLEAN DEFAULT FALSE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_module (module),
  INDEX idx_is_default (is_default),
  INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS export_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type ENUM('EMAIL', 'SCHEDULED', 'MANUAL') NOT NULL,
  module ENUM('SALES', 'PAYMENTS', 'RAW_PURCHASE', 'JOB_WORK', 'EXPENSES', 'CUSTOMERS') NOT NULL,
  format ENUM('EXCEL', 'PDF') NOT NULL,
  recipients TEXT,
  status ENUM('SUCCESS', 'FAILED', 'IN_PROGRESS') DEFAULT 'IN_PROGRESS',
  record_count INT DEFAULT 0,
  file_size INT DEFAULT 0,
  file_path VARCHAR(500),
  error_message TEXT,
  executed_by VARCHAR(100),
  user_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_module (module),
  INDEX idx_status (status),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS export_schedules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  module ENUM('SALES', 'PAYMENTS', 'RAW_PURCHASE', 'JOB_WORK', 'EXPENSES', 'CUSTOMERS') NOT NULL,
  frequency ENUM('DAILY', 'WEEKLY', 'MONTHLY') NOT NULL,
  time TIME NOT NULL,
  format ENUM('EXCEL', 'PDF') NOT NULL,
  recipients TEXT NOT NULL,
  template_id INT,
  status ENUM('ACTIVE', 'PAUSED') DEFAULT 'ACTIVE',
  last_run TIMESTAMP NULL,
  next_run TIMESTAMP NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_next_run (next_run),
  INDEX idx_frequency (frequency),
  FOREIGN KEY (template_id) REFERENCES export_templates(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_settings (
  id INT PRIMARY KEY DEFAULT 1,
  company_info JSON,
  payment_config JSON,
  user_preferences JSON,
  notification_settings JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT single_row CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
