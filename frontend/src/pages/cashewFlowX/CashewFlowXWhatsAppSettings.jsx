import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Copy, Send, Save, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { cashewFlowXWhatsAppService } from '../../services/cashewFlowXService';
import { notifyCashewFlowXError } from '../../components/cashewFlowX/cashewFlowXFormat';

const toForm = (s) => ({
  enabled: Boolean(s.enabled),
  phoneNumberId: s.phoneNumberId || '',
  accessToken: '', // write-only: never filled from the server
  apiVersion: s.apiVersion || 'v21.0',
  countryCode: s.countryCode || '91',
  businessName: s.businessName || '',
  sendOnStock: Boolean(s.sendOnStock),
  sendOnPayment: Boolean(s.sendOnPayment),
  stockTemplateName: s.stockTemplateName || 'cfx_stock_given',
  paymentTemplateName: s.paymentTemplateName || 'cfx_payment_received',
  englishLanguageCode: s.englishLanguageCode || 'en',
  teluguLanguageCode: s.teluguLanguageCode || 'te',
});

const validate = (form, tokenSet) => {
  const errors = {};
  if (form.phoneNumberId && !/^[0-9]{5,30}$/.test(form.phoneNumberId)) errors.phoneNumberId = 'Phone Number ID must contain digits only';
  if (form.accessToken && form.accessToken.trim().length < 20) errors.accessToken = 'Access token looks too short';
  if (form.enabled && !form.phoneNumberId) errors.phoneNumberId = 'Required to turn WhatsApp on';
  if (form.enabled && !form.accessToken && !tokenSet) errors.accessToken = 'Required to turn WhatsApp on';
  for (const f of ['stockTemplateName', 'paymentTemplateName']) {
    if (!/^[a-z0-9_]{1,100}$/.test(form[f])) errors[f] = 'Lowercase letters, numbers and _ only';
  }
  for (const f of ['englishLanguageCode', 'teluguLanguageCode']) {
    if (!/^[a-z]{2}(_[A-Z]{2})?$/.test(form[f])) errors[f] = 'Like en, en_US or te';
  }
  if (!/^v[0-9]{1,2}\.[0-9]$/.test(form.apiVersion)) errors.apiVersion = 'Like v21.0';
  if (!/^[0-9]{1,4}$/.test(form.countryCode)) errors.countryCode = 'Digits only, e.g. 91';
  return errors;
};

