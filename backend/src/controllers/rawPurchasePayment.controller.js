const RawPurchasePayment = require('../models/RawPurchasePayment.model');
const RawPurchase = require('../models/RawPurchase.model');

class RawPurchasePaymentController {
  async getAll(req, res, next) {
    try {
      const filters = {
        rawPurchaseId: req.query.rawPurchaseId,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const payments = await RawPurchasePayment.getAll(filters);
      res.json({ success: true, data: payments });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const payment = await RawPurchasePayment.getById(req.params.id);
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }
      res.json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      // Verify raw purchase exists
      const purchase = await RawPurchase.getById(req.body.rawPurchaseId);
      if (!purchase) {
        return res.status(404).json({ success: false, message: 'Raw purchase not found' });
      }

      const paymentModeMap = {
        Cash: 'Cash',
        PhonePe: 'UPI',
        Bank: 'Bank Transfer',
        'Bank Transfer': 'Bank Transfer',
      };

      const payload = {
        ...req.body,
        amount: req.body.amount ?? req.body.paidAmount,
        paymentMode: paymentModeMap[req.body.paymentMode] || req.body.paymentMode,
        reference: req.body.transactionId || req.body.reference || null,
        notes: req.body.remarks || req.body.notes || null,
      };

      const id = await RawPurchasePayment.create(payload);
      const payment = await RawPurchasePayment.getById(id);
      res.status(201).json({ success: true, message: 'Payment recorded', data: payment });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const paymentModeMap = {
        Cash: 'Cash',
        PhonePe: 'UPI',
        UPI: 'UPI',
        Bank: 'Bank Transfer',
        'Bank Transfer': 'Bank Transfer',
        Cheque: 'Cheque',
      };

      const payload = {
        ...req.body,
        amount: req.body.amount ?? req.body.paidAmount,
        paymentMode: req.body.paymentMode ? (paymentModeMap[req.body.paymentMode] || req.body.paymentMode) : undefined,
        reference: req.body.transactionId || req.body.reference || null,
        notes: req.body.remarks || req.body.notes || null,
      };

      Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

      const success = await RawPurchasePayment.update(req.params.id, payload);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }
      const payment = await RawPurchasePayment.getById(req.params.id);
      res.json({ success: true, message: 'Payment updated', data: payment });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const success = await RawPurchasePayment.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }
      res.json({ success: true, message: 'Payment deleted' });
    } catch (error) {
      next(error);
    }
  }

  async getByRawPurchaseId(req, res, next) {
    try {
      const payments = await RawPurchasePayment.getByRawPurchaseId(req.params.rawPurchaseId);
      res.json({ success: true, data: payments });
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req, res, next) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const summary = await RawPurchasePayment.getSummary(filters);
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RawPurchasePaymentController();
