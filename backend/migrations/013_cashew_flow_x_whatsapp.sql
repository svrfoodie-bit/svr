-- CashewFlowX WhatsApp notifications (Meta WhatsApp Cloud API).
-- Independent of the app's existing Twilio/automation notification settings.

-- Per-customer preferences. whatsappEnabled records that the customer agreed
-- to receive WhatsApp updates (Meta requires opt-in for business messages).
ALTER TABLE cashew_flow_x_customers
  ADD COLUMN IF NOT EXISTS whatsappLanguage VARCHAR(5) NOT NULL DEFAULT 'en' AFTER status,
  ADD COLUMN IF NOT EXISTS whatsappEnabled TINYINT(1) NOT NULL DEFAULT 1 AFTER whatsappLanguage;

-- Single-row settings (id is always 1).
CREATE TABLE IF NOT EXISTS cashew_flow_x_whatsapp_settings (
  id INT PRIMARY KEY,
  enabled TINYINT(1) NOT NULL DEFAULT 0,
  phoneNumberId VARCHAR(50) NULL,
  accessToken TEXT NULL,
  apiVersion VARCHAR(10) NOT NULL DEFAULT 'v21.0',
  countryCode VARCHAR(4) NOT NULL DEFAULT '91',
  businessName VARCHAR(100) NULL,
  sendOnStock TINYINT(1) NOT NULL DEFAULT 1,
  sendOnPayment TINYINT(1) NOT NULL DEFAULT 1,
  stockTemplateName VARCHAR(100) NOT NULL DEFAULT 'cfx_stock_given',
  paymentTemplateName VARCHAR(100) NOT NULL DEFAULT 'cfx_payment_received',
  englishLanguageCode VARCHAR(10) NOT NULL DEFAULT 'en',
  teluguLanguageCode VARCHAR(10) NOT NULL DEFAULT 'te',
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO cashew_flow_x_whatsapp_settings (id) VALUES (1);

-- Log of every attempted message (sent, failed or skipped), for history and resend.
CREATE TABLE IF NOT EXISTS cashew_flow_x_whatsapp_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customerId INT NULL,
  eventType VARCHAR(30) NOT NULL,
  stockEntryId INT NULL,
  paymentEntryId INT NULL,
  toNumber VARCHAR(20) NULL,
  templateName VARCHAR(100) NULL,
  languageCode VARCHAR(10) NULL,
  parameters TEXT NULL,
  status VARCHAR(10) NOT NULL,
  providerMessageId VARCHAR(100) NULL,
  errorMessage VARCHAR(500) NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_cfx_wa_customer (customerId, createdAt),
  CONSTRAINT fk_cfx_wa_customer FOREIGN KEY (customerId)
    REFERENCES cashew_flow_x_customers (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
