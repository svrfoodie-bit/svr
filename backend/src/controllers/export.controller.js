const ExportTemplate = require('../models/ExportTemplate.model');
const ExportHistory = require('../models/ExportHistory.model');
const ExportSchedule = require('../models/ExportSchedule.model');
const exportService = require('../services/export.service');
const emailService = require('../services/email.service');
const logger = require('../config/logger');

class ExportController {
  /**
   * Send email export
   */
  async sendEmailExport(req, res) {
    try {
      const { module, format, recipients, subject, message, includeCharts, data, columns, templateId } = req.body;
      const userId = req.user?.id || null;

      // Initialize email service
      emailService.initialize();

      // Create history record
      const historyRecord = await ExportHistory.create({
        type: 'EMAIL',
        module,
        format,
        recipients,
        status: 'IN_PROGRESS',
        executedBy: req.user?.name || 'Admin',
        userId
      });

      try {
        // Generate export file
        const exportData = (data && data.length) ? data : await exportService.getModuleData(module);
        const exportColumns = (columns && columns.length)
          ? columns
          : await exportService.getColumns(module, templateId);

        let fileResult;
        if (format === 'EXCEL') {
          fileResult = await exportService.generateExcel(exportData, exportColumns, { module });
        } else if (format === 'PDF') {
          fileResult = await exportService.generatePDF(exportData, exportColumns, { module, title: subject });
        }

        // Send email
        await emailService.sendExportReport({
          recipients,
          subject,
          message,
          filePath: fileResult.filePath,
          fileName: fileResult.fileName,
          module
        });

        // Update history to success
        await ExportHistory.updateStatus(historyRecord.id, 'SUCCESS', {
          recordCount: fileResult.recordCount,
          fileSize: fileResult.fileSize,
          filePath: fileResult.filePath
        });

        logger.info(`Email export sent successfully to ${recipients}`);

        res.status(200).json({
          success: true,
          message: 'Export email sent successfully',
          data: {
            historyId: historyRecord.id,
            fileName: fileResult.fileName,
            recordCount: fileResult.recordCount
          }
        });

        // Clean up file after 24 hours
        setTimeout(async () => {
          await exportService.deleteFile(fileResult.filePath);
        }, 24 * 60 * 60 * 1000);

      } catch (error) {
        // Update history to failed
        await ExportHistory.updateStatus(historyRecord.id, 'FAILED', {
          errorMessage: error.message
        });

        throw error;
      }
    } catch (error) {
      logger.error('Failed to send email export:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send email export',
        error: error.message
      });
    }
  }

  /**
   * Get all export templates
   */
  async getTemplates(req, res) {
    try {
      const userId = req.user?.id || null;
      const templates = await ExportTemplate.findAll(userId);

      res.status(200).json({
        success: true,
        data: templates
      });
    } catch (error) {
      logger.error('Failed to fetch templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch templates',
        error: error.message
      });
    }
  }

  /**
   * Create export template
   */
  async createTemplate(req, res) {
    try {
      const { name, module, columns, filters, isDefault } = req.body;
      const userId = req.user?.id || null;

      const template = await ExportTemplate.create({
        name,
        module,
        columns,
        filters,
        isDefault,
        createdBy: userId
      });

      res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: template
      });
    } catch (error) {
      logger.error('Failed to create template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create template',
        error: error.message
      });
    }
  }

  /**
   * Update export template
   */
  async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const { name, columns, filters, isDefault } = req.body;

      const template = await ExportTemplate.update(id, {
        name,
        columns,
        filters,
        isDefault
      });

      res.status(200).json({
        success: true,
        message: 'Template updated successfully',
        data: template
      });
    } catch (error) {
      logger.error('Failed to update template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update template',
        error: error.message
      });
    }
  }

  /**
   * Set template as default
   */
  async setDefaultTemplate(req, res) {
    try {
      const { id } = req.params;

      const template = await ExportTemplate.setDefault(id);

      res.status(200).json({
        success: true,
        message: 'Default template set successfully',
        data: template
      });
    } catch (error) {
      logger.error('Failed to set default template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to set default template',
        error: error.message
      });
    }
  }

  /**
   * Delete export template
   */
  async deleteTemplate(req, res) {
    try {
      const { id } = req.params;

      const deleted = await ExportTemplate.delete(id);

      if (deleted) {
        res.status(200).json({
          success: true,
          message: 'Template deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }
    } catch (error) {
      logger.error('Failed to delete template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete template',
        error: error.message
      });
    }
  }

  /**
   * Get all export schedules
   */
  async getSchedules(req, res) {
    try {
      const userId = req.user?.id || null;
      const schedules = await ExportSchedule.findAll({ userId });

      res.status(200).json({
        success: true,
        data: schedules
      });
    } catch (error) {
      logger.error('Failed to fetch schedules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch schedules',
        error: error.message
      });
    }
  }

  /**
   * Create export schedule
   */
  async createSchedule(req, res) {
    try {
      const { name, module, frequency, time, format, recipients, templateId, status } = req.body;
      const userId = req.user?.id || null;

      const schedule = await ExportSchedule.create({
        name,
        module,
        frequency,
        time,
        format,
        recipients,
        templateId,
        status,
        createdBy: userId
      });

      res.status(201).json({
        success: true,
        message: 'Schedule created successfully',
        data: schedule
      });
    } catch (error) {
      logger.error('Failed to create schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create schedule',
        error: error.message
      });
    }
  }

  /**
   * Update export schedule
   */
  async updateSchedule(req, res) {
    try {
      const { id } = req.params;
      const { name, frequency, time, format, recipients, templateId, status } = req.body;

      const schedule = await ExportSchedule.update(id, {
        name,
        frequency,
        time,
        format,
        recipients,
        templateId,
        status
      });

      res.status(200).json({
        success: true,
        message: 'Schedule updated successfully',
        data: schedule
      });
    } catch (error) {
      logger.error('Failed to update schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update schedule',
        error: error.message
      });
    }
  }

  /**
   * Toggle schedule status
   */
  async toggleScheduleStatus(req, res) {
    try {
      const { id } = req.params;

      const schedule = await ExportSchedule.toggleStatus(id);

      res.status(200).json({
        success: true,
        message: 'Schedule status toggled successfully',
        data: schedule
      });
    } catch (error) {
      logger.error('Failed to toggle schedule status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle schedule status',
        error: error.message
      });
    }
  }

  /**
   * Delete export schedule
   */
  async deleteSchedule(req, res) {
    try {
      const { id } = req.params;

      const deleted = await ExportSchedule.delete(id);

      if (deleted) {
        res.status(200).json({
          success: true,
          message: 'Schedule deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Schedule not found'
        });
      }
    } catch (error) {
      logger.error('Failed to delete schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete schedule',
        error: error.message
      });
    }
  }

  /**
   * Get export history
   */
  async getHistory(req, res) {
    try {
      const { type, module, status, limit } = req.query;
      const userId = req.user?.id || null;

      const history = await ExportHistory.findAll({
        type,
        module,
        status,
        userId,
        limit: limit || 100
      });

      res.status(200).json({
        success: true,
        data: history
      });
    } catch (error) {
      logger.error('Failed to fetch export history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch export history',
        error: error.message
      });
    }
  }

  /**
   * Download export file
   */
  async downloadExport(req, res) {
    try {
      const { id } = req.params;

      const record = await ExportHistory.findById(id);

      if (!record) {
        return res.status(404).json({
          success: false,
          message: 'Export record not found'
        });
      }

      if (!record.file_path) {
        return res.status(404).json({
          success: false,
          message: 'Export file not found'
        });
      }

      res.download(record.file_path);
    } catch (error) {
      logger.error('Failed to download export:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download export',
        error: error.message
      });
    }
  }

  /**
   * Get export statistics
   */
  async getStatistics(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const stats = await ExportHistory.getStatistics({
        startDate,
        endDate
      });

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Failed to fetch statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
        error: error.message
      });
    }
  }
}

module.exports = new ExportController();
