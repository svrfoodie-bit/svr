const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const customerController = require('../controllers/customer.controller');
const { WorkerController, DailyWorkController } = require('../controllers/worker.controller');
const rawPurchaseController = require('../controllers/rawPurchase.controller');
const rawPurchasePaymentController = require('../controllers/rawPurchasePayment.controller');
const { JobWorkController, ProcessingBatchController } = require('../controllers/batch.controller');
const jobWorkPaymentController = require('../controllers/jobWorkPayment.controller');
const { SalesOrderController, SalesPaymentController, ExpenseController } = require('../controllers/sales.controller');
const { FinishedGoodsStockController, WorkerAdvanceController, SupplierController } = require('../controllers/inventory.controller');
const { LeadController, LeadCampaignController, LeadTemplateController } = require('../controllers/lead.controller');
const { generateSQLBackup } = require('../controllers/backup.controller');
const { getSettings, saveSection } = require('../controllers/settings.controller');
const { getTodayStats } = require('../controllers/dashboard.controller');
const { globalSearch } = require('../controllers/search.controller');
const { getAuditLogs, getAuditSummary } = require('../controllers/auditLog.controller');
const { autoAudit } = require('../middleware/auditMiddleware');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const loanController = require('../controllers/loan.controller');
const gradeController = require('../controllers/grade.controller');
const attendanceController = require('../controllers/attendance.controller');
const ledgerController = require('../controllers/ledger.controller');
const gstController = require('../controllers/gst.controller');
const seasonController = require('../controllers/season.controller');
const balanceSheetController = require('../controllers/balanceSheet.controller');
const fixedAssetController   = require('../controllers/fixedAsset.controller');
const automationController   = require('../controllers/automation.controller');
const router = express.Router();

// Shared: validates amount is a positive number, regardless of whether the
// client sent it as `amount` or `paidAmount` (both are accepted by the
// raw-purchase/job-work payment controllers).
const paymentAmountValidator = body().custom((_, { req }) => {
  const amount = parseFloat(req.body.amount ?? req.body.paidAmount);
  if (!amount || amount <= 0) {
    throw new Error('Payment amount must be greater than 0');
  }
  return true;
});

// ==================== DASHBOARD ROUTES ====================
router.get('/dashboard/today', authenticate, getTodayStats);

// ==================== GLOBAL SEARCH ====================
router.get('/search', authenticate, globalSearch);

// ==================== AUDIT LOGS ====================
router.get('/audit-logs', authenticate, getAuditLogs);
router.get('/audit-logs/summary', authenticate, getAuditSummary);

// ==================== AUTH ROUTES ====================
router.post('/auth/login', [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
], validate, authController.login);