const Toggle = ({ checked, onChange, label, hint, disabled }) => (
  <label className={`flex items-start justify-between gap-4 py-2 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
    <span>
      <span className="block text-sm font-medium text-gray-800">{label}</span>
      {hint && <span className="block text-xs text-gray-500">{hint}</span>}
    </span>
    <input type="checkbox" className="mt-1 w-5 h-5 accent-green-600 flex-shrink-0" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
  </label>
);

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied');
  } catch {
    toast.error('Could not copy — select the text and copy it manually');
  }
};

const TemplateCard = ({ title, name, template }) => (
  <div className="rounded-xl border border-gray-200 p-3 space-y-2">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="font-medium text-gray-900">{title}</div>
      <button type="button" onClick={() => copyText(name)} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50">
        <Copy size={12} /> Name: <code>{name}</code>
      </button>
    </div>
    <p className="text-xs text-gray-500">Category: <b>Utility</b> · Variables, in order: {template.parameters.map((p, i) => `{{${i + 1}}} ${p}`).join(', ')}</p>
    {[['en', 'English'], ['te', 'Telugu']].map(([lang, label]) => (
      <div key={lang} className="bg-gray-50 rounded-lg p-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-600">{label} body</span>
          <button type="button" onClick={() => copyText(template[lang])} className="inline-flex items-center gap-1 text-xs text-green-700 hover:underline">
            <Copy size={12} /> Copy
          </button>
        </div>
        <p className="text-sm text-gray-800 break-words">{template[lang]}</p>
      </div>
    ))}
  </div>
);

const CashewFlowXWhatsAppSettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [templates, setTemplates] = useState(null);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testNumber, setTestNumber] = useState('');
  const [testing, setTesting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const apply = (data) => {
    setSettings(data.settings);
    setTemplates(data.templates);
    setForm(toForm(data.settings));
  };

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await cashewFlowXWhatsAppService.getSettings();
      apply(data);
      setShowGuide(!data.settings?.accessTokenSet);
    } catch (error) {
      setLoadError(true);
      notifyCashewFlowXError(error, 'Failed to load WhatsApp settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setField = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const found = validate(form, settings?.accessTokenSet);
    setErrors(found);
    if (Object.keys(found).length) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, phoneNumberId: form.phoneNumberId.trim(), businessName: form.businessName.trim() };
      if (!payload.accessToken) delete payload.accessToken; // keep the stored token
      apply(await cashewFlowXWhatsAppService.saveSettings(payload));
      toast.success('WhatsApp settings saved');
    } catch (error) {
      notifyCashewFlowXError(error, 'Failed to save WhatsApp settings');
    } finally {
      setSaving(false);
    }
  };

  const clearToken = async () => {
    if (!window.confirm('Remove the saved access token? WhatsApp messages will stop until a new token is saved.')) return;
    try {
      apply(await cashewFlowXWhatsAppService.saveSettings({ clearAccessToken: true, enabled: false }));
      toast.success('Access token removed and WhatsApp turned off');
    } catch (error) {
      notifyCashewFlowXError(error, 'Failed to remove token');
    }
  };

  const handleTest = async () => {
    if (!/^[0-9]{10}$/.test(testNumber)) {
      toast.error('Enter a 10-digit mobile number');
      return;
    }
    setTesting(true);
    try {
      await cashewFlowXWhatsAppService.sendTest(testNumber);
      toast.success('Test message sent. Check WhatsApp on that phone.');
    } catch (error) {
      notifyCashewFlowXError(error, 'Test message failed');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px] gap-2 text-gray-600">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        Loading WhatsApp settings...
      </div>
    );
  }

  if (loadError || !form) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 font-medium">Could not load WhatsApp settings.</p>
        <button onClick={load} className="mt-3 px-4 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50">Retry</button>
      </div>
    );
  }

  const fieldError = (f) => errors[f] && <p className="text-xs text-red-600 mt-1">{errors[f]}</p>;
  const inputClass = (f) => `input-field ${errors[f] ? 'input-error' : ''}`;
  const configured = Boolean(settings?.phoneNumberId && settings?.accessTokenSet);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl">
      <div className="flex items-start gap-3">
        <button onClick={() => navigate('/cashew-flow-x')} className="p-2 rounded-xl hover:bg-gray-100 mt-1" title="Back to CashewFlowX">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">CashewFlowX WhatsApp</h1>
          <p className="text-sm text-gray-600 mt-1">Automatic customer messages via the Meta WhatsApp Cloud API</p>
        </div>
      </div>

      <div className={`rounded-2xl border p-4 text-sm ${settings.enabled && configured ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
        {settings.enabled && configured
          ? 'WhatsApp is ON. Customers who opted in get a message when stock or a payment is saved.'
          : !configured
            ? 'Not set up yet. Follow the setup guide below, enter your Meta details, save, then send a test message.'
            : 'Set up, but turned OFF. No messages are being sent.'}
      </div>

      <form onSubmit={handleSave} className="space-y-6" noValidate>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
          <h2 className="font-semibold text-gray-900">Meta connection</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number ID</label>
            <input className={inputClass('phoneNumberId')} value={form.phoneNumberId} inputMode="numeric"
              onChange={(e) => setField('phoneNumberId', e.target.value.replace(/\D/g, ''))} placeholder="e.g. 106540352242922" />
            <p className="text-xs text-gray-500 mt-1">Meta → WhatsApp → API Setup → “Phone number ID” (not the phone number itself).</p>
            {fieldError('phoneNumberId')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Permanent Access Token</label>
            <input type="password" autoComplete="new-password" className={inputClass('accessToken')} value={form.accessToken}
              onChange={(e) => setField('accessToken', e.target.value)}
              placeholder={settings.accessTokenSet ? `Saved (ends with …${settings.accessTokenLast4}) — leave blank to keep` : 'Paste the System User access token'} />
            <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
              <p className="text-xs text-gray-500 flex items-center gap-1"><ShieldCheck size={12} /> Stored on the server only; never shown again.</p>
              {settings.accessTokenSet && (
                <button type="button" onClick={clearToken} className="text-xs text-red-600 hover:underline">Remove saved token</button>
              )}
            </div>
            {fieldError('accessToken')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country code</label>
              <input className={inputClass('countryCode')} value={form.countryCode} inputMode="numeric" onChange={(e) => setField('countryCode', e.target.value.replace(/\D/g, ''))} />
              {fieldError('countryCode')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API version</label>
              <input className={inputClass('apiVersion')} value={form.apiVersion} onChange={(e) => setField('apiVersion', e.target.value.trim())} />
              {fieldError('apiVersion')}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
          <h2 className="font-semibold text-gray-900 mb-2">Messages</h2>
          <Toggle checked={form.enabled} onChange={(v) => setField('enabled', v)} label="WhatsApp messages ON"
            hint="Master switch for all CashewFlowX WhatsApp messages." />
          <Toggle checked={form.sendOnStock} onChange={(v) => setField('sendOnStock', v)} disabled={!form.enabled}
            label="When stock is given" hint="Sent after a new stock entry is saved." />
          <Toggle checked={form.sendOnPayment} onChange={(v) => setField('sendOnPayment', v)} disabled={!form.enabled}
            label="When a payment is received" hint="Sent after a new payment is saved, with the updated balance." />
          <div className="pt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Business name in messages</label>
            <input className="input-field" value={form.businessName} maxLength={100} onChange={(e) => setField('businessName', e.target.value)} placeholder="SVR Food Production" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
          <h2 className="font-semibold text-gray-900">Templates</h2>
          <p className="text-xs text-gray-500 -mt-2">Must match the names and languages approved in your Meta account exactly.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock template name</label>
              <input className={inputClass('stockTemplateName')} value={form.stockTemplateName} onChange={(e) => setField('stockTemplateName', e.target.value.trim())} />
              {fieldError('stockTemplateName')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment template name</label>
              <input className={inputClass('paymentTemplateName')} value={form.paymentTemplateName} onChange={(e) => setField('paymentTemplateName', e.target.value.trim())} />
              {fieldError('paymentTemplateName')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">English language code</label>
              <input className={inputClass('englishLanguageCode')} value={form.englishLanguageCode} onChange={(e) => setField('englishLanguageCode', e.target.value.trim())} />
              {fieldError('englishLanguageCode')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telugu language code</label>
              <input className={inputClass('teluguLanguageCode')} value={form.teluguLanguageCode} onChange={(e) => setField('teluguLanguageCode', e.target.value.trim())} />
              {fieldError('teluguLanguageCode')}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        <h2 className="font-semibold text-gray-900">Send a test message</h2>
        <p className="text-xs text-gray-500">Sends Meta’s built-in “hello_world” message, to check the Phone Number ID and token before your own templates are approved.</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input className="input-field" value={testNumber} inputMode="numeric" placeholder="10-digit mobile number"
            onChange={(e) => setTestNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} />
          <button type="button" onClick={handleTest} disabled={testing || !configured}
            className="btn-success flex items-center justify-center gap-2 text-sm whitespace-nowrap" title={configured ? '' : 'Save the Phone Number ID and token first'}>
            <Send size={16} /> {testing ? 'Sending...' : 'Send Test'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200">
        <button type="button" onClick={() => setShowGuide((v) => !v)} className="w-full flex items-center justify-between p-4 text-left">
          <span className="font-semibold text-gray-900">Setup guide (one time)</span>
          {showGuide ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {showGuide && templates && (
          <div className="px-4 pb-4 space-y-4 text-sm text-gray-700">
            <ol className="list-decimal pl-5 space-y-2">
              <li>Create a <b>Meta Business</b> account at business.facebook.com and complete business verification.</li>
              <li>At developers.facebook.com create an app (type <b>Business</b>) and add the <b>WhatsApp</b> product.</li>
              <li>Add your business phone number. A number already on the <b>WhatsApp Business app</b> can be connected with Meta’s <b>coexistence</b> option (it must have been actively used in the app for at least 7 days, app version 2.24.17 or newer) so you keep using the app too. A number on normal (personal) WhatsApp cannot be used.</li>
              <li>Copy the <b>Phone number ID</b> from WhatsApp → API Setup into the field above.</li>
              <li>In Business Settings → System Users, create a system user, give it the app with <b>whatsapp_business_messaging</b> permission, and generate a token that <b>never expires</b>. (The temporary token on the API Setup page stops working after 24 hours.)</li>
              <li>In WhatsApp Manager → Message Templates, create the two templates below, each in <b>English</b> and <b>Telugu</b>, and wait for approval.</li>
              <li>Save settings here, send a test message, then turn WhatsApp ON.</li>
            </ol>
            <TemplateCard title="Stock given" name={form.stockTemplateName} template={templates.stock} />
            <TemplateCard title="Payment received" name={form.paymentTemplateName} template={templates.payment} />
            <p className="text-xs text-gray-500">Meta charges per message (Utility category). Have a Telugu speaker check the Telugu wording before submitting.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashewFlowXWhatsAppSettings;
