const CashewFlowXWhatsAppSettings = require('../models/CashewFlowXWhatsAppSettings.model');
const {
  CASHEW_FLOW_X_WHATSAPP_TEMPLATES,
  resendMessage,
  sendTestMessage,
} = require('../services/cashewFlowXWhatsApp.service');

// CashewFlowX WhatsApp settings, test send and resend.
class CashewFlowXWhatsAppController {
  async getSettings(req, res, next) {
    try {
      const settings = await CashewFlowXWhatsAppSettings.getPublic();
      res.json({ success: true, data: { settings, templates: CASHEW_FLOW_X_WHATSAPP_TEMPLATES } });
    } catch (error) {
      next(error);
    }
  }

  async saveSettings(req, res, next) {
    try {
      await CashewFlowXWhatsAppSettings.update(req.body);
      const settings = await CashewFlowXWhatsAppSettings.getPublic();
      res.json({ success: true, message: 'WhatsApp settings saved', data: { settings, templates: CASHEW_FLOW_X_WHATSAPP_TEMPLATES } });
    } catch (error) {
      next(error);
    }
  }

  async sendTest(req, res, next) {
    try {
      const result = await sendTestMessage(req.body.mobileNumber);
      if (!result.ok) return res.status(400).json({ success: false, message: `Test message failed: ${result.error}` });
      res.json({ success: true, message: 'Test message sent. Check WhatsApp on that phone.', data: { messageId: result.messageId } });
    } catch (error) {
      next(error);
    }
  }

  async resend(req, res, next) {
    try {
      const { notFound, result } = await resendMessage(req.params.id);
      if (notFound) return res.status(404).json({ success: false, message: 'WhatsApp message not found' });
      res.json({ success: true, message: result.status === 'Sent' ? 'WhatsApp message sent' : 'WhatsApp message not sent', data: result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CashewFlowXWhatsAppController();
