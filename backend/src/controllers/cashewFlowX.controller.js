const CashewFlowXCustomer = require('../models/CashewFlowXCustomer.model');
const CashewFlowXCashewType = require('../models/CashewFlowXCashewType.model');
const CashewFlowXStockEntry = require('../models/CashewFlowXStockEntry.model');
const CashewFlowXPaymentEntry = require('../models/CashewFlowXPaymentEntry.model');
const {
  CASHEW_FLOW_X_PAYMENT_MODES,
  roundCashewFlowXMoney,
  roundCashewFlowXKg,
  calculateCashewFlowXStockTotal,
  calculateCashewFlowXBalance,
} = require('../utils/cashewFlowXBalance');

// mysql2 returns DECIMAL columns as strings; normalise them for the client.
const toStockEntryDto = (row) => ({
  ...row,
  quantityKg: roundCashewFlowXKg(row.quantityKg),
  pricePerKg: roundCashewFlowXMoney(row.pricePerKg),
  totalAmount: roundCashewFlowXMoney(row.totalAmount),
});

const toPaymentEntryDto = (row) => ({
  ...row,
  paymentAmount: roundCashewFlowXMoney(row.paymentAmount),
});

const toCustomerListDto = (row) => ({
  ...row,
  totalStockKg: roundCashewFlowXKg(row.totalStockKg),
  ...calculateCashewFlowXBalance({ totalStockAmount: row.totalStockAmount, totalPaid: row.totalPaid }),
});

const notFound = (res, message) => res.status(404).json({ success: false, message });

// Merges stock and payments into one chronological history with a running balance
// (stock adds to what the customer owes, payments reduce it). Returned newest first.
const buildActivity = (stockEntries, paymentEntries) => {
  const items = [
    ...stockEntries.map((s) => ({
      activityKey: `stock-${s.id}`,
      activityType: 'STOCK_GIVEN',
      activityLabel: 'Stock Given',
      entryId: s.id,
      date: s.givenDate,
      details: `${s.cashewTypeName} - ${s.quantityKg} KG @ ₹${s.pricePerKg}/KG`,
      notes: s.notes,
      amount: s.totalAmount,
      createdAt: s.createdAt,
    })),
    ...paymentEntries.map((p) => ({
      activityKey: `payment-${p.id}`,
      activityType: 'PAYMENT_RECEIVED',
      activityLabel: 'Payment Received',
      entryId: p.id,
      date: p.paymentDate,
      details: p.referenceNumber ? `${p.paymentMode} (Ref: ${p.referenceNumber})` : p.paymentMode,
      notes: p.notes,
      amount: -p.paymentAmount,
      createdAt: p.createdAt,
    })),
  ];

  items.sort((a, b) =>
    a.date.localeCompare(b.date) ||
    new Date(a.createdAt) - new Date(b.createdAt) ||
    a.activityKey.localeCompare(b.activityKey)
  );

  let running = 0;
  for (const item of items) {
    running = roundCashewFlowXMoney(running + item.amount);
    item.runningBalance = running;
  }
  return items.reverse();
};

// ==================== CUSTOMERS ====================

