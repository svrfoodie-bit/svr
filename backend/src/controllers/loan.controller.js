const Loan = require('../models/Loan.model');
const LoanPayment = require('../models/LoanPayment.model');
const Capital = require('../models/Capital.model');
const Expense = require('../models/Expense.model');

// Ensure tables exist on first use
const initTables = async () => {
  await Loan.createTable();
  await LoanPayment.createTable();
  await Capital.createTable();
};
initTables().catch(console.error);

// ==================== LOANS ====================

exports.getAllLoans = async (req, res) => {
  try {
    const loans = await Loan.getAll(req.query);
    // Attach outstanding balance to each loan
    const withBalance = await Promise.all(
      loans.map(async (loan) => {
        const outstanding = await Loan.getOutstandingBalance(loan.id);
        return { ...loan, outstandingBalance: outstanding };
      })
    );
    res.json({ success: true, data: withBalance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch loans' });
  }
};

exports.getLoanById = async (req, res) => {
  try {
    const loan = await Loan.getById(req.params.id);
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
    const outstanding = await Loan.getOutstandingBalance(loan.id);
    const payments = await LoanPayment.getByLoan(loan.id);
    res.json({ success: true, data: { ...loan, outstandingBalance: outstanding, payments } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch loan' });
  }
};

exports.createLoan = async (req, res) => {
  try {
    const id = await Loan.create({ ...req.body, createdBy: req.user?.id || 1 });
    const loan = await Loan.getById(id);
    res.status(201).json({ success: true, data: loan, message: 'Loan created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create loan' });
  }
};

exports.updateLoan = async (req, res) => {
  try {
    const updated = await Loan.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Loan not found' });
    const loan = await Loan.getById(req.params.id);
    res.json({ success: true, data: loan, message: 'Loan updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update loan' });
  }
};

exports.deleteLoan = async (req, res) => {
  try {
    const deleted = await Loan.delete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Loan not found' });
    res.json({ success: true, message: 'Loan deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete loan' });
  }
};

// ==================== LOAN PAYMENTS ====================

exports.getPaymentsByLoan = async (req, res) => {
  try {
    const payments = await LoanPayment.getByLoan(req.params.loanId);
    res.json({ success: true, data: payments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch payments' });
  }
};

exports.getAllPayments = async (req, res) => {
  try {
    const payments = await LoanPayment.getAll(req.query);
    res.json({ success: true, data: payments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch payments' });
  }
};

exports.createPayment = async (req, res) => {
  try {
    // Validate loan exists and is active
    const loan = await Loan.getById(req.body.loanId);
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
    if (loan.status === 'Closed') {
      return res.status(400).json({ success: false, message: 'Cannot add payment to a closed loan' });
    }

    const id = await LoanPayment.create({ ...req.body, createdBy: req.user?.id || 1 });
    const payment = await LoanPayment.getById(id);

    // Auto-create expense entry for interest portion so it flows into P&L
    const interestAmt = parseFloat(req.body.interestAmount) || 0;
    if (interestAmt > 0) {
      try {
        await Expense.create({
          category: 'Loan Interest',
          description: `Loan Interest — ${loan.loanCode} (${loan.lenderName})`,
          amount: interestAmt,
          paymentMode: req.body.paymentMode || 'Cash',
          date: req.body.paymentDate,
          paidTo: loan.lenderName,
          notes: `Auto-created from loan repayment. Loan: ${loan.loanCode}`,
          createdBy: req.user?.id || 1,
        });
      } catch (expErr) {
        // Log but don't fail the payment if expense creation fails
        console.error('Auto-expense creation failed:', expErr.message);
      }
    }

    res.status(201).json({ success: true, data: payment, message: 'Payment recorded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to record payment' });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const deleted = await LoanPayment.delete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete payment' });
  }
};

exports.getMonthlyInterestBurden = async (req, res) => {
  try {
    const data = await LoanPayment.getMonthlyInterestBurden();
    const total = data.reduce((sum, l) => sum + l.monthlyInterest, 0);
    res.json({ success: true, data: { loans: data, totalMonthlyInterest: parseFloat(total.toFixed(2)) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to calculate interest burden' });
  }
};

// ==================== CAPITAL INVESTMENTS ====================

exports.getAllCapital = async (req, res) => {
  try {
    const investments = await Capital.getAll();
    res.json({ success: true, data: investments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch capital investments' });
  }
};

exports.getCapitalById = async (req, res) => {
  try {
    const item = await Capital.getById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Investment not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch investment' });
  }
};

exports.createCapital = async (req, res) => {
  try {
    const id = await Capital.create({ ...req.body, createdBy: req.user?.id || 1 });
    const item = await Capital.getById(id);
    res.status(201).json({ success: true, data: item, message: 'Capital investment recorded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to record capital investment' });
  }
};

exports.updateCapital = async (req, res) => {
  try {
    const updated = await Capital.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Investment not found' });
    const item = await Capital.getById(req.params.id);
    res.json({ success: true, data: item, message: 'Capital investment updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update investment' });
  }
};

exports.deleteCapital = async (req, res) => {
  try {
    const deleted = await Capital.delete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Investment not found' });
    res.json({ success: true, message: 'Investment deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete investment' });
  }
};

// ==================== DASHBOARD ====================

exports.getLoanDashboard = async (req, res) => {
  try {
    const [metrics, interestBurden] = await Promise.all([
      Loan.getDashboardMetrics(),
      LoanPayment.getMonthlyInterestBurden(),
    ]);
    const totalMonthlyInterest = interestBurden.reduce((s, l) => s + l.monthlyInterest, 0);
    res.json({
      success: true,
      data: {
        ...metrics,
        totalMonthlyInterest: parseFloat(totalMonthlyInterest.toFixed(2)),
        interestBreakdown: interestBurden,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to load dashboard' });
  }
};
