const { promisePool } = require('../config/database');

class SalesOrder {
  static async migrate() {
    try {
      await promisePool.query(`
        ALTER TABLE sales_orders
        ADD COLUMN IF NOT EXISTS orderDate DATE NULL AFTER customerId,
        ADD COLUMN IF NOT EXISTS paymentType VARCHAR(30) DEFAULT 'Cash' AFTER deliveryDate,
        ADD COLUMN IF NOT EXISTS notes TEXT NULL AFTER status
      `);
    } catch {
      for (const statement of [
        "ALTER TABLE sales_orders ADD COLUMN orderDate DATE NULL AFTER customerId",
        "ALTER TABLE sales_orders ADD COLUMN paymentType VARCHAR(30) DEFAULT 'Cash' AFTER deliveryDate",
        "ALTER TABLE sales_orders ADD COLUMN notes TEXT NULL AFTER status",
      ]) {
        try { await promisePool.query(statement); } catch { /* already exists */ }
      }
    }
  }

  static async generateOrderNumber() {
    const year = new Date().getFullYear();
    const [rows] = await promisePool.query(
      'SELECT COUNT(*) AS count FROM sales_orders WHERE salesOrderId LIKE ?',
      [`SO-${year}-%`]
    );
    return `SO-${year}-${String((rows[0]?.count || 0) + 1).padStart(3, '0')}`;
  }

  static normalizeOrderData(data = {}) {
    const lineItems = Array.isArray(data.lineItems) && data.lineItems.length > 0
      ? data.lineItems
      : [{
          grade: data.productGrade,
          quantity: data.quantity,
          rate: data.ratePerUnit,
        }];

    const normalizedItems = lineItems.map((item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate ?? item.ratePerUnit) || 0;
      return {
        grade: item.grade || item.productGrade || 'Standard',
        quantity,
        rate,
        amount: quantity * rate,
      };
    }).filter((item) => item.quantity > 0 && item.rate > 0);

    const totalQuantity = normalizedItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = data.totalAmount ?? normalizedItems.reduce((sum, item) => sum + item.amount, 0);
    const weightedRate = totalQuantity > 0 ? totalAmount / totalQuantity : 0;

