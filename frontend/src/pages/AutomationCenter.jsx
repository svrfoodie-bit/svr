import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Bell, Package, TrendingDown, FileText,
  Settings, Play, CheckCircle, XCircle, Clock,
  RefreshCw, AlertCircle, ChevronDown, ChevronUp,
  MessageCircle, Phone, Loader, SkipForward,
  IndianRupee, BarChart3,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const JOB_META = {
  payment_reminder: { label: 'Payment Reminders',  icon: Bell,         color: 'blue',   desc: 'Notify overdue customers via WhatsApp/SMS' },
  stock_alert:      { label: 'Stock Alerts',        icon: Package,      color: 'orange', desc: 'Alert when finished goods fall below threshold' },
  depreciation:     { label: 'Depreciation',        icon: TrendingDown, color: 'purple', desc: 'Auto-reduce fixed asset values monthly' },
  gst_compile:      { label: 'GST Compile',         icon: FileText,     color: 'green',  desc: 'Snapshot GST data monthly for filing' },
};

const STATUS_ICON = {
  success: <CheckCircle size={14} className="text-green-500" />,
  failed:  <XCircle    size={14} className="text-red-500"   />,
  skipped: <SkipForward size={14} className="text-gray-400" />,
};

const COLOR = {
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700',   btn: 'bg-blue-600 hover:bg-blue-700'   },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', btn: 'bg-orange-600 hover:bg-orange-700' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700', btn: 'bg-purple-600 hover:bg-purple-700' },
  green:  { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  badge: 'bg-green-100 text-green-700',  btn: 'bg-green-600 hover:bg-green-700'  },
};

