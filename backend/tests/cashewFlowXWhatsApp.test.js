jest.mock('../src/config/database', () => ({ promisePool: { query: jest.fn() } }));
jest.mock('../src/config/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));

const { _internal, CASHEW_FLOW_X_WHATSAPP_TEMPLATES } = require('../src/services/cashewFlowXWhatsApp.service');
const { calculateCashewFlowXBalance } = require('../src/utils/cashewFlowXBalance');

const {
  buildStockParameters, buildPaymentParameters, buildBalanceText, toWhatsAppNumber, sendTemplateMessage, cleanParam,
} = _internal;

const settings = { phoneNumberId: '123456789012345', accessToken: 'EAAtesttoken1234567890', apiVersion: 'v21.0' };
const placeholderCount = (text) => (text.match(/\{\{\d+\}\}/g) || []).length;

describe('CashewFlowX WhatsApp templates', () => {
  test.each(['stock', 'payment'])('%s template: en and te use sequential placeholders matching the parameter list', (key) => {
    const t = CASHEW_FLOW_X_WHATSAPP_TEMPLATES[key];
    for (const lang of ['en', 'te']) {
      expect(placeholderCount(t[lang])).toBe(t.parameters.length);
      const order = [...t[lang].matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));
      expect(order).toEqual(order.map((_, i) => i + 1)); // appear in 1,2,3... order
      // Meta rejects templates that start or end with a variable.
      expect(t[lang].trim().startsWith('{{')).toBe(false);
      expect(t[lang].trim().endsWith('}}')).toBe(false);
    }
  });
});

describe('CashewFlowX WhatsApp parameters', () => {
  const customer = { customerName: 'ABC Traders', whatsappLanguage: 'en' };
  const stock = { givenDate: '2026-10-04', cashewTypeName: 'JH', quantityKg: 100, pricePerKg: 800, totalAmount: 80000 };

  test('stock parameters follow the template order', () => {
    const balance = calculateCashewFlowXBalance({ totalStockAmount: 117500, totalPaid: 50000 });
    expect(buildStockParameters({ customer, entry: stock, balance, businessName: 'SVR Food Production' })).toEqual([
      'ABC Traders', 'SVR Food Production', '04-10-2026', 'JH', '100', '800', '80,000', '₹67,500 outstanding',
    ]);
  });

  test('payment parameters follow the template order', () => {
    const balance = calculateCashewFlowXBalance({ totalStockAmount: 80000, totalPaid: 90000 });
    const entry = { paymentAmount: 30000, paymentMode: 'UPI', paymentDate: '2026-10-05' };
    expect(buildPaymentParameters({ customer, entry, balance, businessName: 'SVR' })).toEqual([
      'ABC Traders', 'SVR', '30,000', 'UPI', '05-10-2026', '₹10,000 advance (paid extra)',
    ]);
    expect(buildStockParameters({ customer, entry: stock, balance, businessName: 'SVR' })).toHaveLength(
      CASHEW_FLOW_X_WHATSAPP_TEMPLATES.stock.parameters.length
    );
  });

  test('balance text in English and Telugu for every status', () => {
    const owe = calculateCashewFlowXBalance({ totalStockAmount: 117500, totalPaid: 50000 });
    const clear = calculateCashewFlowXBalance({ totalStockAmount: 100, totalPaid: 100 });
    const adv = calculateCashewFlowXBalance({ totalStockAmount: 0, totalPaid: 5000 });
    expect(buildBalanceText(owe, 'en')).toBe('₹67,500 outstanding');
    expect(buildBalanceText(clear, 'en')).toBe('Nil, fully cleared');
    expect(buildBalanceText(owe, 'te')).toBe('₹67,500 బాకీ ఉంది');
    expect(buildBalanceText(adv, 'te')).toBe('₹5,000 అడ్వాన్స్ ఉంది');
    expect(buildBalanceText(owe, 'xx')).toBe('₹67,500 outstanding'); // unknown -> English
  });

  test('parameters are cleaned of characters Meta rejects', () => {
    expect(cleanParam('line1\nline2\tx')).toBe('line1 line2 x');
    expect(cleanParam('a      b')).toBe('a   b');
    expect(cleanParam('')).toBe('-');
  });

  test('mobile numbers get the country code', () => {
    expect(toWhatsAppNumber('9876543210')).toBe('919876543210');
    expect(toWhatsAppNumber('98765 43210', '91')).toBe('919876543210');
    expect(toWhatsAppNumber('919876543210')).toBe('919876543210');
    expect(toWhatsAppNumber('12345')).toBeNull();
    expect(toWhatsAppNumber(null)).toBeNull();
  });
});

describe('CashewFlowX WhatsApp Meta API call', () => {
  afterEach(() => { delete global.fetch; });

  test('posts a template message in the Meta Cloud API format', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ messages: [{ id: 'wamid.ABC' }] }) });
    const result = await sendTemplateMessage({
      settings, to: '919876543210', templateName: 'cfx_stock_given', languageCode: 'te', parameters: ['A', 'B'],
    });
    expect(result).toEqual({ ok: true, messageId: 'wamid.ABC' });
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('https://graph.facebook.com/v21.0/123456789012345/messages');
    expect(options.headers.Authorization).toBe('Bearer EAAtesttoken1234567890');
    expect(JSON.parse(options.body)).toEqual({
      messaging_product: 'whatsapp',
      to: '919876543210',
      type: 'template',
      template: {
        name: 'cfx_stock_given',
        language: { code: 'te' },
        components: [{ type: 'body', parameters: [{ type: 'text', text: 'A' }, { type: 'text', text: 'B' }] }],
      },
    });
  });

  test('omits components when the template has no parameters (hello_world test)', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ messages: [{ id: 'x' }] }) });
    await sendTemplateMessage({ settings, to: '91', templateName: 'hello_world', languageCode: 'en_US', parameters: [] });
    expect(JSON.parse(global.fetch.mock.calls[0][1].body).template.components).toBeUndefined();
  });

  test('returns Meta error details instead of throwing', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false, status: 400,
      json: async () => ({ error: { message: 'Template name does not exist in the translation', code: 132001, error_data: { details: 'template name (cfx_stock_given) does not exist in te' } } }),
    });
    const result = await sendTemplateMessage({ settings, to: '91', templateName: 'cfx_stock_given', languageCode: 'te', parameters: ['a'] });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('does not exist in te');
    expect(result.error).toContain('code 132001');
  });

  test('network failure and timeout are reported, not thrown', async () => {
    global.fetch = jest.fn().mockRejectedValue(Object.assign(new Error('aborted'), { name: 'TimeoutError' }));
    expect((await sendTemplateMessage({ settings, to: '91', templateName: 't', languageCode: 'en', parameters: [] })).error)
      .toBe('WhatsApp API did not respond in time');
    global.fetch = jest.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));
    expect((await sendTemplateMessage({ settings, to: '91', templateName: 't', languageCode: 'en', parameters: [] })).error)
      .toContain('Could not reach WhatsApp API');
  });
});
