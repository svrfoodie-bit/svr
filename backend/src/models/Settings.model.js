const { promisePool } = require('../config/database');

const DEFAULTS = {
  company_info: {
    companyName: 'SVR Food Production',
    ownerName: 'Satyanarayana Vullikanti',
    businessType: 'Cashew Processing',
    gstNumber: '',
    panNumber: '',
    address: '',
    city: '',
    state: 'Andhra Pradesh',
    pincode: '',
    phone: '',
    email: '',
    website: '',
  },
  payment_config: {
    defaultPaymentMode: 'Cash',
    phonePeNumber: '',
    phonePeName: '',
    primaryBankName: '',
    primaryAccountNumber: '',
    primaryIfscCode: '',
    secondaryBankName: '',
    secondaryAccountNumber: '',
    secondaryIfscCode: '',
  },
  user_preferences: {
    currency: 'INR',
    dateFormat: 'DD/MM/YYYY',
    language: 'English',
    timezone: 'Asia/Kolkata',
  },
  notification_settings: {
    lowStockAlerts: true,
    paymentReminders: true,
    expiryAlerts: true,
    emailNotifications: false,
    smsNotifications: false,
  },
};

class Settings {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS app_settings (
        id INT PRIMARY KEY DEFAULT 1,
        company_info JSON,
        payment_config JSON,
        user_preferences JSON,
        notification_settings JSON,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT single_row CHECK (id = 1)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await promisePool.query(query);
  }

  static async ensureTable() {
    try { await Settings.createTable(); } catch {}
  }

  static async get() {
    await Settings.ensureTable();
    const [rows] = await promisePool.query('SELECT * FROM app_settings WHERE id = 1');
    if (rows.length === 0) {
      return { ...DEFAULTS };
    }
    const row = rows[0];
    return {
      company_info: row.company_info ? (typeof row.company_info === 'string' ? JSON.parse(row.company_info) : row.company_info) : DEFAULTS.company_info,
      payment_config: row.payment_config ? (typeof row.payment_config === 'string' ? JSON.parse(row.payment_config) : row.payment_config) : DEFAULTS.payment_config,
      user_preferences: row.user_preferences ? (typeof row.user_preferences === 'string' ? JSON.parse(row.user_preferences) : row.user_preferences) : DEFAULTS.user_preferences,
      notification_settings: row.notification_settings ? (typeof row.notification_settings === 'string' ? JSON.parse(row.notification_settings) : row.notification_settings) : DEFAULTS.notification_settings,
    };
  }

  static async getCompanyName() {
    const settings = await Settings.get();
    return settings.company_info?.companyName || DEFAULTS.company_info.companyName;
  }

  static async save(section, data) {
    await Settings.ensureTable();
    const allowed = ['company_info', 'payment_config', 'user_preferences', 'notification_settings'];
    if (!allowed.includes(section)) throw new Error(`Invalid settings section: ${section}`);

    const query = `
      INSERT INTO app_settings (id, ${section}) VALUES (1, ?)
      ON DUPLICATE KEY UPDATE ${section} = VALUES(${section})
    `;
    await promisePool.query(query, [JSON.stringify(data)]);
    return Settings.get();
  }
}

module.exports = Settings;
