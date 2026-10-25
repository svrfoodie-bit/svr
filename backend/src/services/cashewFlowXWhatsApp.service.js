/**
 * CashewFlowX WhatsApp notifications via the Meta WhatsApp Cloud API.
 *
 * Business-initiated WhatsApp messages must use templates pre-approved by
 * Meta, so the wording lives in Meta; this service only fills the numbered
 * {{n}} parameters. Parameter order must match the template texts in
 * CASHEW_FLOW_X_WHATSAPP_TEMPLATES (shown on the settings screen).
 *
 * Sending never throws to callers: every attempt is logged as Sent, Failed
 * or Skipped, and a failure must never undo the stock/payment save.
 */
const CashewFlowXCustomer = require('../models/CashewFlowXCustomer.model');
const CashewFlowXStockEntry = require('../models/CashewFlowXStockEntry.model');
const CashewFlowXPaymentEntry = require('../models/CashewFlowXPaymentEntry.model');
const CashewFlowXWhatsAppSettings = require('../models/CashewFlowXWhatsAppSettings.model');
const CashewFlowXWhatsAppMessage = require('../models/CashewFlowXWhatsAppMessage.model');
const { calculateCashewFlowXBalance } = require('../utils/cashewFlowXBalance');
const logger = require('../config/logger');

const SEND_TIMEOUT_MS = 6000; // below the frontend's 10s request timeout
// Overridable only for local testing against a fake Graph API server.
const GRAPH_API_BASE = process.env.CASHEW_FLOW_X_WHATSAPP_API_BASE || 'https://graph.facebook.com';

const EVENT = { STOCK_GIVEN: 'STOCK_GIVEN', PAYMENT_RECEIVED: 'PAYMENT_RECEIVED', TEST: 'TEST' };
const STATUS = { SENT: 'Sent', FAILED: 'Failed', SKIPPED: 'Skipped' };

// Template texts to submit to Meta (category: Utility). Kept here so the
// settings screen shows exactly what the parameter order expects.
const CASHEW_FLOW_X_WHATSAPP_TEMPLATES = {
  stock: {
    parameters: ['Customer name', 'Business name', 'Given date', 'Cashew type', 'Quantity KG', 'Price per KG', 'Total amount', 'Current balance'],
    en: 'Hello {{1}}, this is {{2}}. Stock given on {{3}}: {{4}}, {{5}} KG x ₹{{6}} = ₹{{7}}. Your current balance: {{8}}. Thank you.',
    te: 'నమస్కారం {{1}}, ఇది {{2}} నుండి. {{3}} న మీకు ఇచ్చిన సరుకు: {{4}}, {{5}} KG x ₹{{6}} = ₹{{7}}. మీ ప్రస్తుత బ్యాలెన్స్: {{8}}. ధన్యవాదాలు.',
  },
  payment: {
    parameters: ['Customer name', 'Business name', 'Payment amount', 'Payment mode', 'Payment date', 'Current balance'],
    en: 'Hello {{1}}, this is {{2}}. We have received your payment of ₹{{3}} by {{4}} on {{5}}. Your current balance: {{6}}. Thank you.',
    te: 'నమస్కారం {{1}}, ఇది {{2}} నుండి. మీ ₹{{3}} చెల్లింపు {{4}} ద్వారా {{5}} న అందింది. మీ ప్రస్తుత బ్యాలెన్స్: {{6}}. ధన్యవాదాలు.',
  },
};

