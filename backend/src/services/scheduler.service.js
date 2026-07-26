const cron = require('node-cron');
const ExportSchedule = require('../models/ExportSchedule.model');
const ExportHistory = require('../models/ExportHistory.model');
const exportService = require('./export.service');
const emailService = require('./email.service');
const logger = require('../config/logger');
const AutomationSettings = require('../models/AutomationSettings.model');
const { runPaymentReminders, runStockAlert, runDepreciation, runGSTCompile } = require('./automationJobs.service');

class SchedulerService {
  constructor() {
    this.tasks = new Map();
    this.isRunning = false;
  }

  /**
   * Start the scheduler
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Scheduler is already running');
      return;
    }

    // Initialize email service
    emailService.initialize();

    // Run every minute to check for due export schedules
    this.mainTask = cron.schedule('* * * * *', async () => {
      await this.checkAndRunSchedules();
    });

    // ── Automation Jobs ──────────────────────────────────────────────────────
    await this.startAutomationJobs();

    this.isRunning = true;
    logger.info('Export scheduler started successfully');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.mainTask) {
      this.mainTask.stop();
      this.mainTask = null;
    }

    // Stop all individual tasks
    this.tasks.forEach(task => task.stop());
    this.tasks.clear();

    this.isRunning = false;
    logger.info('Export scheduler stopped');
  }

  /**
   * Check and run due schedules
   */
  async checkAndRunSchedules() {
    try {
      const dueSchedules = await ExportSchedule.findDue();

      if (dueSchedules.length === 0) {
        return;
      }

      logger.info(`Found ${dueSchedules.length} due schedules`);

      for (const schedule of dueSchedules) {
        await this.runSchedule(schedule);
      }
    } catch (error) {
      logger.error('Error checking schedules:', error);
    }
  }

  /**
   * Run a specific schedule
   */
  async runSchedule(schedule) {
    logger.info(`Running schedule: ${schedule.name} (ID: ${schedule.id})`);

    // Create history record
    const historyRecord = await ExportHistory.create({
      type: 'SCHEDULED',
      module: schedule.module,
      format: schedule.format,
      recipients: schedule.recipients,
      status: 'IN_PROGRESS',
      executedBy: 'System',
      userId: schedule.created_by
    });

    try {
      // Get data based on module
      const data = await this.getModuleData(schedule.module);

      // Get columns (use template if available)
      const columns = await this.getColumns(schedule.module, schedule.template_id);

      // Generate export file
      let fileResult;
      if (schedule.format === 'EXCEL') {
        fileResult = await exportService.generateExcel(data, columns, {
          module: schedule.module
        });
      } else if (schedule.format === 'PDF') {
        fileResult = await exportService.generatePDF(data, columns, {
          module: schedule.module,
          title: schedule.name
        });
      }

      // Send email
      await emailService.sendScheduledReport({
        recipients: schedule.recipients,
        reportName: schedule.name,
        filePath: fileResult.filePath,
        fileName: fileResult.fileName,
        module: schedule.module
      });

      // Update history to success
      await ExportHistory.updateStatus(historyRecord.id, 'SUCCESS', {
        recordCount: fileResult.recordCount,
        fileSize: fileResult.fileSize,
        filePath: fileResult.filePath
      });

      // Mark schedule as run and calculate next run
      await ExportSchedule.markAsRun(schedule.id);

      logger.info(`Schedule completed successfully: ${schedule.name}`);

      // Clean up file after 7 days
      setTimeout(async () => {
        await exportService.deleteFile(fileResult.filePath);
      }, 7 * 24 * 60 * 60 * 1000);

    } catch (error) {
      // Update history to failed
      await ExportHistory.updateStatus(historyRecord.id, 'FAILED', {
        errorMessage: error.message
      });

      logger.error(`Schedule failed: ${schedule.name}`, error);
    }
  }

  /**
   * Get module data for export
   * This should be implemented to fetch actual data from respective modules
   */
  async getModuleData(module) {
    // This is a placeholder - implement actual data fetching
    // based on your module services

    logger.info(`Fetching data for module: ${module}`);

    // For now, return mock data
    // In production, this should call the respective service:
    // - salesOrderService.getAll() for SALES
    // - rawPurchaseService.getAll() for RAW_PURCHASE
    // - etc.

    return [
      {
        id: 1,
        date: new Date().toISOString().split('T')[0],
        amount: 50000,
        status: 'COMPLETED'
      }
    ];
  }

