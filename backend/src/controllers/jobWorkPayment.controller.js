const JobWorkPayment = require('../models/JobWorkPayment.model');
const JobWork = require('../models/JobWork.model');

const DB_TO_UI_PAYMENT_MODE = {
  UPI: 'PhonePe',
  'Bank Transfer': 'Bank',
};

const UI_TO_DB_PAYMENT_MODE = {
  Cash: 'Cash',
  PhonePe: 'UPI',
  Bank: 'Bank Transfer',
  UPI: 'UPI',
  'Bank Transfer': 'Bank Transfer',
  Cheque: 'Cheque',
};

const normalizePayment = (payment) => {
  if (!payment) return payment;

  return {
    ...payment,
    paidAmount: Number(payment.amount || 0),
    transactionId: payment.reference || null,
    remarks: payment.notes || null,
    paymentMode: DB_TO_UI_PAYMENT_MODE[payment.paymentMode] || payment.paymentMode,
  };
};

class JobWorkPaymentController {
  async getAll(req, res, next) {
    try {
      const filters = {
        jobWorkId: req.query.jobWorkId,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const payments = await JobWorkPayment.getAll(filters);
      res.json({ success: true, data: payments.map(normalizePayment) });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const payment = normalizePayment(await JobWorkPayment.getById(req.params.id));
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
      // Verify job work exists
      const jobWork = await JobWork.getById(req.body.jobWorkId);
      if (!jobWork) {
        return res.status(404).json({ success: false, message: 'Job work not found' });
      }

      const payload = {
        ...req.body,
        amount: req.body.amount ?? req.body.paidAmount,
        paymentMode: UI_TO_DB_PAYMENT_MODE[req.body.paymentMode] || req.body.paymentMode,
        reference: req.body.reference ?? req.body.transactionId ?? null,
        notes: req.body.notes ?? req.body.remarks ?? null,
      };

      const id = await JobWorkPayment.create(payload);
      const payment = normalizePayment(await JobWorkPayment.getById(id));
      res.status(201).json({ success: true, message: 'Payment recorded', data: payment });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const payload = {
        ...req.body,
        amount: req.body.amount ?? req.body.paidAmount,
        paymentMode: req.body.paymentMode ? (UI_TO_DB_PAYMENT_MODE[req.body.paymentMode] || req.body.paymentMode) : undefined,
        reference: req.body.reference ?? req.body.transactionId,
        notes: req.body.notes ?? req.body.remarks,
      };

      const success = await JobWorkPayment.update(req.params.id, payload);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }
      const payment = normalizePayment(await JobWorkPayment.getById(req.params.id));
      res.json({ success: true, message: 'Payment updated', data: payment });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const success = await JobWorkPayment.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }
      res.json({ success: true, message: 'Payment deleted' });
    } catch (error) {
      next(error);
    }
  }

  async getByJobWorkId(req, res, next) {
    try {
      const payments = await JobWorkPayment.getByJobWorkId(req.params.jobWorkId);
      res.json({ success: true, data: payments.map(normalizePayment) });
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
      const summary = await JobWorkPayment.getSummary(filters);
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new JobWorkPaymentController();
