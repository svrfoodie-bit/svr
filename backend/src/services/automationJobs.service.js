/**
 * Automation Jobs Service
 * Four scheduled jobs:
 *  1. Payment Reminders   — daily, notify overdue customers via WhatsApp/SMS
 *  2. Stock Alerts        — every 6h, notify if finished goods below threshold
 *  3. Depreciation        — monthly (1st), reduce fixed asset currentValue
 *  4. GST Compile         — monthly (5th), snapshot GST summary into DB
 */
const { promisePool } = require('../config/database');
const AutomationSettings = require('../models/AutomationSettings.model');
const AutomationLog      = require('../models/AutomationLog.model');
const Settings           = require('../models/Settings.model');
const NotificationService = require('./notificationService');
const logger = require('../config/logger');

/* ─────────────────────────────────────────────────────────────────────────── */
/*  JOB 1 — Payment Reminders                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */
async function runPaymentReminders() {
  const settings = await AutomationSettings.getAll();
  const companyName = await Settings.getCompanyName();
  if (settings.payment_reminder_enabled !== 'true') {
    return AutomationLog.create({ jobType: 'payment_reminder', status: 'skipped', summary: 'Disabled in settings' });
  }

  const thresholdDays = parseInt(settings.payment_reminder_days) || 30;
  const channel       = settings.payment_reminder_channel || 'whatsapp';

  try {
    // Customers with outstanding balance older than threshold
    const [rows] = await promisePool.query(`
      SELECT
        c.id,
        c.name,
        c.contactNumber AS phone,
        SUM(so.totalAmount)                          AS totalBilled,
        COALESCE(SUM(sp.amount), 0)                  AS totalPaid,
        SUM(so.totalAmount) - COALESCE(SUM(sp.amount), 0) AS outstanding,
        MIN(so.orderDate)                            AS oldestOrderDate,
        DATEDIFF(NOW(), MIN(so.orderDate))           AS daysOld
      FROM customers c
      JOIN sales_orders so ON so.customerId = c.id AND so.status != 'Cancelled'
      LEFT JOIN (
        SELECT customerId, SUM(amount) AS amount FROM sales_payments GROUP BY customerId
      ) sp ON sp.customerId = c.id
      GROUP BY c.id, c.name, c.contactNumber
      HAVING outstanding > 0 AND daysOld >= ?
      ORDER BY outstanding DESC
    `, [thresholdDays]);

    if (rows.length === 0) {
      return AutomationLog.create({
        jobType: 'payment_reminder', status: 'success',
        summary: 'No overdue customers found', details: { sent: 0 }
      });
    }

    let sent = 0, failed = 0;
    const results = [];

    for (const customer of rows) {
      if (!customer.phone) { failed++; continue; }

      const outstanding = parseFloat(customer.outstanding).toLocaleString('en-IN', { minimumFractionDigits: 2 });
      const days        = customer.daysOld;
      const message = [
        `🏭 ${companyName}`,
        ``,
        `Dear ${customer.name},`,
        ``,
        `This is a payment reminder. You have an outstanding balance of ₹${outstanding} pending for ${days} days.`,
        ``,
        `Please arrange payment at your earliest convenience.`,
        ``,
        `For queries, contact us. Thank you for your business! 🙏`,
      ].join('\n');

      try {
        await NotificationService.notify(customer.phone, message, channel);
        sent++;
        results.push({ customer: customer.name, phone: customer.phone, outstanding, status: 'sent' });
      } catch (err) {
        failed++;
        results.push({ customer: customer.name, phone: customer.phone, status: 'failed', error: err.message });
        logger.warn(`Payment reminder failed for ${customer.name}: ${err.message}`);
      }
    }

    return AutomationLog.create({
      jobType: 'payment_reminder', status: 'success',
      summary: `Sent ${sent}/${rows.length} reminders (${failed} failed)`,
      details: { sent, failed, total: rows.length, results }
    });
  } catch (err) {
    logger.error('Payment reminder job error:', err);
    return AutomationLog.create({
      jobType: 'payment_reminder', status: 'failed',
      summary: err.message, details: { error: err.stack }
    });
  }
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  JOB 2 — Stock Alerts                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */
async function runStockAlert() {
  const settings = await AutomationSettings.getAll();
  const companyName = await Settings.getCompanyName();
  if (settings.stock_alert_enabled !== 'true') {
    return AutomationLog.create({ jobType: 'stock_alert', status: 'skipped', summary: 'Disabled in settings' });
  }

  const thresholdKg   = parseFloat(settings.stock_alert_threshold_kg) || 100;
  const ownerPhone    = settings.stock_alert_phone || settings.owner_phone;
  const channel       = settings.payment_reminder_channel || 'whatsapp';

  try {
    const [rows] = await promisePool.query(`
      SELECT
        gradeId,
        SUM(CASE WHEN transactionType = 'IN'  THEN quantity ELSE 0 END) -
        SUM(CASE WHEN transactionType = 'OUT' THEN quantity ELSE 0 END) AS stockQty
      FROM finished_goods_stock
      GROUP BY gradeId
      HAVING stockQty < ?
    `, [thresholdKg]);

    if (rows.length === 0) {
      return AutomationLog.create({
        jobType: 'stock_alert', status: 'success',
        summary: `All grades above ${thresholdKg} kg threshold`, details: { alertsTriggered: 0 }
      });
    }

    const lowItems = rows.map(r => `Grade ${r.gradeId}: ${parseFloat(r.stockQty).toFixed(1)} kg`).join('\n');
    const message = [
      `⚠️ ${companyName} — LOW STOCK ALERT`,
      ``,
      `The following grades are below ${thresholdKg} kg:`,
      lowItems,
      ``,
      `Please arrange replenishment or adjust production. (${new Date().toLocaleString('en-IN')})`,
    ].join('\n');

    if (ownerPhone) {
      try {
        await NotificationService.notify(ownerPhone, message, channel);
      } catch (err) {
        logger.warn('Stock alert notification failed:', err.message);
      }
    }

    return AutomationLog.create({
      jobType: 'stock_alert', status: 'success',
      summary: `${rows.length} grade(s) below threshold (${thresholdKg} kg)`,
      details: { alertsTriggered: rows.length, items: rows, notified: !!ownerPhone }
    });
  } catch (err) {
    logger.error('Stock alert job error:', err);
    return AutomationLog.create({
      jobType: 'stock_alert', status: 'failed',
      summary: err.message, details: { error: err.stack }
    });
  }
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  JOB 3 — Depreciation                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */
async function runDepreciation() {
  const settings = await AutomationSettings.getAll();
  if (settings.depreciation_enabled !== 'true') {
    return AutomationLog.create({ jobType: 'depreciation', status: 'skipped', summary: 'Disabled in settings' });
  }

  try {
    // Get all active assets that have a depreciation rate set
    const [assets] = await promisePool.query(`
      SELECT id, assetCode, assetName, purchaseCost, currentValue, depreciationRate, lastDepreciationDate
      FROM fixed_assets
      WHERE status = 'Active' AND depreciationRate > 0
        AND (lastDepreciationDate IS NULL OR MONTH(lastDepreciationDate) != MONTH(NOW()) OR YEAR(lastDepreciationDate) != YEAR(NOW()))
    `);

    if (assets.length === 0) {
      return AutomationLog.create({
        jobType: 'depreciation', status: 'success',
        summary: 'No assets due for depreciation this month', details: { processed: 0 }
      });
    }

    let processed = 0;
    const results = [];

    for (const asset of assets) {
      // Monthly depreciation = (annualRate / 12) % of purchaseCost
      const monthlyDepreciation = (parseFloat(asset.purchaseCost) * parseFloat(asset.depreciationRate)) / 100 / 12;
      const newValue = Math.max(0, parseFloat(asset.currentValue) - monthlyDepreciation);

      await promisePool.query(
        'UPDATE fixed_assets SET currentValue = ?, lastDepreciationDate = CURDATE() WHERE id = ?',
        [newValue, asset.id]
      );

      results.push({
        assetCode: asset.assetCode,
        assetName: asset.assetName,
        before: parseFloat(asset.currentValue),
        depreciation: monthlyDepreciation,
        after: newValue,
      });
      processed++;
    }

    const totalDepreciated = results.reduce((s, r) => s + r.depreciation, 0);
    return AutomationLog.create({
      jobType: 'depreciation', status: 'success',
      summary: `Depreciated ${processed} assets. Total: ₹${totalDepreciated.toFixed(2)}`,
      details: { processed, totalDepreciated, results }
    });
  } catch (err) {
    logger.error('Depreciation job error:', err);
    return AutomationLog.create({
      jobType: 'depreciation', status: 'failed',
      summary: err.message, details: { error: err.stack }
    });
  }
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  JOB 4 — GST Compile                                                         */
/* ─────────────────────────────────────────────────────────────────────────── */
async function runGSTCompile() {
  const settings = await AutomationSettings.getAll();
  if (settings.gst_compile_enabled !== 'true') {
    return AutomationLog.create({ jobType: 'gst_compile', status: 'skipped', summary: 'Disabled in settings' });
  }

  try {
    // Compile for previous month
    const now   = new Date();
    const month = now.getMonth() === 0 ? 12 : now.getMonth();   // previous month
    const year  = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    // Output GST — from sales orders
    const [outputRows] = await promisePool.query(`
      SELECT
        COALESCE(SUM(totalAmount), 0)       AS taxableValue,
        COALESCE(SUM(cgstAmount), 0)        AS cgst,
        COALESCE(SUM(sgstAmount), 0)        AS sgst,
        COALESCE(SUM(igstAmount), 0)        AS igst,
        COALESCE(SUM(totalAmount * (COALESCE(cgstRate,0)+COALESCE(sgstRate,0)+COALESCE(igstRate,0))/100), 0) AS totalTax
      FROM sales_orders
      WHERE MONTH(orderDate) = ? AND YEAR(orderDate) = ? AND status != 'Cancelled'
    `, [month, year]);

    // Input GST (ITC) — from raw purchases
    const [inputRows] = await promisePool.query(`
      SELECT
        COALESCE(SUM(totalAmount), 0) AS taxableValue,
        COALESCE(SUM(gstAmount), 0)   AS totalTax
      FROM raw_purchases
      WHERE MONTH(purchaseDate) = ? AND YEAR(purchaseDate) = ?
    `, [month, year]);

    const output = outputRows[0];
    const input  = inputRows[0];
    const netGST = parseFloat(output.cgst || 0) + parseFloat(output.sgst || 0) +
                   parseFloat(output.igst || 0) - parseFloat(input.totalTax || 0);

    const summary = {
      period:         `${month}/${year}`,
      outputTaxable:  parseFloat(output.taxableValue || 0),
      outputCGST:     parseFloat(output.cgst || 0),
      outputSGST:     parseFloat(output.sgst || 0),
      outputIGST:     parseFloat(output.igst || 0),
      outputTotalTax: parseFloat(output.totalTax || 0),
      inputTaxable:   parseFloat(input.taxableValue || 0),
      inputITC:       parseFloat(input.totalTax || 0),
      netGSTPayable:  netGST,
      compiledAt:     new Date().toISOString(),
    };

    // Store compiled snapshot in automation_logs details for retrieval
    await AutomationLog.create({
      jobType: 'gst_compile', status: 'success',
      summary: `GST compiled for ${month}/${year}. Net payable: ₹${netGST.toFixed(2)}`,
      details: summary
    });

    logger.info(`GST compiled for ${month}/${year}: Net payable ₹${netGST.toFixed(2)}`);
    return summary;
  } catch (err) {
    logger.error('GST compile job error:', err);
    return AutomationLog.create({
      jobType: 'gst_compile', status: 'failed',
      summary: err.message, details: { error: err.stack }
    });
  }
}

module.exports = { runPaymentReminders, runStockAlert, runDepreciation, runGSTCompile };