  /**
   * Get columns for export
   */
  async getColumns(module, templateId) {
    // If template is specified, use template columns
    if (templateId) {
      const ExportTemplate = require('../models/ExportTemplate.model');
      const template = await ExportTemplate.findById(templateId);
      if (template) {
        return template.columns;
      }
    }

    // Default columns based on module
    const defaultColumns = {
      SALES: ['Order Number', 'Customer', 'Date', 'Amount', 'Status'],
      PAYMENTS: ['Date', 'Party', 'Amount', 'Payment Mode', 'Status'],
      RAW_PURCHASE: ['Purchase No', 'Farmer', 'Date', 'Quantity', 'Amount'],
      JOB_WORK: ['Job No', 'Processor', 'Date', 'Quantity', 'Cost'],
      EXPENSES: ['Date', 'Category', 'Description', 'Amount'],
      CUSTOMERS: ['Name', 'Contact', 'Email', 'Address', 'Balance']
    };

    return defaultColumns[module] || ['ID', 'Date', 'Description', 'Amount'];
  }

  /**
   * Run a schedule manually (for testing)
   */
  async runScheduleManually(scheduleId) {
    try {
      const schedule = await ExportSchedule.findById(scheduleId);

      if (!schedule) {
        throw new Error('Schedule not found');
      }

      await this.runSchedule(schedule);

      return { success: true, message: 'Schedule run successfully' };
    } catch (error) {
      logger.error('Failed to run schedule manually:', error);
      throw error;
    }
  }

  /**
   * Register / re-register all automation cron jobs from DB settings
   */
  async startAutomationJobs() {
    // Stop existing automation tasks before re-registering
    ['payment_reminder', 'stock_alert', 'depreciation', 'gst_compile'].forEach(key => {
      if (this.tasks.has(key)) { this.tasks.get(key).stop(); this.tasks.delete(key); }
    });

    try {
      const settings = await AutomationSettings.getAll();

      // 1. Payment reminders — configurable cron (default: daily 9 AM)
      const prSchedule = settings.payment_reminder_schedule || '0 9 * * *';
      if (cron.validate(prSchedule)) {
        this.tasks.set('payment_reminder', cron.schedule(prSchedule, async () => {
          logger.info('Running payment reminders job...');
          await runPaymentReminders();
        }));
        logger.info(`Payment reminder job scheduled: ${prSchedule}`);
      }

      // 2. Stock alerts — every 6 hours
      this.tasks.set('stock_alert', cron.schedule('0 */6 * * *', async () => {
        logger.info('Running stock alert job...');
        await runStockAlert();
      }));
      logger.info('Stock alert job scheduled: every 6h');

      // 3. Depreciation — 1st of every month at 00:05
      const depDay = parseInt(settings.depreciation_day_of_month) || 1;
      const depSchedule = `5 0 ${depDay} * *`;
      this.tasks.set('depreciation', cron.schedule(depSchedule, async () => {
        logger.info('Running monthly depreciation job...');
        await runDepreciation();
      }));
      logger.info(`Depreciation job scheduled: day ${depDay} of month`);

      // 4. GST compile — 5th of every month at 00:10 (files before due date)
      const gstDay = parseInt(settings.gst_compile_day_of_month) || 5;
      const gstSchedule = `10 0 ${gstDay} * *`;
      this.tasks.set('gst_compile', cron.schedule(gstSchedule, async () => {
        logger.info('Running GST compile job...');
        await runGSTCompile();
      }));
      logger.info(`GST compile job scheduled: day ${gstDay} of month`);

    } catch (err) {
      logger.error('Failed to start automation jobs:', err.message);
    }
  }

  /**
   * Reload automation jobs (call after settings change)
   */
  async reloadAutomationJobs() {
    await this.startAutomationJobs();
    logger.info('Automation jobs reloaded');
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      tasksCount: this.tasks.size,
      automationTasks: Array.from(this.tasks.keys()),
    };
  }
}

// Export singleton instance
module.exports = new SchedulerService();