const formatAmount = (value) =>
  (Number(value) || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const formatKg = (value) => (Number(value) || 0).toLocaleString('en-IN', { maximumFractionDigits: 3 });

const formatDate = (value) => {
  const [y, m, d] = String(value).slice(0, 10).split('-');
  return d && m && y ? `${d}-${m}-${y}` : String(value);
};

const BALANCE_TEXT = {
  en: {
    Outstanding: (amount) => `₹${amount} outstanding`,
    Advance: (amount) => `₹${amount} advance (paid extra)`,
    Cleared: () => 'Nil, fully cleared',
  },
  te: {
    Outstanding: (amount) => `₹${amount} బాకీ ఉంది`,
    Advance: (amount) => `₹${amount} అడ్వాన్స్ ఉంది`,
    Cleared: () => 'బాకీ లేదు, పూర్తిగా చెల్లించారు',
  },
};

const buildBalanceText = (balance, language) => {
  const texts = BALANCE_TEXT[language] || BALANCE_TEXT.en;
  const amount = balance.balanceStatus === 'Advance' ? balance.advanceAmount : balance.outstandingBalance;
  return texts[balance.balanceStatus](formatAmount(amount));
};

// Meta rejects parameters containing newlines, tabs or 4+ consecutive spaces.
const cleanParam = (value) => String(value ?? '').replace(/[\r\n\t]+/g, ' ').replace(/ {4,}/g, '   ').trim() || '-';

const buildStockParameters = ({ customer, entry, balance, businessName }) => [
  customer.customerName,
  businessName,
  formatDate(entry.givenDate),
  entry.cashewTypeName,
  formatKg(entry.quantityKg),
  formatAmount(entry.pricePerKg),
  formatAmount(entry.totalAmount),
  buildBalanceText(balance, customer.whatsappLanguage),
].map(cleanParam);

const buildPaymentParameters = ({ customer, entry, balance, businessName }) => [
  customer.customerName,
  businessName,
  formatAmount(entry.paymentAmount),
  entry.paymentMode,
  formatDate(entry.paymentDate),
  buildBalanceText(balance, customer.whatsappLanguage),
].map(cleanParam);

// 10-digit Indian mobile -> "91XXXXXXXXXX" (Meta wants digits only, with country code).
const toWhatsAppNumber = (mobileNumber, countryCode = '91') => {
  const digits = String(mobileNumber || '').replace(/\D/g, '');
  if (digits.length === 10) return `${countryCode}${digits}`;
  if (digits.length > 10) return digits; // already includes a country code
  return null;
};

const isConfigured = (settings) => Boolean(settings?.phoneNumberId && settings?.accessToken);

// Calls Meta's /messages endpoint. Resolves { ok, messageId } or { ok: false, error }.
const sendTemplateMessage = async ({ settings, to, templateName, languageCode, parameters }) => {
  const url = `${GRAPH_API_BASE}/${settings.apiVersion || 'v21.0'}/${settings.phoneNumberId}/messages`;
  const template = { name: templateName, language: { code: languageCode } };
  if (parameters?.length) {
    template.components = [{ type: 'body', parameters: parameters.map((text) => ({ type: 'text', text })) }];
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${settings.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'template', template }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.error) {
      const err = body.error || {};
      const detail = err.error_data?.details ? ` (${err.error_data.details})` : '';
      return { ok: false, error: `${err.message || `HTTP ${response.status}`}${detail}${err.code ? ` [code ${err.code}]` : ''}` };
    }
    return { ok: true, messageId: body.messages?.[0]?.id || null };
  } catch (error) {
    const timedOut = error.name === 'TimeoutError' || error.name === 'AbortError';
    return { ok: false, error: timedOut ? 'WhatsApp API did not respond in time' : `Could not reach WhatsApp API: ${error.message}` };
  }
};

const summarise = (messageId, status, error) => ({ messageLogId: messageId, status, error: error || null });

