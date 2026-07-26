const { promisePool } = require('../config/database');

exports.getBalanceSheet = async (req, res) => {
  try {
    const [
      [debtorRows],
      [stockRows],
      [vendorRows],
      [loanRows],
      [salaryRows],
      [capitalRows],
      [salesRows],
      [rawCostRows],
      [jobWorkRows],
      [workerWageRows],
      [operatingExpenseRows],
      [loanInterestRows],
      [fixedAssetRows],
    ] = await Promise.all([
      // 1. Debtors — total customer outstanding (sales billed - collected)
      promisePool.query(`
        SELECT GREATEST(0,
          COALESCE(SUM(so.totalAmount), 0) - COALESCE(SUM(sp.paid), 0)
        ) AS debtors
        FROM sales_orders so
        LEFT JOIN (
          SELECT salesOrderId, SUM(amount) AS paid
          FROM sales_payments GROUP BY salesOrderId
        ) sp ON so.id = sp.salesOrderId
      `),

      // 2. Finished Goods Stock value (quantity × grade price)
      promisePool.query(`
        SELECT
          COALESCE(SUM(fgs.quantity * COALESCE(gp.pricePerKg, 0)), 0) AS stockValue,
          COALESCE(SUM(fgs.quantity), 0) AS totalQuantity
        FROM finished_goods_stock fgs
        LEFT JOIN grade_prices gp ON fgs.grade = gp.grade
      `),

      // 3. Vendors Payable — supplier outstanding (purchased - paid)
      promisePool.query(`
        SELECT GREATEST(0,
          COALESCE(SUM(rp.totalAmount), 0) - COALESCE(SUM(rpp.paid), 0)
        ) AS vendorsPayable
        FROM raw_purchases rp
        LEFT JOIN (
          SELECT rawPurchaseId, SUM(amount) AS paid
          FROM raw_purchase_payments GROUP BY rawPurchaseId
        ) rpp ON rp.id = rpp.rawPurchaseId
      `),

      // 4. Loans Outstanding — active loan principal not yet repaid
      promisePool.query(`
        SELECT GREATEST(0,
          COALESCE(SUM(l.principalAmount), 0) - COALESCE(SUM(lp.paid), 0)
        ) AS loansOutstanding
        FROM loans l
        LEFT JOIN (
          SELECT loanId, SUM(principalAmount) AS paid
          FROM loan_payments GROUP BY loanId
        ) lp ON l.id = lp.loanId
        WHERE l.status = 'Active'
      `),

      // 5. Salary Payable — payroll records not yet marked as Paid
      promisePool.query(`
        SELECT COALESCE(SUM(netSalary), 0) AS salaryPayable
        FROM payroll WHERE status = 'Draft'
      `),

      // 6. Capital Invested — owner's total capital injected
      promisePool.query(`
        SELECT COALESCE(SUM(amount), 0) AS capitalInvested FROM capital_investments
      `),

      // 7. Total Sales Revenue (all-time)
      promisePool.query(`
        SELECT COALESCE(SUM(totalAmount), 0) AS totalSales FROM sales_orders
      `),

      // 8. Raw Purchase Cost
      promisePool.query(`
        SELECT COALESCE(SUM(totalAmount), 0) AS total FROM raw_purchases
      `),

      // 9. Job Work Cost (quantityReceived × ratePerKg, exclude Cancelled)
      promisePool.query(`
        SELECT COALESCE(SUM(quantityReceived * ratePerKg), 0) AS total
        FROM job_work WHERE status != 'Cancelled'
      `),

      // 10. Worker Wages (daily work)
      promisePool.query(`
        SELECT COALESCE(SUM(totalAmount), 0) AS total FROM daily_work
      `),

      // 11. Operating Expenses — exclude 'Loan Interest' (it's captured in loan_payments separately)
      promisePool.query(`
        SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE category != 'Loan Interest'
      `),

      // 12. Loan Interest Paid
      promisePool.query(`
        SELECT COALESCE(SUM(interestAmount), 0) AS total FROM loan_payments
      `),

      // 13. Fixed Assets — active current value (Machinery, Land, Building, etc.)
      promisePool.query(`
        SELECT
          COALESCE(SUM(currentValue), 0) AS totalFixedAssets,
          COALESCE(SUM(CASE WHEN assetType = 'Machinery'  THEN currentValue ELSE 0 END), 0) AS machinery,
          COALESCE(SUM(CASE WHEN assetType = 'Land'       THEN currentValue ELSE 0 END), 0) AS land,
          COALESCE(SUM(CASE WHEN assetType = 'Building'   THEN currentValue ELSE 0 END), 0) AS building,
          COALESCE(SUM(CASE WHEN assetType NOT IN ('Machinery','Land','Building') THEN currentValue ELSE 0 END), 0) AS otherFixed
        FROM fixed_assets WHERE status = 'Active'
      `),
    ]);

    // ── Current Assets ───────────────────────────────────────────────────────
    const debtors       = parseFloat(debtorRows[0]?.debtors)     || 0;
    const stockValue    = parseFloat(stockRows[0]?.stockValue)    || 0;
    const totalQuantity = parseFloat(stockRows[0]?.totalQuantity) || 0;

    // ── Fixed Assets ─────────────────────────────────────────────────────────
    const totalFixedAssets = parseFloat(fixedAssetRows[0]?.totalFixedAssets) || 0;
    const machinery        = parseFloat(fixedAssetRows[0]?.machinery)        || 0;
    const land             = parseFloat(fixedAssetRows[0]?.land)             || 0;
    const building         = parseFloat(fixedAssetRows[0]?.building)         || 0;
    const otherFixed       = parseFloat(fixedAssetRows[0]?.otherFixed)       || 0;

    // ── Liabilities ──────────────────────────────────────────────────────────
    const vendorsPayable   = parseFloat(vendorRows[0]?.vendorsPayable)  || 0;
    const loansOutstanding = parseFloat(loanRows[0]?.loansOutstanding)  || 0;
    const salaryPayable    = parseFloat(salaryRows[0]?.salaryPayable)   || 0;
    const totalLiabilities = vendorsPayable + loansOutstanding + salaryPayable;

    // ── Equity ───────────────────────────────────────────────────────────────
    const capitalInvested   = parseFloat(capitalRows[0]?.capitalInvested)  || 0;
    const totalSales        = parseFloat(salesRows[0]?.totalSales)         || 0;
    const rawPurchaseCost   = parseFloat(rawCostRows[0]?.total)            || 0;
    const jobWorkCost       = parseFloat(jobWorkRows[0]?.total)            || 0;
    const workerWagesCost   = parseFloat(workerWageRows[0]?.total)         || 0;
    const operatingExpenses = parseFloat(operatingExpenseRows[0]?.total)   || 0;
    const loanInterest      = parseFloat(loanInterestRows[0]?.total)       || 0;

    const retainedEarnings = totalSales - rawPurchaseCost - jobWorkCost - workerWagesCost - operatingExpenses - loanInterest;
    const totalEquity      = capitalInvested + retainedEarnings;

    // ── Cash & Bank (derived as balancing figure) ────────────────────────────
    // Assets = Liabilities + Equity
    // Cash = (L + E) − Current Assets (Debtors + Stock) − Fixed Assets
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
    const knownAssets = debtors + stockValue + totalFixedAssets;
    const cashAndBank = totalLiabilitiesAndEquity - knownAssets;
    const totalAssets = knownAssets + cashAndBank; // = totalLiabilitiesAndEquity

    res.json({
      success: true,
      data: {
        asOf: new Date().toISOString().split('T')[0],
        assets: {
          // Current Assets
          debtors:               debtors.toFixed(2),
          finishedGoodsStock:    stockValue.toFixed(2),
          finishedGoodsQuantity: totalQuantity.toFixed(2),
          cashAndBank:           cashAndBank.toFixed(2),
          // Fixed Assets
          machinery:             machinery.toFixed(2),
          land:                  land.toFixed(2),
          building:              building.toFixed(2),
          otherFixed:            otherFixed.toFixed(2),
          totalFixedAssets:      totalFixedAssets.toFixed(2),
          total:                 totalAssets.toFixed(2),
        },
        liabilities: {
          vendorsPayable:   vendorsPayable.toFixed(2),
          loansOutstanding: loansOutstanding.toFixed(2),
          salaryPayable:    salaryPayable.toFixed(2),
          total:            totalLiabilities.toFixed(2),
        },
        equity: {
          capitalInvested:  capitalInvested.toFixed(2),
          retainedEarnings: retainedEarnings.toFixed(2),
          total:            totalEquity.toFixed(2),
        },
        totalLiabilitiesAndEquity: totalLiabilitiesAndEquity.toFixed(2),
        pnl: {
          totalSales:        totalSales.toFixed(2),
          rawPurchaseCost:   rawPurchaseCost.toFixed(2),
          jobWorkCost:       jobWorkCost.toFixed(2),
          workerWagesCost:   workerWagesCost.toFixed(2),
          operatingExpenses: operatingExpenses.toFixed(2),
          loanInterest:      loanInterest.toFixed(2),
        },
      },
    });
  } catch (err) {
    console.error('Balance sheet error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate balance sheet' });
  }
};
