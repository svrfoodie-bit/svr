const RawPurchase = require('../models/RawPurchase.model');
const RawPurchasePayment = require('../models/RawPurchasePayment.model');

// Add fundedByLoan columns if they don't exist
RawPurchase.migrate().catch(console.error);

const DB_TO_UI_PAYMENT_MODE = {
  UPI: 'PhonePe',
  'Bank Transfer': 'Bank',
};

const normalizePayment = (payment) => ({
  ...payment,
  paidAmount: Number(payment.amount || 0),
  transactionId: payment.reference || null,
  remarks: payment.notes || null,
  paymentMode: DB_TO_UI_PAYMENT_MODE[payment.paymentMode] || payment.paymentMode,
});

class RawPurchaseController {
  async getAll(req, res, next) {
    try {
      const filters = {
        supplierId: req.query.supplierId,
        quality: req.query.quality,
        rawQuality: req.query.rawQuality,
        paymentStatus: req.query.paymentStatus,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const purchases = await RawPurchase.getAll(filters);
      res.json({ success: true, data: purchases });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const purchase = await RawPurchase.getById(req.params.id);
      if (!purchase) {
        return res.status(404).json({ success: false, message: 'Purchase not found' });
      }
      const payments = await RawPurchasePayment.getByRawPurchaseId(req.params.id);
      res.json({ success: true, data: { ...purchase, payments: payments.map(normalizePayment) } });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const paymentData = req.body.payment;
      const purchasePayload = { ...req.body };
      delete purchasePayload.payment;

      const id = await RawPurchase.create(purchasePayload);

      if (paymentData) {
        const paymentModeMap = {
          Cash: 'Cash',
          PhonePe: 'UPI',
          Bank: 'Bank Transfer'
        };

        await RawPurchasePayment.create({
          rawPurchaseId: id,
          paymentDate: paymentData.paymentDate,
          amount: paymentData.paidAmount,
          paymentMode: paymentModeMap[paymentData.paymentMode] || paymentData.paymentMode,
          reference: paymentData.transactionId || null,
          notes: paymentData.remarks || null,
          createdBy: req.user?.id || 1
        });
      }

      const purchase = await RawPurchase.getById(id);
      res.status(201).json({ success: true, message: 'Purchase created', data: purchase });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const success = await RawPurchase.update(req.params.id, req.body);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Purchase not found' });
      }
      const purchase = await RawPurchase.getById(req.params.id);
      res.json({ success: true, message: 'Purchase updated', data: purchase });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const success = await RawPurchase.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Purchase not found' });
      }
      res.json({ success: true, message: 'Purchase deleted' });
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
      const summary = await RawPurchase.getSummary(filters);
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RawPurchaseController();
