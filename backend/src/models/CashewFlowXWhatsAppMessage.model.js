const { promisePool } = require('../config/database');

// Log of CashewFlowX WhatsApp messages: every attempt is recorded (Sent / Failed / Skipped).
class CashewFlowXWhatsAppMessage {
  static async create(data) {
    const [result] = await promisePool.query(
      `INSERT INTO cashew_flow_x_whatsapp_messages
         (customerId, eventType, stockEntryId, paymentEntryId, toNumber, templateName,
          languageCode, parameters, status, providerMessageId, errorMessage)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.customerId || null,
        data.eventType,
        data.stockEntryId || null,
        data.paymentEntryId || null,
        data.toNumber || null,
        data.templateName || null,
        data.languageCode || null,
        data.parameters ? JSON.stringify(data.parameters) : null,
        data.status,
        data.providerMessageId || null,
        data.errorMessage ? String(data.errorMessage).slice(0, 500) : null,
      ]
    );
    return result.insertId;
  }

  static async getById(id) {
    const [rows] = await promisePool.query('SELECT * FROM cashew_flow_x_whatsapp_messages WHERE id = ?', [id]);
    return rows[0] ? CashewFlowXWhatsAppMessage.toDto(rows[0]) : null;
  }

  static async getByCustomer(customerId) {
    const [rows] = await promisePool.query(
      'SELECT * FROM cashew_flow_x_whatsapp_messages WHERE customerId = ? ORDER BY createdAt DESC, id DESC',
      [customerId]
    );
    return rows.map(CashewFlowXWhatsAppMessage.toDto);
  }

  // Overwrites a log row with the outcome of a resend (createdAt becomes the resend time).
  static async replace(id, data) {
    await promisePool.query(
      `UPDATE cashew_flow_x_whatsapp_messages
       SET toNumber = ?, templateName = ?, languageCode = ?, parameters = ?, status = ?,
           providerMessageId = ?, errorMessage = ?, createdAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        data.toNumber || null,
        data.templateName || null,
        data.languageCode || null,
        data.parameters ? JSON.stringify(data.parameters) : null,
        data.status,
        data.providerMessageId || null,
        data.errorMessage ? String(data.errorMessage).slice(0, 500) : null,
        id,
      ]
    );
  }

  static toDto(row) {
    let parameters = [];
    try { parameters = row.parameters ? JSON.parse(row.parameters) : []; } catch { parameters = []; }
    return { ...row, parameters };
  }
}

module.exports = CashewFlowXWhatsAppMessage;
