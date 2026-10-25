const { promisePool } = require('../config/database');

const EDITABLE_FIELDS = [
  'enabled', 'phoneNumberId', 'apiVersion', 'countryCode', 'businessName',
  'sendOnStock', 'sendOnPayment', 'stockTemplateName', 'paymentTemplateName',
  'englishLanguageCode', 'teluguLanguageCode',
];
const BOOLEAN_FIELDS = ['enabled', 'sendOnStock', 'sendOnPayment'];

const normalise = (row) => {
  if (!row) return null;
  const out = { ...row };
  for (const f of BOOLEAN_FIELDS) out[f] = Boolean(Number(out[f]));
  return out;
};

// Single-row settings for CashewFlowX WhatsApp (Meta Cloud API).
class CashewFlowXWhatsAppSettings {
  // Includes the access token — for server-side sending only, never return to the client.
  static async get() {
    const [rows] = await promisePool.query('SELECT * FROM cashew_flow_x_whatsapp_settings WHERE id = 1');
    return normalise(rows[0]);
  }

  // Safe for the client: the token is replaced by whether it is set and its last 4 characters.
  static async getPublic() {
    const settings = await CashewFlowXWhatsAppSettings.get();
    if (!settings) return null;
    const { accessToken, ...rest } = settings;
    return {
      ...rest,
      accessTokenSet: Boolean(accessToken),
      accessTokenLast4: accessToken ? accessToken.slice(-4) : null,
    };
  }

  // `accessToken` is only changed when a non-empty value is sent, or cleared with clearAccessToken.
  static async update(data) {
    const sets = [];
    const params = [];
    for (const field of EDITABLE_FIELDS) {
      if (data[field] === undefined) continue;
      sets.push(`${field} = ?`);
      params.push(BOOLEAN_FIELDS.includes(field) ? (data[field] ? 1 : 0) : (data[field] === '' ? null : data[field]));
    }
    if (data.clearAccessToken) {
      sets.push('accessToken = NULL');
    } else if (data.accessToken) {
      sets.push('accessToken = ?');
      params.push(String(data.accessToken).trim());
    }
    if (sets.length === 0) return;
    // Upsert keeps working even if the default row was removed by hand.
    await promisePool.query('INSERT IGNORE INTO cashew_flow_x_whatsapp_settings (id) VALUES (1)');
    await promisePool.query(`UPDATE cashew_flow_x_whatsapp_settings SET ${sets.join(', ')} WHERE id = 1`, params);
  }
}

module.exports = CashewFlowXWhatsAppSettings;