class CashewFlowXCustomerController {
  async getAll(req, res, next) {
    try {
      const { search, status } = req.query;
      const rows = await CashewFlowXCustomer.getAll({
        search: search ? String(search).trim() : '',
        status: status === 'Active' || status === 'Inactive' ? status : '',
      });
      res.json({ success: true, data: rows.map(toCustomerListDto) });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const customer = await CashewFlowXCustomer.getById(req.params.id);
      if (!customer) return notFound(res, 'CashewFlowX customer not found');
      res.json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  }

  // Everything the customer view needs, all derived from the underlying records.
  async getDetails(req, res, next) {
    try {
      const customer = await CashewFlowXCustomer.getById(req.params.id);
      if (!customer) return notFound(res, 'CashewFlowX customer not found');

      const [stockRows, paymentRows, typeRows] = await Promise.all([
        CashewFlowXStockEntry.getByCustomer(customer.id),
        CashewFlowXPaymentEntry.getByCustomer(customer.id),
        CashewFlowXStockEntry.getTypeTotalsByCustomer(customer.id),
      ]);

      const stockEntries = stockRows.map(toStockEntryDto);
      const paymentEntries = paymentRows.map(toPaymentEntryDto);
      const typeTotals = typeRows.map((t) => ({
        cashewTypeId: t.cashewTypeId,
        cashewTypeName: t.cashewTypeName,
        totalKg: roundCashewFlowXKg(t.totalKg),
        totalAmount: roundCashewFlowXMoney(t.totalAmount),
        entryCount: Number(t.entryCount),
      }));

      const totalStockKg = roundCashewFlowXKg(stockEntries.reduce((sum, s) => sum + s.quantityKg, 0));
      const balance = calculateCashewFlowXBalance({
        totalStockAmount: stockEntries.reduce((sum, s) => sum + s.totalAmount, 0),
        totalPaid: paymentEntries.reduce((sum, p) => sum + p.paymentAmount, 0),
      });

      res.json({
        success: true,
        data: {
          customer,
          summary: {
            totalStockKg,
            ...balance,
            stockEntryCount: stockEntries.length,
            paymentEntryCount: paymentEntries.length,
          },
          typeTotals,
          stockEntries,
          paymentEntries,
          activity: buildActivity(stockEntries, paymentEntries),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const id = await CashewFlowXCustomer.create(req.body);
      const customer = await CashewFlowXCustomer.getById(id);
      res.status(201).json({ success: true, message: 'Customer created', data: customer });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const existing = await CashewFlowXCustomer.getById(req.params.id);
      if (!existing) return notFound(res, 'CashewFlowX customer not found');
      await CashewFlowXCustomer.update(req.params.id, { ...existing, ...req.body });
      const customer = await CashewFlowXCustomer.getById(req.params.id);
      res.json({ success: true, message: 'Customer updated', data: customer });
    } catch (error) {
      next(error);
    }
  }

  async setStatus(req, res, next) {
    try {
      const updated = await CashewFlowXCustomer.setStatus(req.params.id, req.body.status);
      if (!updated) return notFound(res, 'CashewFlowX customer not found');
      const customer = await CashewFlowXCustomer.getById(req.params.id);
      res.json({
        success: true,
        message: req.body.status === 'Active' ? 'Customer activated' : 'Customer deactivated',
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  // Hard delete is only allowed when the customer has no history; otherwise deactivate.
  async delete(req, res, next) {
    try {
      const existing = await CashewFlowXCustomer.getById(req.params.id);
      if (!existing) return notFound(res, 'CashewFlowX customer not found');

      const { stockCount, paymentCount } = await CashewFlowXCustomer.countEntries(existing.id);
      if (stockCount > 0 || paymentCount > 0) {
        return res.status(409).json({
          success: false,
          message: `Cannot delete: customer has ${stockCount} stock and ${paymentCount} payment entries. Deactivate the customer instead.`,
        });
      }

      await CashewFlowXCustomer.delete(existing.id);
      res.json({ success: true, message: 'Customer deleted' });
    } catch (error) {
      next(error);
    }
  }
}

// ==================== CASHEW TYPES ====================

class CashewFlowXCashewTypeController {
  async getAll(req, res, next) {
    try {
      const rows = await CashewFlowXCashewType.getAll({ includeInactive: req.query.includeInactive === 'true' });
      res.json({ success: true, data: rows.map((r) => ({ ...r, usageCount: Number(r.usageCount) })) });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      if (await CashewFlowXCashewType.findByName(req.body.cashewTypeName)) {
        return res.status(409).json({ success: false, message: 'A cashew type with this name already exists' });
      }
      const id = await CashewFlowXCashewType.create(req.body);
      const cashewType = await CashewFlowXCashewType.getById(id);
      res.status(201).json({ success: true, message: 'Cashew type created', data: cashewType });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const existing = await CashewFlowXCashewType.getById(req.params.id);
      if (!existing) return notFound(res, 'Cashew type not found');

      const data = { ...existing, ...req.body };
      if (await CashewFlowXCashewType.findByName(data.cashewTypeName, existing.id)) {
        return res.status(409).json({ success: false, message: 'A cashew type with this name already exists' });
      }
      await CashewFlowXCashewType.update(existing.id, data);
      const cashewType = await CashewFlowXCashewType.getById(existing.id);
      res.json({ success: true, message: 'Cashew type updated', data: cashewType });
    } catch (error) {
      next(error);
    }
  }

  // Types already used by stock entries can only be deactivated, so history stays intact.
  async delete(req, res, next) {
    try {
      const existing = await CashewFlowXCashewType.getById(req.params.id);
      if (!existing) return notFound(res, 'Cashew type not found');

      const usage = await CashewFlowXCashewType.countUsage(existing.id);
      if (usage > 0) {
        return res.status(409).json({
          success: false,
          message: `Cannot delete: "${existing.cashewTypeName}" is used in ${usage} stock entries. Deactivate it instead.`,
        });
      }

      await CashewFlowXCashewType.delete(existing.id);
      res.json({ success: true, message: 'Cashew type deleted' });
    } catch (error) {
      next(error);
    }
  }
}

// ==================== STOCK ENTRIES ====================

const validateStockReferences = async (res, { customerId, cashewTypeId }, currentCashewTypeId = null) => {
  if (customerId !== undefined && !(await CashewFlowXCustomer.getById(customerId))) {
    res.status(400).json({ success: false, message: 'Selected customer does not exist' });
    return false;
  }
  const cashewType = await CashewFlowXCashewType.getById(cashewTypeId);
  if (!cashewType) {
    res.status(400).json({ success: false, message: 'Selected cashew type does not exist' });
    return false;
  }
  // An inactive type may stay on an entry that already uses it, but not be newly chosen.
  if (cashewType.status !== 'Active' && Number(cashewTypeId) !== Number(currentCashewTypeId)) {
    res.status(400).json({ success: false, message: `Cashew type "${cashewType.cashewTypeName}" is inactive` });
    return false;
  }
  return true;
};

// Builds the stored values; Total Amount is always calculated here, never accepted from the client.
const buildStockValues = (body) => {
  const quantityKg = roundCashewFlowXKg(body.quantityKg);
  const pricePerKg = roundCashewFlowXMoney(body.pricePerKg);
  return {
    cashewTypeId: Number(body.cashewTypeId),
    quantityKg,
    pricePerKg,
    totalAmount: calculateCashewFlowXStockTotal(quantityKg, pricePerKg),
    givenDate: String(body.givenDate).slice(0, 10),
    notes: body.notes ? String(body.notes).trim() : null,
  };
};

class CashewFlowXStockEntryController {
  async create(req, res, next) {
    try {
      if (!(await validateStockReferences(res, req.body))) return;
      const values = { customerId: Number(req.body.customerId), ...buildStockValues(req.body) };
      const id = await CashewFlowXStockEntry.create(values);
      const entry = await CashewFlowXStockEntry.getById(id);
      res.status(201).json({ success: true, message: 'Stock entry saved', data: toStockEntryDto(entry) });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const existing = await CashewFlowXStockEntry.getById(req.params.id);
      if (!existing) return notFound(res, 'Stock entry not found');
      if (!(await validateStockReferences(res, { cashewTypeId: req.body.cashewTypeId }, existing.cashewTypeId))) return;

      await CashewFlowXStockEntry.update(existing.id, buildStockValues(req.body));
      const entry = await CashewFlowXStockEntry.getById(existing.id);
      res.json({ success: true, message: 'Stock entry updated', data: toStockEntryDto(entry) });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const deleted = await CashewFlowXStockEntry.delete(req.params.id);
      if (!deleted) return notFound(res, 'Stock entry not found');
      res.json({ success: true, message: 'Stock entry deleted' });
    } catch (error) {
      next(error);
    }
  }
}

// ==================== PAYMENT ENTRIES ====================

const buildPaymentValues = (body) => ({
  paymentAmount: roundCashewFlowXMoney(body.paymentAmount),
  paymentDate: String(body.paymentDate).slice(0, 10),
  paymentMode: body.paymentMode,
  referenceNumber: body.referenceNumber ? String(body.referenceNumber).trim() : null,
  notes: body.notes ? String(body.notes).trim() : null,
});

class CashewFlowXPaymentEntryController {
  getPaymentModes(req, res) {
    res.json({ success: true, data: CASHEW_FLOW_X_PAYMENT_MODES });
  }

  async create(req, res, next) {
    try {
      if (!(await CashewFlowXCustomer.getById(req.body.customerId))) {
        return res.status(400).json({ success: false, message: 'Selected customer does not exist' });
      }
      const id = await CashewFlowXPaymentEntry.create({
        customerId: Number(req.body.customerId),
        ...buildPaymentValues(req.body),
      });
      const entry = await CashewFlowXPaymentEntry.getById(id);
      res.status(201).json({ success: true, message: 'Payment saved', data: toPaymentEntryDto(entry) });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const existing = await CashewFlowXPaymentEntry.getById(req.params.id);
      if (!existing) return notFound(res, 'Payment entry not found');
      await CashewFlowXPaymentEntry.update(existing.id, buildPaymentValues(req.body));
      const entry = await CashewFlowXPaymentEntry.getById(existing.id);
      res.json({ success: true, message: 'Payment updated', data: toPaymentEntryDto(entry) });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const deleted = await CashewFlowXPaymentEntry.delete(req.params.id);
      if (!deleted) return notFound(res, 'Payment entry not found');
      res.json({ success: true, message: 'Payment deleted' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = {
  CashewFlowXCustomerController: new CashewFlowXCustomerController(),
  CashewFlowXCashewTypeController: new CashewFlowXCashewTypeController(),
  CashewFlowXStockEntryController: new CashewFlowXStockEntryController(),
  CashewFlowXPaymentEntryController: new CashewFlowXPaymentEntryController(),
  // Exported for unit tests.
  buildCashewFlowXActivity: buildActivity,
};
