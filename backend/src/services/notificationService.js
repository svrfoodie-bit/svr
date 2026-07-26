/**
 * Notification Service — WhatsApp & SMS via Twilio REST API
 * Uses native fetch (Node 18+). No Twilio SDK needed.
 */
const logger = require('../config/logger');
const AutomationSettings = require('../models/AutomationSettings.model');
const Settings = require('../models/Settings.model');

class NotificationService {
  /**
   * Send a WhatsApp message via Twilio
   * @param {string} to   - 10-digit Indian mobile e.g. "9876543210"
   * @param {string} body - Message text
   * @param {object} cfg  - { accountSid, authToken, from }
   */
  static async sendWhatsApp(to, body, cfg) {
    const phone = to.replace(/\D/g, '');
    const formattedTo = `whatsapp:+91${phone.slice(-10)}`;
    const from = cfg.from.startsWith('whatsapp:') ? cfg.from : `whatsapp:${cfg.from}`;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${cfg.accountSid}/Messages.json`;
    const creds = Buffer.from(`${cfg.accountSid}:${cfg.authToken}`).toString('base64');

    const params = new URLSearchParams({ From: from, To: formattedTo, Body: body });
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || `Twilio error ${res.status}`);
    return json.sid;
  }

  /**
   * Send an SMS via Twilio
   */
  static async sendSMS(to, body, cfg) {
    const phone = to.replace(/\D/g, '');
    const formattedTo = `+91${phone.slice(-10)}`;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${cfg.accountSid}/Messages.json`;
    const creds = Buffer.from(`${cfg.accountSid}:${cfg.authToken}`).toString('base64');

    const params = new URLSearchParams({ From: cfg.smsFrom, To: formattedTo, Body: body });
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || `Twilio error ${res.status}`);
    return json.sid;
  }

  /**
   * High-level notify — reads settings from DB and dispatches
   * @param {string} phone   - 10-digit mobile
   * @param {string} message - text
   * @param {string} channel - 'whatsapp' | 'sms' | 'both'
   */
  static async notify(phone, message, channel = 'whatsapp') {
    const settings = await AutomationSettings.getAll();
    const cfg = {
      accountSid: settings.twilio_account_sid,
      authToken:  settings.twilio_auth_token,
      from:       settings.twilio_whatsapp_from,
      smsFrom:    settings.twilio_sms_from,
    };

    if (!cfg.accountSid || !cfg.authToken) {
      throw new Error('Twilio credentials not configured in Automation Settings');
    }

    const results = [];
    if (channel === 'whatsapp' || channel === 'both') {
      const sid = await NotificationService.sendWhatsApp(phone, message, cfg);
      results.push({ channel: 'whatsapp', sid });
      logger.info(`WhatsApp sent to ${phone}: ${sid}`);
    }
    if (channel === 'sms' || channel === 'both') {
      const sid = await NotificationService.sendSMS(phone, message, cfg);
      results.push({ channel: 'sms', sid });
      logger.info(`SMS sent to ${phone}: ${sid}`);
    }
    return results;
  }

  /**
   * Test connectivity — sends a test message to owner phone
   */
  static async sendTest(phone) {
    const companyName = await Settings.getCompanyName();
    const msg = `✅ ${companyName} — Test message from Automation System. Notifications are working! (${new Date().toLocaleString('en-IN')})`;
    return NotificationService.notify(phone, msg, 'whatsapp');
  }
}

module.exports = NotificationService;
