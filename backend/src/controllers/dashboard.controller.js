const { promisePool } = require('../config/database');

async function getTodayStats(req, res, next) {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const [[purchases]] = await promisePool.query(
      `SELECT COUNT(*) AS count, COALESCE(SUM(totalAmount), 0) AS amount
       FROM raw_purchases WHERE DATE(purchaseDate) = ?`,
      [today]
    );

    const [[sales]] = await promisePool.query(
      `SELECT COUNT(*) AS count, COALESCE(SUM(totalAmount), 0) AS amount
       FROM sales_orders WHERE DATE(createdAt) = ?`,
      [today]
    );

    const [[jobworks]] = await promisePool.query(
      `SELECT COUNT(*) AS count,
              COALESCE(SUM(quantitySent * ratePerKg), 0) AS amount
       FROM job_work WHERE DATE(jobDate) = ?`,
      [today]
    );

    const [[expenses]] = await promisePool.query(
      `SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS amount
       FROM expenses WHERE DATE(date) = ?`,
      [today]
    );

    const [[payments]] = await promisePool.query(
      `SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS amount
       FROM sales_payments WHERE DATE(paymentDate) = ?`,
      [today]
    );

    res.json({
      success: true,
      data: {
        date: today,
        purchases: { count: purchases.count, amount: Number(purchases.amount) },
        sales: { count: sales.count, amount: Number(sales.amount) },
        jobWorks: { count: jobworks.count, amount: Number(jobworks.amount) },
        expenses: { count: expenses.count, amount: Number(expenses.amount) },
        paymentsReceived: { count: payments.count, amount: Number(payments.amount) },
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getTodayStats };
