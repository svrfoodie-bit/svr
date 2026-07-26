const { promisePool } = require('../config/database');
const Settings = require('../models/Settings.model');

// Cashew kernel GST rates (India) — HSN 0801
const GST_RATES = {
  default: 5,  // 5% for processed cashew kernels
  raw: 5,       // 5% for raw cashew
};

const CGST = GST_RATES.default / 2;
const SGST = GST_RATES.default / 2;

class GSTController {
  // ===== OUTPUT TAX (GST on Sales) =====
  async getOutputTax(req, res, next) {
    try {
      const { startDate, endDate, month, year } = req.query;
      let dateFilter = '';
      const params = [];

      if (startDate && endDate) {
        dateFilter = 'WHERE DATE(so.createdAt) BETWEEN ? AND ?';
        params.push(startDate, endDate);
      } else if (month && year) {
        dateFilter = 'WHERE MONTH(so.createdAt) = ? AND YEAR(so.createdAt) = ?';
        params.push(month, year);
      }

      const [rows] = await promisePool.query(`
        SELECT
          so.id,
          so.salesOrderId,
          DATE(so.createdAt) AS invoiceDate,
          c.name AS customerName,
          c.contactNumber AS customerPhone,
          c.type AS customerType,
          so.productGrade,
          so.quantity,
          so.ratePerUnit,
          so.totalAmount AS taxableValue,
          ROUND(so.totalAmount * ${CGST} / 100, 2) AS cgst,
          ROUND(so.totalAmount * ${SGST} / 100, 2) AS sgst,
          ROUND(so.totalAmount * ${GST_RATES.default} / 100, 2) AS totalGST,
          ROUND(so.totalAmount * (1 + ${GST_RATES.default} / 100), 2) AS invoiceValue,
          so.status
        FROM sales_orders so
        JOIN customers c ON so.customerId = c.id
        ${dateFilter}
        ORDER BY so.createdAt DESC
      `, params);

      const totalTaxable = rows.reduce((s, r) => s + parseFloat(r.taxableValue), 0);
      const totalCGST = rows.reduce((s, r) => s + parseFloat(r.cgst), 0);
      const totalSGST = rows.reduce((s, r) => s + parseFloat(r.sgst), 0);
      const totalGST = rows.reduce((s, r) => s + parseFloat(r.totalGST), 0);

      res.json({
        success: true,
        data: {
          transactions: rows,
          summary: {
            totalTransactions: rows.length,
            totalTaxableValue: totalTaxable.toFixed(2),
            totalCGST: totalCGST.toFixed(2),
            totalSGST: totalSGST.toFixed(2),
            totalGST: totalGST.toFixed(2),
            totalInvoiceValue: (totalTaxable + totalGST).toFixed(2),
            gstRate: GST_RATES.default,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ===== INPUT TAX CREDIT (GST on Purchases) =====
  async getInputTaxCredit(req, res, next) {
    try {
      const { startDate, endDate, month, year } = req.query;
      let dateFilter = '';
      const params = [];

      if (startDate && endDate) {
        dateFilter = 'WHERE rp.purchaseDate BETWEEN ? AND ?';
        params.push(startDate, endDate);
      } else if (month && year) {
        dateFilter = 'WHERE MONTH(rp.purchaseDate) = ? AND YEAR(rp.purchaseDate) = ?';
        params.push(month, year);
      }

      const [rows] = await promisePool.query(`
        SELECT
          rp.id,
          rp.purchaseDate,
          s.name AS supplierName,
          s.phone AS supplierPhone,
          rp.grade AS rawGrade,
          rp.quantity,
          rp.ratePerUnit,
          rp.totalAmount AS taxableValue,
          ROUND(rp.totalAmount * ${CGST} / 100, 2) AS cgst,
          ROUND(rp.totalAmount * ${SGST} / 100, 2) AS sgst,
          ROUND(rp.totalAmount * ${GST_RATES.raw} / 100, 2) AS totalGST
        FROM raw_purchases rp
        JOIN suppliers s ON rp.supplierId = s.id
        ${dateFilter}
        ORDER BY rp.purchaseDate DESC
      `, params);

      const totalTaxable = rows.reduce((s, r) => s + parseFloat(r.taxableValue), 0);
      const totalITC = rows.reduce((s, r) => s + parseFloat(r.totalGST), 0);

      res.json({
        success: true,
        data: {
          transactions: rows,
          summary: {
            totalTransactions: rows.length,
            totalTaxableValue: totalTaxable.toFixed(2),
            totalITC: totalITC.toFixed(2),
            totalCGST: (totalITC / 2).toFixed(2),
            totalSGST: (totalITC / 2).toFixed(2),
            gstRate: GST_RATES.raw,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ===== GSTR-3B SUMMARY (Net Tax Payable) =====
  async getGSTR3BSummary(req, res, next) {
    try {
      const { month, year } = req.query;
      const m = parseInt(month) || new Date().getMonth() + 1;
      const y = parseInt(year) || new Date().getFullYear();

      // Output tax (sales)
      const [sales] = await promisePool.query(`
        SELECT
          COALESCE(SUM(totalAmount), 0) AS taxableValue,
          COALESCE(SUM(ROUND(totalAmount * ${CGST} / 100, 2)), 0) AS cgst,
          COALESCE(SUM(ROUND(totalAmount * ${SGST} / 100, 2)), 0) AS sgst
        FROM sales_orders
        WHERE MONTH(createdAt) = ? AND YEAR(createdAt) = ?
      `, [m, y]);

      // Input tax credit (purchases)
      const [purchases] = await promisePool.query(`
        SELECT
          COALESCE(SUM(totalAmount), 0) AS taxableValue,
          COALESCE(SUM(ROUND(totalAmount * ${CGST} / 100, 2)), 0) AS cgst,
          COALESCE(SUM(ROUND(totalAmount * ${SGST} / 100, 2)), 0) AS sgst
        FROM raw_purchases
        WHERE MONTH(purchaseDate) = ? AND YEAR(purchaseDate) = ?
      `, [m, y]);

      const outputCGST = parseFloat(sales[0].cgst);
      const outputSGST = parseFloat(sales[0].sgst);
      const itcCGST = parseFloat(purchases[0].cgst);
      const itcSGST = parseFloat(purchases[0].sgst);

      const netCGST = Math.max(0, outputCGST - itcCGST);
      const netSGST = Math.max(0, outputSGST - itcSGST);

      res.json({
        success: true,
        data: {
          period: { month: m, year: y },
          outwardSupplies: {
            taxableValue: parseFloat(sales[0].taxableValue).toFixed(2),
            cgst: outputCGST.toFixed(2),
            sgst: outputSGST.toFixed(2),
            total: (outputCGST + outputSGST).toFixed(2),
          },
          inputTaxCredit: {
            taxableValue: parseFloat(purchases[0].taxableValue).toFixed(2),
            cgst: itcCGST.toFixed(2),
            sgst: itcSGST.toFixed(2),
            total: (itcCGST + itcSGST).toFixed(2),
          },
          netPayable: {
            cgst: netCGST.toFixed(2),
            sgst: netSGST.toFixed(2),
            total: (netCGST + netSGST).toFixed(2),
            isRefund: (outputCGST + outputSGST) < (itcCGST + itcSGST),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ===== HSN SUMMARY =====
  async getHSNSummary(req, res, next) {
    try {
      const { month, year } = req.query;
      const m = parseInt(month) || new Date().getMonth() + 1;
      const y = parseInt(year) || new Date().getFullYear();

      const [rows] = await promisePool.query(`
        SELECT
          '0801' AS hsnCode,
          'Cashew Nuts' AS description,
          ${GST_RATES.default} AS gstRate,
          COALESCE(SUM(quantity), 0) AS totalQuantity,
          COALESCE(SUM(totalAmount), 0) AS taxableValue,
          COALESCE(SUM(ROUND(totalAmount * ${CGST} / 100, 2)), 0) AS cgst,
          COALESCE(SUM(ROUND(totalAmount * ${SGST} / 100, 2)), 0) AS sgst,
          COALESCE(SUM(ROUND(totalAmount * ${GST_RATES.default} / 100, 2)), 0) AS totalTax
        FROM sales_orders
        WHERE MONTH(createdAt) = ? AND YEAR(createdAt) = ?
      `, [m, y]);

      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  }

  // ===== GET INVOICE DATA (for print) =====
  async getInvoice(req, res, next) {
    try {
      const { id } = req.params;
      const [orders] = await promisePool.query(`
        SELECT so.*, c.name AS customerName, c.contactNumber AS customerPhone,
          c.email AS customerEmail, c.address AS customerAddress, c.type AS customerType
        FROM sales_orders so
        JOIN customers c ON so.customerId = c.id
        WHERE so.id = ?
      `, [id]);

      if (!orders.length) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      const order = orders[0];
      const taxableValue = parseFloat(order.totalAmount);
      const cgst = parseFloat((taxableValue * CGST / 100).toFixed(2));
      const sgst = parseFloat((taxableValue * SGST / 100).toFixed(2));

      const settings = await Settings.get();
      const companyInfo = settings.company_info || {};

      const [payments] = await promisePool.query(
        'SELECT * FROM sales_payments WHERE salesOrderId = ? ORDER BY paymentDate ASC', [id]
      );

      res.json({
        success: true,
        data: {
          order,
          payments,
          gst: { cgst, sgst, total: cgst + sgst, rate: GST_RATES.default },
          invoiceTotal: taxableValue + cgst + sgst,
          business: {
            name: companyInfo.companyName || 'SVR Food Production',
            address: companyInfo.address || '',
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GSTController();
