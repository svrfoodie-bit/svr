const { promisePool } = require('../config/database');

class Loan {
  static async generateLoanCode() {
    const [rows] = await promisePool.query('SELECT COUNT(*) as count FROM loans');
    return `LOAN-${String(rows[0].count + 1).padStart(4, '0')}`;
  }

  static async createTable() {
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS loans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        loanCode VARCHAR(20) UNIQUE NOT NULL,
        loanType ENUM('Bank','Hand') NOT NULL,
        lenderName VARCHAR(100) NOT NULL,
        lenderPhone VARCHAR(15),
        principalAmount DECIMAL(12,2) NOT NULL,
        interestRate DECIMAL(5,2) NOT NULL,
        interestPaymentType ENUM('Monthly','EndOfTerm') NOT NULL DEFAULT 'Monthly',
        repaymentType ENUM('EMI','Custom') NOT NULL DEFAULT 'Custom',
        tenureMonths INT,
        startDate DATE NOT NULL,
        purpose VARCHAR(200),
        bankAccountNo VARCHAR(30),
        status ENUM('Active','Closed') NOT NULL DEFAULT 'Active',
        notes TEXT,
        createdBy INT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  }

  static async create(data) {
    const loanCode = await Loan.generateLoanCode();
    const [result] = await promisePool.query(
      `INSERT INTO loans
        (loanCode, loanType, lenderName, lenderPhone, principalAmount, interestRate,
         interestPaymentType, repaymentType, tenureMonths, startDate, purpose,
         bankAccountNo, status, notes, createdBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?)`,
      [
        loanCode,
        data.loanType,
        data.lenderName,
        data.lenderPhone || null,
        data.principalAmount,
        data.interestRate,
        data.interestPaymentType || 'Monthly',
        data.repaymentType || 'Custom',
        data.tenureMonths || null,
        data.startDate,
        data.purpose || null,
        data.bankAccountNo || null,
        data.notes || null,
        data.createdBy || 1,
      ]
    );
    return result.insertId;
  }

  static async getAll(filters = {}) {
    let query = 'SELECT * FROM loans WHERE 1=1';
    const params = [];

    if (filters.loanType) {
      query += ' AND loanType = ?';
      params.push(filters.loanType);
    }
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY createdAt DESC';
    const [rows] = await promisePool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const [rows] = await promisePool.query('SELECT * FROM loans WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async update(id, data) {
    const updates = [];
    const params = [];

    const allowed = [
      'lenderName', 'lenderPhone', 'interestRate', 'interestPaymentType',
      'repaymentType', 'tenureMonths', 'purpose', 'bankAccountNo', 'status', 'notes'
    ];
    allowed.forEach((key) => {
      if (data[key] !== undefined) {
        updates.push(`${key} = ?`);
        params.push(data[key]);
      }
    });

    if (updates.length === 0) return false;
    params.push(id);
    const [result] = await promisePool.query(
      `UPDATE loans SET ${updates.join(', ')}, updatedAt = NOW() WHERE id = ?`,
      params
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await promisePool.query('DELETE FROM loans WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // Outstanding balance for one loan = principal - total principal paid
  static async getOutstandingBalance(loanId) {
    const [loan] = await promisePool.query('SELECT principalAmount FROM loans WHERE id = ?', [loanId]);
    if (!loan[0]) return null;

    const [paid] = await promisePool.query(
      'SELECT COALESCE(SUM(principalAmount), 0) as totalPrincipalPaid FROM loan_payments WHERE loanId = ?',
      [loanId]
    );

    const outstanding = parseFloat(loan[0].principalAmount) - parseFloat(paid[0].totalPrincipalPaid);
    return Math.max(outstanding, 0);
  }

  // Dashboard summary
  static async getDashboardMetrics() {
    const [loanSummary] = await promisePool.query(`
      SELECT
        COUNT(*) as totalLoans,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as activeLoans,
        SUM(CASE WHEN status = 'Active' AND loanType = 'Bank' THEN principalAmount ELSE 0 END) as totalBankPrincipal,
        SUM(CASE WHEN status = 'Active' AND loanType = 'Hand' THEN principalAmount ELSE 0 END) as totalHandPrincipal
      FROM loans
    `);

    const [paidSummary] = await promisePool.query(`
      SELECT
        COALESCE(SUM(lp.principalAmount), 0) as totalPrincipalPaid,
        COALESCE(SUM(lp.interestAmount), 0) as totalInterestPaid
      FROM loan_payments lp
      JOIN loans l ON l.id = lp.loanId
      WHERE l.status = 'Active'
    `);

    const [capitalSummary] = await promisePool.query(`
      SELECT COALESCE(SUM(amount), 0) as totalCapital FROM capital_investments
    `);

    const totalBankPrincipal = parseFloat(loanSummary[0].totalBankPrincipal) || 0;
    const totalHandPrincipal = parseFloat(loanSummary[0].totalHandPrincipal) || 0;
    const totalPrincipalPaid = parseFloat(paidSummary[0].totalPrincipalPaid) || 0;
    const totalInterestPaid = parseFloat(paidSummary[0].totalInterestPaid) || 0;
    const totalCapital = parseFloat(capitalSummary[0].totalCapital) || 0;

    const totalOutstanding = totalBankPrincipal + totalHandPrincipal - totalPrincipalPaid;

    return {
      totalLoans: loanSummary[0].totalLoans,
      activeLoans: loanSummary[0].activeLoans,
      totalBankPrincipal,
      totalHandPrincipal,
      totalOutstanding: Math.max(totalOutstanding, 0),
      totalInterestPaid,
      totalCapital,
      netPosition: totalCapital - Math.max(totalOutstanding, 0),
    };
  }
}

module.exports = Loan;
