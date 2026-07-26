const { promisePool } = require('../config/database');

class LoanPayment {
  static async createTable() {
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS loan_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        loanId INT NOT NULL,
        paymentDate DATE NOT NULL,
        principalAmount DECIMAL(12,2) NOT NULL DEFAULT 0,
        interestAmount DECIMAL(12,2) NOT NULL DEFAULT 0,
        paymentMode ENUM('Cash','Bank Transfer','PhonePe','Cheque') NOT NULL DEFAULT 'Cash',
        paymentType ENUM('EMI','InterestOnly','PrincipalOnly','Prepayment','FullSettlement') NOT NULL,
        notes TEXT,
        createdBy INT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loanId) REFERENCES loans(id) ON DELETE CASCADE
      )
    `);
  }

  static async create(data) {
    const [result] = await promisePool.query(
      `INSERT INTO loan_payments
        (loanId, paymentDate, principalAmount, interestAmount, paymentMode, paymentType, notes, createdBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.loanId,
        data.paymentDate,
        data.principalAmount || 0,
        data.interestAmount || 0,
        data.paymentMode || 'Cash',
        data.paymentType,
        data.notes || null,
        data.createdBy || 1,
      ]
    );

    // Auto-close loan if full settlement
    if (data.paymentType === 'FullSettlement') {
      await promisePool.query(
        "UPDATE loans SET status = 'Closed', updatedAt = NOW() WHERE id = ?",
        [data.loanId]
      );
    }

    return result.insertId;
  }

  static async getByLoan(loanId) {
    const [rows] = await promisePool.query(
      'SELECT * FROM loan_payments WHERE loanId = ? ORDER BY paymentDate DESC',
      [loanId]
    );
    return rows;
  }

  static async getAll(filters = {}) {
    let query = `
      SELECT lp.*, l.loanCode, l.lenderName, l.loanType
      FROM loan_payments lp
      JOIN loans l ON l.id = lp.loanId
      WHERE 1=1
    `;
    const params = [];

    if (filters.loanId) {
      query += ' AND lp.loanId = ?';
      params.push(filters.loanId);
    }
    if (filters.startDate && filters.endDate) {
      query += ' AND lp.paymentDate BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }

    query += ' ORDER BY lp.paymentDate DESC';
    const [rows] = await promisePool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const [rows] = await promisePool.query('SELECT * FROM loan_payments WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async delete(id) {
    // Re-open loan if this was a FullSettlement
    const [rows] = await promisePool.query('SELECT * FROM loan_payments WHERE id = ?', [id]);
    if (rows[0]?.paymentType === 'FullSettlement') {
      await promisePool.query(
        "UPDATE loans SET status = 'Active', updatedAt = NOW() WHERE id = ?",
        [rows[0].loanId]
      );
    }
    const [result] = await promisePool.query('DELETE FROM loan_payments WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // Monthly interest summary for active loans
  static async getMonthlyInterestBurden() {
    const [rows] = await promisePool.query(`
      SELECT
        l.id, l.loanCode, l.lenderName, l.loanType,
        l.principalAmount, l.interestRate, l.interestPaymentType,
        COALESCE(SUM(lp.principalAmount), 0) as paidPrincipal
      FROM loans l
      LEFT JOIN loan_payments lp ON lp.loanId = l.id
      WHERE l.status = 'Active'
      GROUP BY l.id
    `);

    return rows.map((loan) => {
      const outstanding = Math.max(
        parseFloat(loan.principalAmount) - parseFloat(loan.paidPrincipal),
        0
      );
      const monthlyInterest = (outstanding * parseFloat(loan.interestRate)) / 100 / 12;
      return {
        loanId: loan.id,
        loanCode: loan.loanCode,
        lenderName: loan.lenderName,
        loanType: loan.loanType,
        outstandingPrincipal: outstanding,
        monthlyInterest: parseFloat(monthlyInterest.toFixed(2)),
        interestPaymentType: loan.interestPaymentType,
      };
    });
  }
}

module.exports = LoanPayment;