    return {
      items: normalizedItems,
      productGrade: normalizedItems.map((item) => item.grade).join(', ') || data.productGrade || 'Standard',
      quantity: totalQuantity || parseFloat(data.quantity) || 0,
      ratePerUnit: weightedRate || parseFloat(data.ratePerUnit) || 0,
      totalAmount: parseFloat(totalAmount) || 0,
    };
  }

  static async create(data) {
    const orderNumber = data.salesOrderId || data.orderNumber || await this.generateOrderNumber();
    const order = this.normalizeOrderData(data);
    const paymentType = data.paymentType || 'Cash';
    const orderDate = data.orderDate || data.date || new Date();

    const query = `
      INSERT INTO sales_orders (salesOrderId, customerId, orderDate, productGrade, quantity, ratePerUnit,
                                totalAmount, deliveryDate, paymentType, status, notes, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await promisePool.query(query, [
      orderNumber,
      data.customerId,
      orderDate,
      order.productGrade,
      order.quantity,
      order.ratePerUnit,
      order.totalAmount,
      data.deliveryDate || null,
      paymentType,
      data.status || 'Pending',
      data.notes || data.remarks || null,
      data.createdBy || 1
    ]);

    if (['Cash', 'UPI', 'PhonePe'].includes(paymentType) && order.totalAmount > 0) {
      await promisePool.query(
        `INSERT INTO sales_payments (salesOrderId, paymentDate, amount, paymentMode, reference, notes, createdBy)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          result.insertId,
          orderDate,
          order.totalAmount,
          paymentType === 'PhonePe' ? 'UPI' : paymentType,
          null,
          'Auto-recorded from sales order',
          data.createdBy || 1,
        ]
      );
    }

    await Promise.all(order.items.map((item) =>
      promisePool.query(
        `INSERT INTO finished_goods_stock (batchId, grade, quantity, dateAdded, createdBy)
         VALUES (?, ?, ?, ?, ?)`,
        [null, item.grade, -Math.abs(item.quantity), orderDate, data.createdBy || 1]
      )
    ));

    return result.insertId;
  }

  static async getAll(filters = {}) {
    let query = `
      SELECT
        so.*,
        so.salesOrderId AS orderNumber,
        DATE(COALESCE(so.orderDate, so.createdAt)) AS date,
        COALESCE(so.paymentType, 'Cash') AS paymentType,
        so.totalAmount AS orderTotal,
        c.name AS customerName,
        COALESCE(pay.paidAmount, 0) AS paidAmount,
        COALESCE(pay.paidAmount, 0) AS totalPaid,
        GREATEST(so.totalAmount - COALESCE(pay.paidAmount, 0), 0) AS outstanding,
        GREATEST(so.totalAmount - COALESCE(pay.paidAmount, 0), 0) AS outstandingAmount,
        CASE
          WHEN COALESCE(pay.paidAmount, 0) >= so.totalAmount THEN 'Paid'
          WHEN COALESCE(pay.paidAmount, 0) > 0 THEN 'Partial'
          ELSE 'Pending'
        END AS paymentStatus
      FROM sales_orders so
      JOIN customers c ON so.customerId = c.id
      LEFT JOIN (
        SELECT salesOrderId, SUM(amount) AS paidAmount
        FROM sales_payments
        GROUP BY salesOrderId
      ) pay ON pay.salesOrderId = so.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += ' AND so.status = ?';
      params.push(filters.status);
    }

    if (filters.paymentType) {
      query += ' AND COALESCE(so.paymentType, ?) = ?';
      params.push('Cash', filters.paymentType);
    }

    if (filters.customerId) {
      query += ' AND so.customerId = ?';
      params.push(filters.customerId);
    }

    if (filters.startDate && filters.endDate) {
      query += ' AND DATE(COALESCE(so.orderDate, so.createdAt)) BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }

    if (filters.paymentStatus) {
      query += ' HAVING paymentStatus = ?';
      params.push(filters.paymentStatus);
    }

    query += ' ORDER BY COALESCE(so.orderDate, so.createdAt) DESC, so.id DESC';
    const [rows] = await promisePool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const query = `
      SELECT
        so.*,
        so.salesOrderId AS orderNumber,
        DATE(COALESCE(so.orderDate, so.createdAt)) AS date,
        COALESCE(so.paymentType, 'Cash') AS paymentType,
        so.totalAmount AS orderTotal,
        COALESCE(pay.paidAmount, 0) AS paidAmount,
        GREATEST(so.totalAmount - COALESCE(pay.paidAmount, 0), 0) AS outstanding,
        GREATEST(so.totalAmount - COALESCE(pay.paidAmount, 0), 0) AS outstandingAmount,
        CASE
          WHEN COALESCE(pay.paidAmount, 0) >= so.totalAmount THEN 'Paid'
          WHEN COALESCE(pay.paidAmount, 0) > 0 THEN 'Partial'
          ELSE 'Pending'
        END AS paymentStatus
      FROM sales_orders so
      LEFT JOIN (
        SELECT salesOrderId, SUM(amount) AS paidAmount
        FROM sales_payments
        GROUP BY salesOrderId
      ) pay ON pay.salesOrderId = so.id
      WHERE so.id = ?
    `;
    const [rows] = await promisePool.query(query, [id]);
    return rows[0] || null;
  }

  static async update(id, data) {
    const updates = [];
    const params = [];

    Object.entries(data).forEach(([key, value]) => {
      if (['orderDate', 'quantity', 'ratePerUnit', 'totalAmount', 'deliveryDate', 'paymentType', 'status', 'notes'].includes(key)) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updates.length === 0) return false;
    params.push(id);
    const query = `UPDATE sales_orders SET ${updates.join(', ')}, updatedAt = NOW() WHERE id = ?`;
    const [result] = await promisePool.query(query, params);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await promisePool.query('DELETE FROM sales_orders WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getOutstanding() {
    const query = `
      SELECT 
        so.id, so.salesOrderId, c.name as customerName, c.customerId,
        so.salesOrderId as orderNumber,
        DATE(COALESCE(so.orderDate, so.createdAt)) as date,
        COALESCE(so.paymentType, 'Cash') as paymentType,
        so.quantity, so.ratePerUnit, so.totalAmount,
        COALESCE(SUM(sp.amount), 0) as paidAmount,
        so.totalAmount as orderTotal,
        GREATEST(so.totalAmount - COALESCE(SUM(sp.amount), 0), 0) as outstanding,
        GREATEST(so.totalAmount - COALESCE(SUM(sp.amount), 0), 0) as outstandingAmount,
        so.createdAt as orderDate
      FROM sales_orders so
      JOIN customers c ON so.customerId = c.id
      LEFT JOIN sales_payments sp ON so.id = sp.salesOrderId
      WHERE so.status != 'Cancelled'
      GROUP BY so.id
      HAVING outstanding > 0
      ORDER BY so.createdAt ASC
    `;
    const [rows] = await promisePool.query(query);
    return rows;
  }

  static async getCustomerWiseSummary() {
    const query = `
      SELECT 
        c.id, c.name, c.customerId,
        COUNT(so.id) as orderCount,
        COALESCE(SUM(so.totalAmount), 0) as totalSales,
        COALESCE(SUM(sp.amount), 0) as totalPaid,
        COALESCE(SUM(so.totalAmount), 0) - COALESCE(SUM(sp.amount), 0) as outstanding
      FROM customers c
      LEFT JOIN sales_orders so ON c.id = so.customerId
      LEFT JOIN sales_payments sp ON so.id = sp.salesOrderId
      GROUP BY c.id
      ORDER BY outstanding DESC
    `;
    const [rows] = await promisePool.query(query);
    return rows;
  }

  static async getGradeWiseSummary() {
    const query = `
      SELECT
        productGrade as grade,
        COUNT(*) as totalOrders,
        COALESCE(SUM(quantity), 0) as totalQuantity,
        COALESCE(SUM(totalAmount), 0) as totalAmount
      FROM sales_orders
      GROUP BY productGrade
      ORDER BY totalAmount DESC
    `;
    const [rows] = await promisePool.query(query);
    return rows;
  }

  static async getSummary(filters = {}) {
    let query = `
      SELECT 
        COUNT(*) as totalOrders,
        COALESCE(SUM(so.quantity), 0) as totalQuantity,
        COALESCE(SUM(so.totalAmount), 0) as totalSales,
        COALESCE(SUM(pay.paidAmount), 0) as totalPaid,
        COALESCE(SUM(GREATEST(so.totalAmount - COALESCE(pay.paidAmount, 0), 0)), 0) as totalOutstanding,
        SUM(CASE WHEN COALESCE(pay.paidAmount, 0) >= so.totalAmount THEN 1 ELSE 0 END) as paidOrders,
        SUM(CASE WHEN COALESCE(pay.paidAmount, 0) < so.totalAmount THEN 1 ELSE 0 END) as pendingOrders
      FROM sales_orders so
      LEFT JOIN (
        SELECT salesOrderId, SUM(amount) AS paidAmount
        FROM sales_payments
        GROUP BY salesOrderId
      ) pay ON pay.salesOrderId = so.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.startDate && filters.endDate) {
      query += ' AND DATE(COALESCE(so.orderDate, so.createdAt)) BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }

    if (filters.paymentType) {
      query += ' AND COALESCE(so.paymentType, ?) = ?';
      params.push('Cash', filters.paymentType);
    }

    const [rows] = await promisePool.query(query, params);
    const summary = rows[0] || {};

    if (filters.paymentStatus) {
      const orders = await this.getAll(filters);
      return {
        totalOrders: orders.length,
        totalQuantity: orders.reduce((sum, order) => sum + parseFloat(order.quantity || 0), 0),
        totalSales: orders.reduce((sum, order) => sum + parseFloat(order.orderTotal || 0), 0),
        totalPaid: orders.reduce((sum, order) => sum + parseFloat(order.paidAmount || 0), 0),
        totalOutstanding: orders.reduce((sum, order) => sum + parseFloat(order.outstandingAmount || 0), 0),
        paidOrders: orders.filter((order) => order.paymentStatus === 'Paid').length,
        pendingOrders: orders.filter((order) => order.paymentStatus !== 'Paid').length,
      };
    }

    return summary;
  }
}

SalesOrder.migrate().catch(console.error);

module.exports = SalesOrder;