// Sends (or skips) one customer notification and records it in the log.
// With `existingLogId` (resend), the message is rebuilt from current settings and
// balance and the outcome overwrites that log row instead of adding a new one.
const notifyCustomer = async ({ eventType, customerId, stockEntryId, paymentEntryId, existingLogId = null }) => {
  const record = async (data) => {
    if (!existingLogId) return CashewFlowXWhatsAppMessage.create(data);
    await CashewFlowXWhatsAppMessage.replace(existingLogId, data);
    return existingLogId;
  };
  try {
    const settings = await CashewFlowXWhatsAppSettings.get();
    const isStock = eventType === EVENT.STOCK_GIVEN;

    // Not switched on at all: do nothing and don't clutter the log.
    if (!settings?.enabled) return summarise(null, STATUS.SKIPPED, 'WhatsApp is turned off in CashewFlowX settings');
    if (isStock ? !settings.sendOnStock : !settings.sendOnPayment) {
      return summarise(null, STATUS.SKIPPED, `${isStock ? 'Stock' : 'Payment'} messages are turned off`);
    }

    const customer = await CashewFlowXCustomer.getById(customerId);
    const entry = isStock
      ? await CashewFlowXStockEntry.getById(stockEntryId)
      : await CashewFlowXPaymentEntry.getById(paymentEntryId);
    if (!customer || !entry) return summarise(existingLogId, STATUS.SKIPPED, 'The customer or entry no longer exists');

    const language = customer.whatsappLanguage === 'te' ? 'te' : 'en';
    const templateName = isStock ? settings.stockTemplateName : settings.paymentTemplateName;
    const languageCode = language === 'te' ? settings.teluguLanguageCode : settings.englishLanguageCode;
    const to = toWhatsAppNumber(customer.mobileNumber, settings.countryCode);
    const base = { customerId, eventType, stockEntryId, paymentEntryId, toNumber: to, templateName, languageCode };

    const skip = async (reason) => summarise(
      await record({ ...base, status: STATUS.SKIPPED, errorMessage: reason }),
      STATUS.SKIPPED, reason
    );
    if (!Number(customer.whatsappEnabled)) return skip('Customer has WhatsApp updates turned off');
    if (!to) return skip('Customer has no valid mobile number');
    if (!isConfigured(settings)) return skip('WhatsApp Phone Number ID or Access Token is not set');

    const balance = calculateCashewFlowXBalance(await CashewFlowXCustomer.getTotals(customerId));
    const businessName = settings.businessName || 'SVR Food Production';
    const parameters = isStock
      ? buildStockParameters({ customer: { ...customer, whatsappLanguage: language }, entry, balance, businessName })
      : buildPaymentParameters({ customer: { ...customer, whatsappLanguage: language }, entry, balance, businessName });

    const result = await sendTemplateMessage({ settings, to, templateName, languageCode, parameters });
    const status = result.ok ? STATUS.SENT : STATUS.FAILED;
    const logId = await record({
      ...base, parameters, status, providerMessageId: result.messageId, errorMessage: result.error,
    });
    if (!result.ok) logger.warn(`CashewFlowX WhatsApp ${eventType} to customer ${customerId} failed: ${result.error}`);
    return summarise(logId, status, result.error);
  } catch (error) {
    logger.error(`CashewFlowX WhatsApp ${eventType} error: ${error.message}`);
    return summarise(existingLogId, STATUS.FAILED, error.message);
  }
};

const notifyStockGiven = (entry) =>
  notifyCustomer({ eventType: EVENT.STOCK_GIVEN, customerId: entry.customerId, stockEntryId: entry.id });

const notifyPaymentReceived = (entry) =>
  notifyCustomer({ eventType: EVENT.PAYMENT_RECEIVED, customerId: entry.customerId, paymentEntryId: entry.id });

// Re-sends a logged message for the same stock/payment entry. It is rebuilt with the
// current settings (so a corrected template name or token takes effect) and the
// customer's current balance, and the existing log row is updated with the outcome.
const resendMessage = async (messageId) => {
  const message = await CashewFlowXWhatsAppMessage.getById(messageId);
  if (!message) return { notFound: true };
  const result = await notifyCustomer({
    eventType: message.eventType,
    customerId: message.customerId,
    stockEntryId: message.stockEntryId,
    paymentEntryId: message.paymentEntryId,
    existingLogId: message.id,
  });
  return { result };
};

// Sends Meta's built-in "hello_world" template (available on every new account)
// to check the Phone Number ID and token without needing approved CashewFlowX templates.
const sendTestMessage = async (mobileNumber) => {
  const settings = await CashewFlowXWhatsAppSettings.get();
  if (!isConfigured(settings)) return { ok: false, error: 'Save the Phone Number ID and Access Token first' };
  const to = toWhatsAppNumber(mobileNumber, settings.countryCode);
  if (!to) return { ok: false, error: 'Enter a valid 10-digit mobile number' };
  return sendTemplateMessage({ settings, to, templateName: 'hello_world', languageCode: 'en_US', parameters: [] });
};

module.exports = {
  CASHEW_FLOW_X_WHATSAPP_TEMPLATES,
  notifyStockGiven,
  notifyPaymentReceived,
  resendMessage,
  sendTestMessage,
  // Exported for unit tests.
  _internal: { buildStockParameters, buildPaymentParameters, buildBalanceText, toWhatsAppNumber, sendTemplateMessage, cleanParam },
};
