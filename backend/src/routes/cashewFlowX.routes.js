/**
 * CashewFlowX routes — mounted at /api/v1/cashew-flow-x.
 *
 * Independent module: uses only cashew_flow_x_* tables and its own
 * controllers/models. Nothing here is shared with the main business routes.
 */
const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  CashewFlowXCustomerController,
  CashewFlowXCashewTypeController,
  CashewFlowXStockEntryController,
  CashewFlowXPaymentEntryController,
} = require('../controllers/cashewFlowX.controller');
const { CASHEW_FLOW_X_PAYMENT_MODES } = require('../utils/cashewFlowXBalance');

const router = express.Router();
router.use(authenticate);

const STATUSES = ['Active', 'Inactive'];
const optionalText = (field, max, label) =>
  body(field).optional({ nullable: true }).isString().trim()
    .isLength({ max }).withMessage(`${label} must be under ${max} characters`);

// ==================== CUSTOMERS ====================
const customerValidators = [
  body('customerName').trim().notEmpty().withMessage('Customer name is required')
    .isLength({ max: 150 }).withMessage('Customer name must be under 150 characters'),
  body('mobileNumber').optional({ checkFalsy: true }).trim()
    .matches(/^[0-9]{10}$/).withMessage('Mobile number must be exactly 10 digits'),
  optionalText('address', 255, 'Address'),
  optionalText('notes', 2000, 'Notes'),
  body('status').optional().isIn(STATUSES).withMessage('Status must be Active or Inactive'),
];

router.get('/customers', CashewFlowXCustomerController.getAll);
router.get('/customers/:id', CashewFlowXCustomerController.getById);
router.get('/customers/:id/details', CashewFlowXCustomerController.getDetails);
router.post('/customers', customerValidators, validate, CashewFlowXCustomerController.create);
router.put('/customers/:id', customerValidators, validate, CashewFlowXCustomerController.update);
router.patch('/customers/:id/status', [
  body('status').isIn(STATUSES).withMessage('Status must be Active or Inactive'),
], validate, CashewFlowXCustomerController.setStatus);
router.delete('/customers/:id', CashewFlowXCustomerController.delete);

// ==================== CASHEW TYPES ====================
const cashewTypeValidators = [
  body('cashewTypeName').trim().notEmpty().withMessage('Cashew type name is required')
    .isLength({ max: 100 }).withMessage('Cashew type name must be under 100 characters'),
  body('status').optional().isIn(STATUSES).withMessage('Status must be Active or Inactive'),
];

router.get('/cashew-types', CashewFlowXCashewTypeController.getAll);
router.post('/cashew-types', cashewTypeValidators, validate, CashewFlowXCashewTypeController.create);
router.put('/cashew-types/:id', cashewTypeValidators, validate, CashewFlowXCashewTypeController.update);
router.delete('/cashew-types/:id', CashewFlowXCashewTypeController.delete);

// ==================== STOCK ENTRIES ====================
// Total Amount is not accepted from the client; the controller calculates it.
const stockEntryFieldValidators = [
  body('cashewTypeId').notEmpty().withMessage('Cashew type is required')
    .isInt({ min: 1 }).withMessage('Invalid cashew type'),
  body('quantityKg').notEmpty().withMessage('Quantity is required')
    .isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
  body('pricePerKg').notEmpty().withMessage('Price per KG is required')
    .isFloat({ min: 0 }).withMessage('Price per KG must be 0 or greater'),
  body('givenDate').notEmpty().withMessage('Given date is required')
    .isISO8601().withMessage('Invalid given date'),
  optionalText('notes', 2000, 'Notes'),
];
const customerIdValidator = body('customerId').notEmpty().withMessage('Customer is required')
  .isInt({ min: 1 }).withMessage('Invalid customer');

router.post('/stock-entries', [customerIdValidator, ...stockEntryFieldValidators], validate, CashewFlowXStockEntryController.create);
router.put('/stock-entries/:id', stockEntryFieldValidators, validate, CashewFlowXStockEntryController.update);
router.delete('/stock-entries/:id', CashewFlowXStockEntryController.delete);

// ==================== PAYMENT ENTRIES ====================
const paymentEntryFieldValidators = [
  body('paymentAmount').notEmpty().withMessage('Payment amount is required')
    .isFloat({ gt: 0 }).withMessage('Payment amount must be greater than 0'),
  body('paymentDate').notEmpty().withMessage('Payment date is required')
    .isISO8601().withMessage('Invalid payment date'),
  body('paymentMode').notEmpty().withMessage('Payment mode is required')
    .isIn(CASHEW_FLOW_X_PAYMENT_MODES).withMessage('Invalid payment mode'),
  optionalText('referenceNumber', 100, 'Reference number'),
  optionalText('notes', 2000, 'Notes'),
];

router.get('/payment-modes', CashewFlowXPaymentEntryController.getPaymentModes);
router.post('/payment-entries', [customerIdValidator, ...paymentEntryFieldValidators], validate, CashewFlowXPaymentEntryController.create);
router.put('/payment-entries/:id', paymentEntryFieldValidators, validate, CashewFlowXPaymentEntryController.update);
router.delete('/payment-entries/:id', CashewFlowXPaymentEntryController.delete);

module.exports = router;
