const express = require('express');
const router = express.Router();
const exportController = require('../controllers/export.controller');
const { authenticate } = require('../middleware/auth');

/**
 * @route   POST /api/v1/exports/email
 * @desc    Send email export
 * @access  Private
 */
router.post('/email', authenticate, exportController.sendEmailExport);

/**
 * @route   GET /api/v1/exports/templates
 * @desc    Get all export templates
 * @access  Private
 */
router.get('/templates', authenticate, exportController.getTemplates);

/**
 * @route   POST /api/v1/exports/templates
 * @desc    Create export template
 * @access  Private
 */
router.post('/templates', authenticate, exportController.createTemplate);

/**
 * @route   PUT /api/v1/exports/templates/:id
 * @desc    Update export template
 * @access  Private
 */
router.put('/templates/:id', authenticate, exportController.updateTemplate);

/**
 * @route   PUT /api/v1/exports/templates/:id/default
 * @desc    Set template as default
 * @access  Private
 */
router.put('/templates/:id/default', authenticate, exportController.setDefaultTemplate);

/**
 * @route   DELETE /api/v1/exports/templates/:id
 * @desc    Delete export template
 * @access  Private
 */
router.delete('/templates/:id', authenticate, exportController.deleteTemplate);

/**
 * @route   GET /api/v1/exports/schedules
 * @desc    Get all export schedules
 * @access  Private
 */
router.get('/schedules', authenticate, exportController.getSchedules);

/**
 * @route   POST /api/v1/exports/schedules
 * @desc    Create export schedule
 * @access  Private
 */
router.post('/schedules', authenticate, exportController.createSchedule);

/**
 * @route   PUT /api/v1/exports/schedules/:id
 * @desc    Update export schedule
 * @access  Private
 */
router.put('/schedules/:id', authenticate, exportController.updateSchedule);

/**
 * @route   PUT /api/v1/exports/schedules/:id/toggle
 * @desc    Toggle schedule status (Active/Paused)
 * @access  Private
 */
router.put('/schedules/:id/toggle', authenticate, exportController.toggleScheduleStatus);

/**
 * @route   DELETE /api/v1/exports/schedules/:id
 * @desc    Delete export schedule
 * @access  Private
 */
router.delete('/schedules/:id', authenticate, exportController.deleteSchedule);

/**
 * @route   GET /api/v1/exports/history
 * @desc    Get export history
 * @access  Private
 * @query   type, module, status, limit
 */
router.get('/history', authenticate, exportController.getHistory);

/**
 * @route   GET /api/v1/exports/download/:id
 * @desc    Download export file
 * @access  Private
 */
router.get('/download/:id', authenticate, exportController.downloadExport);

/**
 * @route   GET /api/v1/exports/statistics
 * @desc    Get export statistics
 * @access  Private
 * @query   startDate, endDate
 */
router.get('/statistics', authenticate, exportController.getStatistics);

module.exports = router;