const fmt = (v) => parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ── Main Component ───────────────────────────────────────────────────────── */
const AutomationCenter = () => {
  const [settings, setSettings]   = useState({});
  const [status,   setStatus]     = useState(null);
  const [logs,     setLogs]       = useState([]);
  const [gstSnap,  setGstSnap]    = useState(null);
  const [tab,      setTab]        = useState('overview');  // overview | settings | logs
  const [saving,   setSaving]     = useState(false);
  const [running,  setRunning]    = useState({});
  const [loading,  setLoading]    = useState(true);
  const [showPwd,  setShowPwd]    = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, st, l, g] = await Promise.all([
        api.get('/automation/settings'),
        api.get('/automation/status'),
        api.get('/automation/logs?limit=30'),
        api.get('/automation/gst-snapshot'),
      ]);
      setSettings(s);
      setStatus(st);
      setLogs(l);
      setGstSnap(g);
    } catch { toast.error('Failed to load automation data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.post('/automation/settings', settings);
      toast.success('Settings saved & jobs reloaded');
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const trigger = async (jobType) => {
    setRunning(p => ({ ...p, [jobType]: true }));
    try {
      await api.post(`/automation/trigger/${jobType}`);
      toast.success(`${JOB_META[jobType].label} completed`);
      await load();
    } catch (err) {
      toast.error(err.message || 'Job failed');
    } finally {
      setRunning(p => ({ ...p, [jobType]: false }));
    }
  };

  const testNotification = async () => {
    const phone = settings.owner_phone;
    if (!phone) return toast.error('Set Owner Phone first');
    try {
      await api.post('/automation/test-notification', { phone });
      toast.success('Test WhatsApp sent!');
    } catch (err) {
      toast.error(err.message || 'Failed to send test');
    }
  };

  const set = (key, val) => setSettings(p => ({ ...p, [key]: val }));

  if (loading) return (
    <div className="p-6 flex items-center justify-center min-h-[400px]">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-600">Loading Automation Center...</span>
      </div>
    </div>
  );

  const lastRuns = status?.lastRuns || {};

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={22} className="text-primary-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Automation Center</h1>
          </div>
          <p className="text-sm text-gray-500">Scheduled jobs that run automatically in the background</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700 shadow-soft">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {[['overview','Overview'],['settings','Settings'],['logs','Activity Logs']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {Object.entries(JOB_META).map(([jobType, meta]) => {
            const c       = COLOR[meta.color];
            const lastRun = lastRuns[jobType];
            const enabled = settings[`${jobType}_enabled`] === 'true';
            const Icon    = meta.icon;
            const busy    = running[jobType];

            return (
              <motion.div key={jobType} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`${c.bg} ${c.border} border rounded-2xl p-5`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${c.badge}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold ${c.text}`}>{meta.label}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${enabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                          {enabled ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{meta.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {lastRun && (
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {STATUS_ICON[lastRun.status]}
                          <span className="text-xs text-gray-600 capitalize">{lastRun.status}</span>
                        </div>
                        <p className="text-[10px] text-gray-400">
                          {new Date(lastRun.runAt).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                        </p>
                      </div>
                    )}
                    <button onClick={() => trigger(jobType)} disabled={busy}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors ${c.btn} disabled:opacity-50`}>
                      {busy ? <Loader size={12} className="animate-spin" /> : <Play size={12} />}
                      Run Now
                    </button>
                  </div>
                </div>

                {/* Last run summary */}
                {lastRun?.summary && (
                  <p className="mt-3 text-xs text-gray-600 bg-white/60 rounded-lg px-3 py-2">
                    {lastRun.summary}
                  </p>
                )}
              </motion.div>
            );
          })}

          {/* GST Snapshot card */}
          {gstSnap?.details && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white border border-gray-100 rounded-2xl shadow-soft p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={16} className="text-green-600" />
                <p className="font-semibold text-gray-800">Latest GST Snapshot — {gstSnap.details.period}</p>
                <span className="ml-auto text-xs text-gray-400">
                  {new Date(gstSnap.runAt).toLocaleDateString('en-IN')}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <GstKpi label="Output CGST"     value={gstSnap.details.outputCGST}  color="text-blue-600" />
                <GstKpi label="Output SGST"     value={gstSnap.details.outputSGST}  color="text-blue-600" />
                <GstKpi label="Input ITC"       value={gstSnap.details.inputITC}    color="text-green-600" />
                <GstKpi label="Net GST Payable" value={gstSnap.details.netGSTPayable} color="text-red-600" bold />
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* ── SETTINGS TAB ─────────────────────────────────────────────────────── */}
      {tab === 'settings' && (
        <div className="space-y-6">

          {/* Twilio / Notification Config */}
          <Section title="WhatsApp / SMS (Twilio)" icon={<MessageCircle size={16} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Twilio Account SID">
                <input value={settings.twilio_account_sid || ''} onChange={e => set('twilio_account_sid', e.target.value)}
                  className="input-field" placeholder="ACxxxxxxxx..." />
              </Field>
              <Field label="Twilio Auth Token">
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} value={settings.twilio_auth_token || ''}
                    onChange={e => set('twilio_auth_token', e.target.value)}
                    className="input-field pr-10" placeholder="Enter token..." />
                  <button onClick={() => setShowPwd(p => !p)} className="absolute right-3 top-2.5 text-gray-400 text-xs">
                    {showPwd ? 'Hide' : 'Show'}
                  </button>
                </div>
              </Field>
              <Field label="WhatsApp From (Twilio sandbox)">
                <input value={settings.twilio_whatsapp_from || ''} onChange={e => set('twilio_whatsapp_from', e.target.value)}
                  className="input-field" placeholder="whatsapp:+14155238886" />
              </Field>
              <Field label="SMS From (Twilio number)">
                <input value={settings.twilio_sms_from || ''} onChange={e => set('twilio_sms_from', e.target.value)}
                  className="input-field" placeholder="+1415..." />
              </Field>
              <Field label="Owner / Admin Phone (for alerts)">
                <div className="flex gap-2">
                  <input value={settings.owner_phone || ''} onChange={e => set('owner_phone', e.target.value)}
                    className="input-field flex-1" placeholder="9876543210" />
                  <button onClick={testNotification}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1">
                    <Phone size={12} /> Test
                  </button>
                </div>
              </Field>
            </div>
          </Section>

          {/* Payment Reminders */}
          <Section title="Payment Reminders" icon={<Bell size={16} className="text-blue-600" />}>
            <Toggle label="Enable auto payment reminders" checked={settings.payment_reminder_enabled === 'true'}
              onChange={v => set('payment_reminder_enabled', v ? 'true' : 'false')} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Field label="Remind after (days overdue)">
                <input type="number" min={1} value={settings.payment_reminder_days || 30}
                  onChange={e => set('payment_reminder_days', e.target.value)} className="input-field" />
              </Field>
              <Field label="Channel">
                <select value={settings.payment_reminder_channel || 'whatsapp'}
                  onChange={e => set('payment_reminder_channel', e.target.value)} className="input-field">
                  <option value="whatsapp">WhatsApp only</option>
                  <option value="sms">SMS only</option>
                  <option value="both">Both WhatsApp + SMS</option>
                </select>
              </Field>
              <Field label="Cron schedule">
                <input value={settings.payment_reminder_schedule || '0 9 * * *'}
                  onChange={e => set('payment_reminder_schedule', e.target.value)}
                  className="input-field font-mono text-sm" placeholder="0 9 * * *" />
                <p className="text-[10px] text-gray-400 mt-1">Default: daily at 9 AM</p>
              </Field>
            </div>
          </Section>

          {/* Stock Alerts */}
          <Section title="Stock Alerts" icon={<Package size={16} className="text-orange-600" />}>
            <Toggle label="Enable low stock alerts" checked={settings.stock_alert_enabled === 'true'}
              onChange={v => set('stock_alert_enabled', v ? 'true' : 'false')} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Field label="Alert threshold (kg per grade)">
                <input type="number" min={1} value={settings.stock_alert_threshold_kg || 100}
                  onChange={e => set('stock_alert_threshold_kg', e.target.value)} className="input-field" />
              </Field>
              <Field label="Alert phone (leave blank to use Owner Phone)">
                <input value={settings.stock_alert_phone || ''}
                  onChange={e => set('stock_alert_phone', e.target.value)}
                  className="input-field" placeholder="9876543210" />
              </Field>
            </div>
            <p className="text-xs text-gray-400 mt-2">Runs every 6 hours automatically</p>
          </Section>

          {/* Depreciation */}
          <Section title="Depreciation" icon={<TrendingDown size={16} className="text-purple-600" />}>
            <Toggle label="Enable monthly auto-depreciation" checked={settings.depreciation_enabled === 'true'}
              onChange={v => set('depreciation_enabled', v ? 'true' : 'false')} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Field label="Run on day of month">
                <input type="number" min={1} max={28} value={settings.depreciation_day_of_month || 1}
                  onChange={e => set('depreciation_day_of_month', e.target.value)} className="input-field" />
              </Field>
            </div>
            <div className="mt-3 bg-purple-50 border border-purple-200 rounded-xl p-3">
              <p className="text-xs text-purple-700">
                Each active fixed asset with a <strong>Depreciation Rate %</strong> set will be reduced monthly.
                Rate is set per-asset in the <strong>Fixed Assets</strong> page. Land is typically 0% (no depreciation).
              </p>
            </div>
          </Section>

          {/* GST Compile */}
          <Section title="GST Auto-Compile" icon={<FileText size={16} className="text-green-600" />}>
            <Toggle label="Enable monthly GST data compilation" checked={settings.gst_compile_enabled === 'true'}
              onChange={v => set('gst_compile_enabled', v ? 'true' : 'false')} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Field label="Compile on day of month">
                <input type="number" min={1} max={28} value={settings.gst_compile_day_of_month || 5}
                  onChange={e => set('gst_compile_day_of_month', e.target.value)} className="input-field" />
              </Field>
            </div>
            <p className="text-xs text-gray-400 mt-2">Compiles previous month's GST data (output tax, ITC, net payable). View snapshot in Overview tab.</p>
          </Section>

          {/* Save button */}
          <div className="flex justify-end pt-2">
            <button onClick={saveSettings} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm disabled:opacity-50">
              {saving ? <Loader size={14} className="animate-spin" /> : <Settings size={14} />}
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* ── LOGS TAB ─────────────────────────────────────────────────────────── */}
      {tab === 'logs' && (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Recent Activity ({logs.length})</p>
            <button onClick={load} className="text-xs text-primary-600 hover:underline">Refresh</button>
          </div>
          {logs.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Clock size={40} className="mx-auto mb-3 opacity-30" />
              <p>No automation runs yet. Enable jobs and they will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {logs.map((log) => {
                const meta = JOB_META[log.jobType];
                const Icon = meta?.icon || Zap;
                return (
                  <div key={log.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${COLOR[meta?.color || 'blue'].badge}`}>
                          <Icon size={13} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-800">{meta?.label || log.jobType}</p>
                            {STATUS_ICON[log.status]}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                              log.status === 'success' ? 'bg-green-100 text-green-700' :
                              log.status === 'failed'  ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-500'}`}>
                              {log.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{log.summary}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(log.runAt).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Info banner */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          Automation runs in the background on the server. <strong>WhatsApp</strong> messages require a Twilio account with WhatsApp Business API enabled.
          Use <strong>Run Now</strong> to test any job manually before enabling automatic scheduling.
        </p>
      </motion.div>
    </div>
  );
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const Section = ({ title, icon, children }) => (
  <div className="bg-white border border-gray-100 rounded-2xl shadow-soft p-5">
    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
      {icon}
      <h3 className="font-semibold text-gray-800">{title}</h3>
    </div>
    {children}
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
    {children}
  </div>
);

const Toggle = ({ label, checked, onChange }) => (
  <div className="flex items-center gap-3">
    <button onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-primary-600' : 'bg-gray-300'}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
    <span className="text-sm font-medium text-gray-700">{label}</span>
  </div>
);

const GstKpi = ({ label, value, color, bold }) => (
  <div className="bg-gray-50 rounded-xl p-3">
    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">{label}</p>
    <p className={`text-base ${bold ? 'font-bold' : 'font-semibold'} ${color}`}>₹{fmt(value)}</p>
  </div>
);

export default AutomationCenter;
