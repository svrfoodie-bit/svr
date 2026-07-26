const { promisePool } = require('../config/database');

class LedgerController {
  // ===== CUSTOMER LEDGER =====
  async getCustomerLedger(req, res, next) {
    try {
      const { customerId } = req.params;
      const { startDate, endDate } = req.query;

      const [customers] = await promisePool.query(
        'SELECT id, name, contactNumber AS phone, email, type FROM customers WHERE id = ? AND isDeleted = 0',
        [customerId]
      );
      if (!customers.length) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }
      const customer = customers[0];

      const [rows] = await promisePool.query(`
        SELECT
          txDate, txType, reference, description, debit, credit, 0 AS balance
        FROM (
          -- Sales Orders => Debit (customer owes money)
          SELECT
            DATE(so.createdAt) AS txDate,
            'Sale' AS txType,
            so.id AS reference,
            CONCAT('Sales Order #', so.id, IF(so.productGrade IS NOT NULL, CONCAT(' (', so.productGrade, ')'), '')) AS description,
            so.totalAmount AS debit,
            0 AS credit
          FROM sales_orders so
          WHERE so.customerId = ?
          UNION ALL
          -- Payments Received => Credit
          SELECT
            sp.paymentDate AS txDate,
            'Payment' AS txType,
            sp.id AS reference,
            CONCAT('Payment Received - ', sp.paymentMode) AS description,
            0 AS debit,
            sp.amount AS credit
          FROM sales_payments sp
          JOIN sales_orders so ON sp.salesOrderId = so.id
          WHERE so.customerId = ?
        ) ledger
        WHERE 1=1 ${startDate && endDate ? 'AND txDate BETWEEN ? AND ?' : ''}
        ORDER BY txDate ASC, txType DESC
      `, startDate && endDate
        ? [customerId, customerId, startDate, endDate]
        : [customerId, customerId]
      );

      let runningBalance = 0;
      const ledgerWithBalance = rows.map(row => {
        runningBalance += (parseFloat(row.debit) || 0) - (parseFloat(row.credit) || 0);
        return { ...row, balance: parseFloat(runningBalance.toFixed(2)) };
      });

      const totalDebit = rows.reduce((s, r) => s + (parseFloat(r.debit) || 0), 0);
      const totalCredit = rows.reduce((s, r) => s + (parseFloat(r.credit) || 0), 0);

      res.json({
        success: true,
        data: {
          customer,
          ledger: ledgerWithBalance,
          summary: {
            totalSales: totalDebit.toFixed(2),
            totalPayments: totalCredit.toFixed(2),
            outstandingBalance: (totalDebit - totalCredit).toFixed(2),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ===== SUPPLIER LEDGER =====
  async getSupplierLedger(req, res, next) {
    try {
      const { supplierId } = req.params;
      const { startDate, endDate } = req.query;

      const [suppliers] = await promisePool.query(
        'SELECT id, name, phone, email FROM suppliers WHERE id = ? AND isDeleted = 0',
        [supplierId]
      );
      if (!suppliers.length) {
        return res.status(404).json({ success: false, message: 'Supplier not found' });
      }
      const supplier = suppliers[0];

      const [rows] = await promisePool.query(`
        SELECT
          txDate, txType, reference, description, debit, credit, 0 AS balance
        FROM (
          -- Raw Purchases => Debit (we owe supplier)
          SELECT
            rp.purchaseDate AS txDate,
            'Purchase' AS txType,
            rp.id AS reference,
            CONCAT('Raw Purchase - ', COALESCE(rp.grade, 'Standard'), ' - ', rp.quantity, 'kg @ ₹', rp.ratePerUnit, '/kg') AS description,
            rp.totalAmount AS debit,
            0 AS credit
          FROM raw_purchases rp
          WHERE rp.supplierId = ?
          UNION ALL
          -- Payments to Supplier => Credit
          SELECT
            rpp.paymentDate AS txDate,
            'Payment' AS txType,
            rpp.id AS reference,
            CONCAT('Payment Made - ', rpp.paymentMode) AS description,
            0 AS debit,
            rpp.amount AS credit
          FROM raw_purchase_payments rpp
          JOIN raw_purchases rp ON rpp.rawPurchaseId = rp.id
          WHERE rp.supplierId = ?
        ) ledger
        WHERE 1=1 ${startDate && endDate ? 'AND txDate BETWEEN ? AND ?' : ''}
        ORDER BY txDate ASC, txType DESC
      `, startDate && endDate
        ? [supplierId, supplierId, startDate, endDate]
        : [supplierId, supplierId]
      );

      let runningBalance = 0;
      const ledgerWithBalance = rows.map(row => {
        runningBalance += (parseFloat(row.debit) || 0) - (parseFloat(row.credit) || 0);
        return { ...row, balance: parseFloat(runningBalance.toFixed(2)) };
      });

      const totalDebit = rows.reduce((s, r) => s + (parseFloat(r.debit) || 0), 0);
      const totalCredit = rows.reduce((s, r) => s + (parseFloat(r.credit) || 0), 0);

      res.json({
        success: true,
        data: {
          supplier,
          ledger: ledgerWithBalance,
          summary: {
            totalPurchases: totalDebit.toFixed(2),
            totalPayments: totalCredit.toFixed(2),
            outstandingBalance: (totalDebit - totalCredit).toFixed(2),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ===== DEBTORS AGING (accounting view) =====
  async getDebtorsAging(req, res, next) {
    try {
      // Per-customer outstanding with oldest unpaid order date for aging
      const [rows] = await promisePool.query(`
        SELECT
          c.id,
          c.name,
          c.contactNumber                                                        AS phone,
          c.type,
          COALESCE(SUM(so.totalAmount), 0)                                       AS totalBilled,
          COALESCE(SUM(COALESCE(sp.paid, 0)), 0)                                 AS totalCollected,
          GREATEST(0, COALESCE(SUM(so.totalAmount), 0)
                    - COALESCE(SUM(COALESCE(sp.paid, 0)), 0))                    AS outstanding,
          MIN(CASE WHEN (so.totalAmount - COALESCE(sp.paid, 0)) > 0
                   THEN DATE(so.createdAt) END)                                  AS oldestInvoiceDate,
          GREATEST(0, DATEDIFF(NOW(),
            MIN(CASE WHEN (so.totalAmount - COALESCE(sp.paid, 0)) > 0
                     THEN DATE(so.createdAt) END)))                              AS daysOutstanding
        FROM customers c
        LEFT JOIN sales_orders so ON c.id = so.customerId
        LEFT JOIN (
          SELECT salesOrderId, SUM(amount) AS paid
          FROM sales_payments GROUP BY salesOrderId
        ) sp ON so.id = sp.salesOrderId
        WHERE c.isDeleted = 0
        GROUP BY c.id, c.name, c.contactNumber, c.type
        HAVING outstanding > 0
        ORDER BY outstanding DESC
      `);

      // Compute aging buckets per row and summary totals
      let agingSummary = { current: 0, days31_60: 0, days61_90: 0, days91plus: 0, total: 0 };

      const data = rows.map(r => {
        const days        = parseInt(r.daysOutstanding) || 0;
        const outstanding = parseFloat(r.outstanding)   || 0;
        let agingBucket;
        if      (days <= 30)  { agingBucket = 'current';   agingSummary.current   += outstanding; }
        else if (days <= 60)  { agingBucket = '31-60';     agingSummary.days31_60 += outstanding; }
        else if (days <= 90)  { agingBucket = '61-90';     agingSummary.days61_90 += outstanding; }
        else                  { agingBucket = '90+';       agingSummary.days91plus+= outstanding; }
        agingSummary.total += outstanding;

        return {
          ...r,
          totalBilled:    parseFloat(r.totalBilled)    || 0,
          totalCollected: parseFloat(r.totalCollected) || 0,
          outstanding,
          daysOutstanding: days,
          agingBucket,
        };
      });

      // Round summary
      Object.keys(agingSummary).forEach(k => {
        agingSummary[k] = parseFloat(agingSummary[k].toFixed(2));
      });

      res.json({ success: true, data: { debtors: data, agingSummary } });
    } catch (error) {
      next(error);
    }
  }

  // ===== VENDORS PAYABLE AGING (accounting view) =====
  async getVendorsPayableAging(req, res, next) {
    try {
      const [rows] = await promisePool.query(`
        SELECT
          s.id,
          s.name,
          s.phone,
          COALESCE(SUM(rp.totalAmount), 0)                                        AS totalPurchased,
          COALESCE(SUM(COALESCE(rpp.paid, 0)), 0)                                 AS totalPaid,
          GREATEST(0, COALESCE(SUM(rp.totalAmount), 0)
                    - COALESCE(SUM(COALESCE(rpp.paid, 0)), 0))                    AS outstanding,
          MIN(CASE WHEN (rp.totalAmount - COALESCE(rpp.paid, 0)) > 0
                   THEN DATE(rp.purchaseDate) END)                                AS oldestInvoiceDate,
          GREATEST(0, DATEDIFF(NOW(),
            MIN(CASE WHEN (rp.totalAmount - COALESCE(rpp.paid, 0)) > 0
                     THEN DATE(rp.purchaseDate) END)))                            AS daysOutstanding
        FROM suppliers s
        LEFT JOIN raw_purchases rp ON s.id = rp.supplierId
        LEFT JOIN (
          SELECT rawPurchaseId, SUM(amount) AS paid
          FROM raw_purchase_payments GROUP BY rawPurchaseId
        ) rpp ON rp.id = rpp.rawPurchaseId
        WHERE s.isDeleted = 0
        GROUP BY s.id, s.name, s.phone
        HAVING outstanding > 0
        ORDER BY outstanding DESC
      `);

      let agingSummary = { current: 0, days31_60: 0, days61_90: 0, days91plus: 0, total: 0 };

      const data = rows.map(r => {
        const days        = parseInt(r.daysOutstanding) || 0;
        const outstanding = parseFloat(r.outstanding)   || 0;
        let agingBucket;
        if      (days <= 30)  { agingBucket = 'current';   agingSummary.current   += outstanding; }
        else if (days <= 60)  { agingBucket = '31-60';     agingSummary.days31_60 += outstanding; }
        else if (days <= 90)  { agingBucket = '61-90';     agingSummary.days61_90 += outstanding; }
        else                  { agingBucket = '90+';       agingSummary.days91plus+= outstanding; }
        agingSummary.total += outstanding;

        return {
          ...r,
          totalPurchased:  parseFloat(r.totalPurchased) || 0,
          totalPaid:       parseFloat(r.totalPaid)      || 0,
          outstanding,
          daysOutstanding: days,
          agingBucket,
        };
      });

      Object.keys(agingSummary).forEach(k => {
        agingSummary[k] = parseFloat(agingSummary[k].toFixed(2));
      });

      res.json({ success: true, data: { vendors: data, agingSummary } });
    } catch (error) {
      next(error);
    }
  }

  // ===== ALL CUSTOMERS OUTSTANDING =====
  async getAllCustomersOutstanding(req, res, next) {
    try {
      const [rows] = await promisePool.query(`
        SELECT
          c.id, c.name, c.contactNumber AS phone, c.type,
          COALESCE(SUM(so.totalAmount), 0) AS totalSales,
          COALESCE(SUM(sp.totalPaid), 0) AS totalPaid,
          COALESCE(SUM(so.totalAmount), 0) - COALESCE(SUM(sp.totalPaid), 0) AS outstanding
        FROM customers c
        LEFT JOIN sales_orders so ON c.id = so.customerId
        LEFT JOIN (
          SELECT sp2.salesOrderId, SUM(sp2.amount) AS totalPaid
          FROM sales_payments sp2
          GROUP BY sp2.salesOrderId
        ) sp ON so.id = sp.salesOrderId
        WHERE c.isDeleted = 0
        GROUP BY c.id, c.name, c.contactNumber, c.type
        HAVING outstanding > 0
        ORDER BY outstanding DESC
      `);
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  }

  // ===== ALL SUPPLIERS OUTSTANDING =====
  async getAllSuppliersOutstanding(req, res, next) {
    try {
      const [rows] = await promisePool.query(`
        SELECT
          s.id, s.name, s.phone,
          COALESCE(SUM(rp.totalAmount), 0) AS totalPurchases,
          COALESCE(SUM(rpp.totalPaid), 0) AS totalPaid,
          COALESCE(SUM(rp.totalAmount), 0) - COALESCE(SUM(rpp.totalPaid), 0) AS outstanding
        FROM suppliers s
        LEFT JOIN raw_purchases rp ON s.id = rp.supplierId
        LEFT JOIN (
          SELECT rawPurchaseId, SUM(amount) AS totalPaid
          FROM raw_purchase_payments
          GROUP BY rawPurchaseId
        ) rpp ON rp.id = rpp.rawPurchaseId
        WHERE s.isDeleted = 0
        GROUP BY s.id, s.name, s.phone
        HAVING outstanding > 0
        ORDER BY outstanding DESC
      `);
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LedgerController();
