const { promisePool } = require('../config/database');

class AutomationSettings {
  static async createTable() {
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS automation_settings (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        settingKey   VARCHAR(100) NOT NULL UNIQUE,
        settingValue TEXT,
        updatedAt    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Insert defaults if table was just created (ignore duplicates)
    const defaults = [
      ['payment_reminder_enabled',   'false'],
      ['payment_reminder_days',      '30'],
      ['payment_reminder_channel',   'whatsapp'],
      ['payment_reminder_schedule',  '0 9 * * *'],
      ['stock_alert_enabled',        'false'],
      ['stock_alert_threshold_kg',   '100'],
      ['stock_alert_phone',          ''],
      ['stock_alert_schedule',       '0 */6 * * *'],
      ['depreciation_enabled',       'false'],
      ['depreciation_day_of_month',  '1'],
      ['gst_compile_enabled',        'false'],
      ['gst_compile_day_of_month',   '5'],
      ['twilio_account_sid',         ''],
      ['twilio_auth_token',          ''],
      ['twilio_whatsapp_from',       'whatsapp:+14155238886'],
      ['twilio_sms_from',            ''],
      ['owner_phone',                ''],
    ];

    for (const [key, val] of defaults) {
      await promisePool.query(
        'INSERT IGNORE INTO automation_settings (settingKey, settingValue) VALUES (?, ?)',
        [key, val]
      );
    }
  }

  static async getAll() {
    const [rows] = await promisePool.query('SELECT settingKey, settingValue FROM automation_settings');
    return Object.fromEntries(rows.map(r => [r.settingKey, r.settingValue]));
  }

  static async get(key) {
    const [rows] = await promisePool.query(
      'SELECT settingValue FROM automation_settings WHERE settingKey = ?', [key]
    );
    return rows[0]?.settingValue ?? null;
  }

  static async set(key, value) {
    await promisePool.query(
      'INSERT INTO automation_settings (settingKey, settingValue) VALUES (?, ?) ON DUPLICATE KEY UPDATE settingValue = ?',
      [key, value, value]
    );
  }

  static async setMany(obj) {
    for (const [key, value] of Object.entries(obj)) {
      await AutomationSettings.set(key, String(value));
    }
  }
}

module.exports = AutomationSettings;
