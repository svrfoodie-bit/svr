const { promisePool } = require('../config/database');

async function globalSearch(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const like = `%${q}%`;
    const results = [];

    // Customers
    const [customers] = await promisePool.query(
      `SELECT id, name AS label, customerId AS sub, 'Customer' AS type
       FROM customers
       WHERE COALESCE(isDeleted,0)=0 AND (name LIKE ? OR customerId LIKE ?)
       LIMIT 5`,
      [like, like]
    );
    results.push(...customers.map(r => ({ ...r, url: `/customers/edit/${r.id}` })));

    // Suppliers
    const [suppliers] = await promisePool.query(
      `SELECT id, name AS label, supplierId AS sub, 'Supplier' AS type
       FROM suppliers
       WHERE COALESCE(isDeleted,0)=0 AND (name LIKE ? OR supplierId LIKE ?)
       LIMIT 5`,
      [like, like]
    );
    results.push(...suppliers.map(r => ({ ...r, url: `/raw-purchases?supplier=${r.id}` })));

    // Workers
    const [workers] = await promisePool.query(
      `SELECT id, name AS label, workerId AS sub, 'Worker' AS type
       FROM workers
       WHERE name LIKE ? OR workerId LIKE ?
       LIMIT 5`,
      [like, like]
    );
    results.push(...workers.map(r => ({ ...r, url: `/job-work?worker=${r.id}` })));

    // Sales Orders
    const [orders] = await promisePool.query(
      `SELECT so.id, so.salesOrderId AS label, c.name AS sub, 'Sales Order' AS type
       FROM sales_orders so
       JOIN customers c ON so.customerId = c.id
       WHERE so.salesOrderId LIKE ? OR c.name LIKE ?
       ORDER BY so.createdAt DESC
       LIMIT 5`,
      [like, like]
    );
    results.push(...orders.map(r => ({ ...r, url: `/sales-orders/edit/${r.id}` })));

    // Raw Purchases
    const [purchases] = await promisePool.query(
      `SELECT rp.id, CONCAT('Purchase #', rp.id) AS label, s.name AS sub, 'Purchase' AS type
       FROM raw_purchases rp
       JOIN suppliers s ON rp.supplierId = s.id
       WHERE s.name LIKE ?
       ORDER BY rp.purchaseDate DESC
       LIMIT 5`,
      [like]
    );
    results.push(...purchases.map(r => ({ ...r, url: `/raw-purchases/edit/${r.id}` })));

    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
}

module.exports = { globalSearch };