router.post('/auth/logout', authenticate, authController.logout);
router.get('/auth/me', authenticate, authController.getCurrentUser);
router.put('/auth/change-password', authenticate, [
  body('oldPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], validate, authController.changePassword);

// ==================== CUSTOMER ROUTES ====================
const customerValidators = [
  body('name').trim().notEmpty().withMessage('Customer name is required').isLength({ max: 100 }).withMessage('Name must be under 100 characters'),
  body('type').notEmpty().withMessage('Customer type is required').isIn(['Retail', 'Wholesale']).withMessage('Invalid customer type'),
  body('contactNumber').trim().notEmpty().withMessage('Contact number is required').matches(/^[0-9]{10}$/).withMessage('Contact number must be exactly 10 digits'),
  body('area').trim().notEmpty().withMessage('Area is required'),
];
router.get('/customers', authenticate, customerController.getAll);
router.get('/customers/:id', authenticate, customerController.getById);
router.post('/customers', authenticate, customerValidators, validate, customerController.create);
router.put('/customers/:id', authenticate, customerValidators, validate, customerController.update);
router.delete('/customers/:id', authenticate, customerController.delete);
router.put('/customers/:id/restore', authenticate, customerController.restore);
router.get('/customers/outstanding/list', authenticate, customerController.getOutstanding);

// ==================== RAW PURCHASE ROUTES ====================
const rawPurchaseValidators = [
  body('purchaseDate').notEmpty().withMessage('Purchase date is required').isISO8601().withMessage('Invalid date format'),
  body('supplierId').notEmpty().withMessage('Supplier is required').isInt({ min: 1 }).withMessage('Invalid supplier'),
  body('rawQuality').notEmpty().withMessage('Quality is required'),
  body('quantityKg').notEmpty().withMessage('Quantity is required').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  body('pricePerKg').notEmpty().withMessage('Price is required').isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
];
router.get('/raw-purchases', authenticate, rawPurchaseController.getAll);
router.get('/raw-purchases/:id', authenticate, rawPurchaseController.getById);
router.post('/raw-purchases', authenticate, rawPurchaseValidators, validate, autoAudit('raw_purchases'), rawPurchaseController.create);
router.put('/raw-purchases/:id', authenticate, rawPurchaseValidators, validate, autoAudit('raw_purchases'), rawPurchaseController.update);
router.delete('/raw-purchases/:id', authenticate, autoAudit('raw_purchases'), rawPurchaseController.delete);
router.get('/raw-purchases/summary/metrics', authenticate, rawPurchaseController.getSummary);

// ==================== RAW PURCHASE PAYMENT ROUTES ====================
const rawPurchasePaymentValidators = [
  body('rawPurchaseId').notEmpty().withMessage('Raw purchase is required').isInt({ min: 1 }).withMessage('Invalid raw purchase'),
  body('paymentDate').notEmpty().withMessage('Payment date is required').isISO8601().withMessage('Invalid date format'),
  body('paymentMode').notEmpty().withMessage('Payment mode is required'),
  paymentAmountValidator,
];
router.get('/raw-purchase-payments', authenticate, rawPurchasePaymentController.getAll);
router.get('/raw-purchase-payments/:id', authenticate, rawPurchasePaymentController.getById);
router.post('/raw-purchase-payments', authenticate, rawPurchasePaymentValidators, validate, rawPurchasePaymentController.create);
router.put('/raw-purchase-payments/:id', authenticate, rawPurchasePaymentController.update);
router.delete('/raw-purchase-payments/:id', authenticate, rawPurchasePaymentController.delete);
router.get('/raw-purchases/:rawPurchaseId/payments', authenticate, rawPurchasePaymentController.getByRawPurchaseId);
router.get('/raw-purchase-payments/summary/metrics', authenticate, rawPurchasePaymentController.getSummary);

// ==================== SUPPLIER ROUTES ====================
const supplierValidators = [
  body('name').trim().notEmpty().withMessage('Supplier name is required').isLength({ max: 100 }).withMessage('Name must be under 100 characters'),
  body('contact').optional({ checkFalsy: true }).matches(/^[0-9]{10}$/).withMessage('Contact number must be exactly 10 digits'),
  body('location').optional({ checkFalsy: true }).trim().isLength({ max: 200 }),
];
router.get('/suppliers', authenticate, SupplierController.getAll);
router.get('/suppliers/:id', authenticate, SupplierController.getById);
router.post('/suppliers', authenticate, supplierValidators, validate, SupplierController.create);
router.put('/suppliers/:id', authenticate, supplierValidators, validate, SupplierController.update);
router.delete('/suppliers/:id', authenticate, SupplierController.delete);
router.put('/suppliers/:id/restore', authenticate, SupplierController.restore);
router.get('/suppliers/summary/metrics', authenticate, SupplierController.getSummary);

// ==================== WORKER ROUTES ====================
const workerCreateValidators = [
  body('name').trim().notEmpty().withMessage('Worker name is required').isLength({ max: 100 }).withMessage('Name must be under 100 characters'),
  body('contact').optional({ checkFalsy: true }).matches(/^[0-9]{10}$/).withMessage('Contact number must be exactly 10 digits'),
  body('dailyWage').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Daily wage must be a positive number'),
];
const workerUpdateValidators = [
  body('name').optional().trim().notEmpty().withMessage('Worker name is required').isLength({ max: 100 }).withMessage('Name must be under 100 characters'),
  body('contact').optional({ checkFalsy: true }).matches(/^[0-9]{10}$/).withMessage('Contact number must be exactly 10 digits'),
  body('dailyWage').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Daily wage must be a positive number'),
];
router.get('/workers', authenticate, WorkerController.getAll);
router.get('/workers/active', authenticate, WorkerController.getActive);
router.get('/workers/:id', authenticate, WorkerController.getById);
router.post('/workers', authenticate, workerCreateValidators, validate, WorkerController.create);
router.put('/workers/:id', authenticate, workerUpdateValidators, validate, WorkerController.update);
router.delete('/workers/:id', authenticate, WorkerController.delete);

// ==================== DAILY WORK ROUTES ====================
router.get('/daily-work', authenticate, DailyWorkController.getAll);
router.get('/daily-work/:id', authenticate, DailyWorkController.getById);
router.post('/daily-work', authenticate, DailyWorkController.create);
router.put('/daily-work/:id', authenticate, DailyWorkController.update);
router.delete('/daily-work/:id', authenticate, DailyWorkController.delete);
router.get('/daily-work/summary/metrics', authenticate, DailyWorkController.getSummary);
router.get('/daily-work/types/list', authenticate, DailyWorkController.getWorkTypes);

// ==================== JOB WORK ROUTES ====================
router.get('/job-work', authenticate, JobWorkController.getAll);
router.get('/job-work/:id', authenticate, JobWorkController.getById);
router.post('/job-work', authenticate, autoAudit('job_work'), JobWorkController.create);
router.put('/job-work/:id', authenticate, autoAudit('job_work'), JobWorkController.update);
router.delete('/job-work/:id', authenticate, autoAudit('job_work'), JobWorkController.delete);
router.get('/job-work/summary/metrics', authenticate, JobWorkController.getSummary);

// ==================== JOB WORK PAYMENT ROUTES ====================
const jobWorkPaymentValidators = [
  body('jobWorkId').notEmpty().withMessage('Job work is required').isInt({ min: 1 }).withMessage('Invalid job work'),
  body('paymentDate').notEmpty().withMessage('Payment date is required').isISO8601().withMessage('Invalid date format'),
  body('paymentMode').notEmpty().withMessage('Payment mode is required'),
  paymentAmountValidator,
];
router.get('/job-work-payments', authenticate, jobWorkPaymentController.getAll);
router.get('/job-work-payments/:id', authenticate, jobWorkPaymentController.getById);
router.post('/job-work-payments', authenticate, jobWorkPaymentValidators, validate, jobWorkPaymentController.create);
router.put('/job-work-payments/:id', authenticate, jobWorkPaymentController.update);
router.delete('/job-work-payments/:id', authenticate, jobWorkPaymentController.delete);
router.get('/job-work/:jobWorkId/payments', authenticate, jobWorkPaymentController.getByJobWorkId);
router.get('/job-work-payments/summary/metrics', authenticate, jobWorkPaymentController.getSummary);

// ==================== PROCESSING BATCH ROUTES ====================
router.get('/batches', authenticate, ProcessingBatchController.getAll);
router.get('/batches/:id', authenticate, ProcessingBatchController.getById);
router.post('/batches', authenticate, ProcessingBatchController.create);
router.put('/batches/:id', authenticate, ProcessingBatchController.update);
router.delete('/batches/:id', authenticate, ProcessingBatchController.delete);
router.get('/batches/summary/metrics', authenticate, ProcessingBatchController.getSummary);
router.get('/batches/grades/list', authenticate, ProcessingBatchController.getGrades);

// ==================== FINISHED GOODS STOCK ROUTES ====================
router.get('/finished-goods', authenticate, FinishedGoodsStockController.getAll);
router.get('/finished-goods/summary', authenticate, FinishedGoodsStockController.getSummary);
router.get('/finished-goods/adjustments', authenticate, FinishedGoodsStockController.getAdjustments);
router.get('/finished-goods/:grade/stock', authenticate, FinishedGoodsStockController.getGradeStock);
router.post('/finished-goods', authenticate, FinishedGoodsStockController.addStock);
router.post('/finished-goods/adjustment', authenticate, FinishedGoodsStockController.recordAdjustment);

// ==================== SALES ORDER ROUTES ====================
router.get('/sales-orders', authenticate, SalesOrderController.getAll);
router.get('/sales-orders/:id', authenticate, SalesOrderController.getById);
router.post('/sales-orders', authenticate, autoAudit('sales_orders', (req, body) => body.data?.orderNumber), SalesOrderController.create);
router.put('/sales-orders/:id', authenticate, autoAudit('sales_orders', (req, body) => body.data?.orderNumber), SalesOrderController.update);
router.delete('/sales-orders/:id', authenticate, autoAudit('sales_orders'), SalesOrderController.delete);
router.get('/sales-orders/outstanding/list', authenticate, SalesOrderController.getOutstanding);
router.get('/sales-orders/customer-wise/summary', authenticate, SalesOrderController.getCustomerWiseSummary);
router.get('/sales-orders/grade-wise/summary', authenticate, SalesOrderController.getGradeWiseSummary);
router.get('/sales-orders/summary/metrics', authenticate, SalesOrderController.getSummary);

// ==================== SALES PAYMENT ROUTES ====================
const salesPaymentValidators = [
  body().custom((_, { req }) => {
    if (!req.body.salesOrderId && !req.body.orderId) {
      throw new Error('Sales order is required');
    }
    if (!req.body.paymentDate && !req.body.date) {
      throw new Error('Payment date is required');
    }
    return true;
  }),
  body('paymentMode').notEmpty().withMessage('Payment mode is required'),
  paymentAmountValidator,
];
router.get('/sales-payments', authenticate, SalesPaymentController.getAll);
router.get('/sales-payments/:id', authenticate, SalesPaymentController.getById);
router.post('/sales-payments', authenticate, salesPaymentValidators, validate, SalesPaymentController.create);
router.delete('/sales-payments/:id', authenticate, SalesPaymentController.delete);
router.get('/sales-payments/summary/metrics', authenticate, SalesPaymentController.getSummary);

// ==================== EXPENSE ROUTES ====================
router.get('/expenses', authenticate, ExpenseController.getAll);
router.get('/expenses/:id', authenticate, ExpenseController.getById);
router.post('/expenses', authenticate, autoAudit('expenses', (req, body) => body.data?.category || body.data?.description), ExpenseController.create);
router.put('/expenses/:id', authenticate, autoAudit('expenses', (req, body) => body.data?.category || body.data?.description), ExpenseController.update);
router.delete('/expenses/:id', authenticate, autoAudit('expenses'), ExpenseController.delete);
router.get('/expenses/category-wise/summary', authenticate, ExpenseController.getCategoryWiseSummary);
router.get('/expenses/payment-mode-wise/summary', authenticate, ExpenseController.getPaymentModeWiseSummary);
router.get('/expenses/summary/metrics', authenticate, ExpenseController.getSummaryMetrics);
router.get('/expenses/categories/list', authenticate, ExpenseController.getCategories);

// ==================== WORKER ADVANCE ROUTES ====================
router.get('/worker-advances', authenticate, WorkerAdvanceController.getAll);
router.get('/worker-advances/:id', authenticate, WorkerAdvanceController.getById);
router.post('/worker-advances', authenticate, WorkerAdvanceController.create);
router.put('/worker-advances/:id', authenticate, WorkerAdvanceController.update);
router.delete('/worker-advances/:id', authenticate, WorkerAdvanceController.delete);
router.get('/worker-advances/worker/:workerId/outstanding', authenticate, WorkerAdvanceController.getWorkerOutstanding);

// ==================== SETTINGS ROUTES ====================
router.get('/settings', authenticate, getSettings);
router.put('/settings/:section', authenticate, saveSection);

// ==================== BACKUP ROUTES ====================
router.get('/backup/sql', authenticate, generateSQLBackup);

// ==================== LEAD ROUTES ====================
router.get('/leads', authenticate, LeadController.getAll);
router.get('/leads/:id', authenticate, LeadController.getById);
router.post('/leads', authenticate, LeadController.create);
router.put('/leads/:id', authenticate, LeadController.update);
router.delete('/leads/:id', authenticate, LeadController.delete);
router.post('/leads/bulk-delete', authenticate, LeadController.deleteMany);
router.post('/leads/bulk-import', authenticate, LeadController.bulkCreate);
router.post('/leads/mark-sent', authenticate, LeadController.markSent);
router.delete('/leads/clear-all', authenticate, LeadController.clearAll);

// ==================== LEAD CAMPAIGN ROUTES ====================
router.get('/lead-campaigns', authenticate, LeadCampaignController.getAll);
router.post('/lead-campaigns', authenticate, LeadCampaignController.create);
router.put('/lead-campaigns/:id/mark-sent', authenticate, LeadCampaignController.markSent);
router.delete('/lead-campaigns/:id', authenticate, LeadCampaignController.delete);

// ==================== LEAD TEMPLATE ROUTES ====================
router.get('/lead-templates', authenticate, LeadTemplateController.getAll);
router.post('/lead-templates', authenticate, LeadTemplateController.create);
router.delete('/lead-templates/:id', authenticate, LeadTemplateController.delete);

// ==================== LOAN ROUTES ====================
router.get('/loans/dashboard', authenticate, loanController.getLoanDashboard);
router.get('/loans', authenticate, loanController.getAllLoans);
router.get('/loans/:id', authenticate, loanController.getLoanById);
router.post('/loans', authenticate, loanController.createLoan);
router.put('/loans/:id', authenticate, loanController.updateLoan);
router.delete('/loans/:id', authenticate, loanController.deleteLoan);

// ==================== LOAN PAYMENT ROUTES ====================
router.get('/loan-payments', authenticate, loanController.getAllPayments);
router.get('/loan-payments/interest-burden', authenticate, loanController.getMonthlyInterestBurden);
router.get('/loan-payments/loan/:loanId', authenticate, loanController.getPaymentsByLoan);
const loanPaymentValidators = [
  body('loanId').notEmpty().withMessage('Loan is required').isInt({ min: 1 }).withMessage('Invalid loan'),
  body('paymentDate').notEmpty().withMessage('Payment date is required').isISO8601().withMessage('Invalid date format'),
  body('paymentType').notEmpty().withMessage('Payment type is required')
    .isIn(['EMI', 'InterestOnly', 'PrincipalOnly', 'Prepayment', 'FullSettlement']).withMessage('Invalid payment type'),
  body().custom((_, { req }) => {
    const principal = parseFloat(req.body.principalAmount) || 0;
    const interest = parseFloat(req.body.interestAmount) || 0;
    if (principal + interest <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }
    return true;
  }),
];
router.post('/loan-payments', authenticate, loanPaymentValidators, validate, loanController.createPayment);
router.delete('/loan-payments/:id', authenticate, loanController.deletePayment);

// ==================== CAPITAL INVESTMENT ROUTES ====================
router.get('/capital-investments', authenticate, loanController.getAllCapital);
router.get('/capital-investments/:id', authenticate, loanController.getCapitalById);
router.post('/capital-investments', authenticate, loanController.createCapital);
router.put('/capital-investments/:id', authenticate, loanController.updateCapital);
router.delete('/capital-investments/:id', authenticate, loanController.deleteCapital);

// ==================== ATTENDANCE ROUTES ====================
router.get('/attendance', authenticate, attendanceController.getByDate);
router.get('/attendance/monthly-summary', authenticate, attendanceController.getMonthlySummary);
router.get('/attendance/worker/:workerId', authenticate, attendanceController.getByWorker);
router.post('/attendance', authenticate, attendanceController.markAttendance);
router.delete('/attendance/:id', authenticate, attendanceController.deleteAttendance);

// ==================== PAYROLL ROUTES ====================
router.get('/payroll', authenticate, attendanceController.getMonthlyPayroll);
router.get('/payroll/worker/:workerId', authenticate, attendanceController.getWorkerPayroll);
router.post('/payroll/generate', authenticate, attendanceController.generatePayroll);
router.post('/payroll', authenticate, attendanceController.savePayroll);
router.get('/payroll/:id', authenticate, attendanceController.getPayrollById);
router.put('/payroll/:id/mark-paid', authenticate, attendanceController.markAsPaid);

// ==================== LEDGER ROUTES ====================
router.get('/ledger/customers/outstanding', authenticate, ledgerController.getAllCustomersOutstanding);
router.get('/ledger/suppliers/outstanding', authenticate, ledgerController.getAllSuppliersOutstanding);
router.get('/ledger/customer/:customerId', authenticate, ledgerController.getCustomerLedger);
router.get('/ledger/supplier/:supplierId', authenticate, ledgerController.getSupplierLedger);

// ==================== ACCOUNTING SUMMARY ROUTES ====================
router.get('/accounting/debtors',         authenticate, ledgerController.getDebtorsAging);
router.get('/accounting/vendors-payable', authenticate, ledgerController.getVendorsPayableAging);

// ==================== GST ROUTES ====================
router.get('/gst/output-tax', authenticate, gstController.getOutputTax);
router.get('/gst/input-tax-credit', authenticate, gstController.getInputTaxCredit);
router.get('/gst/gstr3b', authenticate, gstController.getGSTR3BSummary);
router.get('/gst/hsn-summary', authenticate, gstController.getHSNSummary);
router.get('/gst/invoice/:id', authenticate, gstController.getInvoice);

// ==================== SEASON PLANNING ROUTES ====================
router.get('/seasons', authenticate, seasonController.getAll);
router.get('/seasons/:id', authenticate, seasonController.getById);
router.post('/seasons', authenticate, seasonController.create);
router.put('/seasons/:id', authenticate, seasonController.update);
router.delete('/seasons/:id', authenticate, seasonController.delete);

// ==================== FIXED ASSETS ROUTES ====================
router.get('/fixed-assets/summary', authenticate, fixedAssetController.getSummary);
router.get('/fixed-assets',         authenticate, fixedAssetController.getAll);
router.get('/fixed-assets/:id',     authenticate, fixedAssetController.getById);
router.post('/fixed-assets',        authenticate, fixedAssetController.create);
router.put('/fixed-assets/:id',     authenticate, fixedAssetController.update);
router.delete('/fixed-assets/:id',  authenticate, fixedAssetController.remove);

// ==================== BALANCE SHEET ROUTES ====================
router.get('/balance-sheet', authenticate, balanceSheetController.getBalanceSheet);

// ==================== GRADE PRICE ROUTES ====================
router.get('/grades', authenticate, gradeController.getAll);
router.get('/grades/stock-summary', authenticate, gradeController.getStockSummary);
router.get('/grades/sales-summary', authenticate, gradeController.getSalesSummary);
router.get('/grades/:id', authenticate, gradeController.getById);
router.put('/grades/:id', authenticate, gradeController.update);

// ==================== AUTOMATION ROUTES ====================
router.get('/automation/settings',              authenticate, automationController.getSettings);
router.post('/automation/settings',             authenticate, automationController.saveSettings);
router.get('/automation/logs',                  authenticate, automationController.getLogs);
router.get('/automation/status',                authenticate, automationController.getStatus);
router.post('/automation/trigger/:jobType',     authenticate, automationController.triggerJob);
router.post('/automation/test-notification',    authenticate, automationController.testNotification);
router.get('/automation/gst-snapshot',          authenticate, automationController.getLatestGST);

module.exports = router;
