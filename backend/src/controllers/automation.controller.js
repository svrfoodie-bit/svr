const AutomationSettings = require('../models/AutomationSettings.model');
const AutomationLog      = require('../models/AutomationLog.model');
const NotificationService = require('../services/notificationService');
const schedulerService   = require('../services/scheduler.service');
const {
  runPaymentReminders,
  runStockAlert,
  runDepreciation,
  runGSTCompile,
} = require('../services/automationJobs.service');
const logger = require('../config/logger');

/* ── Get all settings ──────────────────────────────────────────────────────── */
exports.getSettings = async (req, res) => {
  try {
    const settings = await AutomationSettings.getAll();
    // Mask Twilio credentials in response
    if (settings.twilio_auth_token) settings.twilio_auth_token = '••••••••';
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Save settings ─────────────────────────────────────────────────────────── */
exports.saveSettings = async (req, res) => {
  try {
    const allowed = [
      'payment_reminder_enabled', 'payment_reminder_days',
      'payment_reminder_channel', 'payment_reminder_schedule',
      'stock_alert_enabled', 'stock_alert_threshold_kg', 'stock_alert_phone',
      'depreciation_enabled', 'depreciation_day_of_month',
      'gst_compile_enabled', 'gst_compile_day_of_month',
      'twilio_account_sid', 'twilio_auth_token',
      'twilio_whatsapp_from', 'twilio_sms_from',
      'owner_phone',
    ];

    const toSave = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined && req.body[key] !== '••••••••') {
        toSave[key] = req.body[key];
      }
    }

    await AutomationSettings.setMany(toSave);

    // Reload cron jobs with new schedule settings
    await schedulerService.reloadAutomationJobs();

    res.json({ success: true, message: 'Settings saved and jobs reloaded' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Get logs ──────────────────────────────────────────────────────────────── */
exports.getLogs = async (req, res) => {
  try {
    const limit   = parseInt(req.query.limit) || 50;
    const jobType = req.query.jobType;
    const logs    = jobType
      ? await AutomationLog.getByType(jobType, limit)
      : await AutomationLog.getRecent(limit);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Manual trigger ────────────────────────────────────────────────────────── */
exports.triggerJob = async (req, res) => {
  const { jobType } = req.params;
  const jobs = {
    payment_reminder: runPaymentReminders,
    stock_alert:      runStockAlert,
    depreciation:     runDepreciation,
    gst_compile:      runGSTCompile,
  };

  if (!jobs[jobType]) {
    return res.status(400).json({ success: false, message: `Unknown job: ${jobType}` });
  }

  try {
    logger.info(`Manual trigger: ${jobType} by user ${req.user?.id}`);
    const result = await jobs[jobType]();
    res.json({ success: true, message: `${jobType} completed`, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Test notification ─────────────────────────────────────────────────────── */
exports.testNotification = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ success: false, message: 'Phone number required' });

  try {
    const result = await NotificationService.sendTest(phone);
    res.json({ success: true, message: 'Test message sent', data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Status ────────────────────────────────────────────────────────────────── */
exports.getStatus = async (req, res) => {
  try {
    const schedulerStatus = schedulerService.getStatus();
    const lastRuns = {};
    for (const jobType of ['payment_reminder', 'stock_alert', 'depreciation', 'gst_compile']) {
      lastRuns[jobType] = await AutomationLog.getLastRun(jobType);
    }
    res.json({ success: true, data: { scheduler: schedulerStatus, lastRuns } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Latest GST snapshot ───────────────────────────────────────────────────── */
exports.getLatestGST = async (req, res) => {
  try {
    const logs = await AutomationLog.getByType('gst_compile', 1);
    res.json({ success: true, data: logs[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
