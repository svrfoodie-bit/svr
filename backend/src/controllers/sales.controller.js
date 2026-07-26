const SalesOrder = require('../models/SalesOrder.model');
const SalesPayment = require('../models/SalesPayment.model');
const Expense = require('../models/Expense.model');

class SalesOrderController {
  async getAll(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        customerId: req.query.customerId,
        paymentType: req.query.paymentType,
        paymentStatus: req.query.paymentStatus,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const orders = await SalesOrder.getAll(filters);
      res.json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const order = await SalesOrder.getById(req.params.id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const id = await SalesOrder.create(req.body);
      const order = await SalesOrder.getById(id);
      res.status(201).json({ success: true, message: 'Order created', data: order });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const success = await SalesOrder.update(req.params.id, req.body);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      const order = await SalesOrder.getById(req.params.id);
      res.json({ success: true, message: 'Order updated', data: order });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const success = await SalesOrder.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      res.json({ success: true, message: 'Order deleted' });
    } catch (error) {
      next(error);
    }
  }

  async getOutstanding(req, res, next) {
    try {
      const data = await SalesOrder.getOutstanding();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getCustomerWiseSummary(req, res, next) {
    try {
      const data = await SalesOrder.getCustomerWiseSummary();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getGradeWiseSummary(req, res, next) {
    try {
      const data = await SalesOrder.getGradeWiseSummary();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req, res, next) {
    try {
      const filters = {
        paymentType: req.query.paymentType,
        paymentStatus: req.query.paymentStatus,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const summary = await SalesOrder.getSummary(filters);
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }
}

class SalesPaymentController {
  async getAll(req, res, next) {
    try {
      const filters = {
        salesOrderId: req.query.salesOrderId,
        orderId: req.query.orderId,
        paymentMode: req.query.paymentMode,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const payments = await SalesPayment.getAll(filters);
      res.json({ success: true, data: payments });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const payment = await SalesPayment.getById(req.params.id);
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
      const id = await SalesPayment.create(req.body);
      const payment = await SalesPayment.getById(id);
      res.status(201).json({ success: true, message: 'Payment recorded', data: payment });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const success = await SalesPayment.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }
      res.json({ success: true, message: 'Payment deleted' });
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req, res, next) {
    try {
      const filters = {
        paymentMode: req.query.paymentMode,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const summary = await SalesPayment.getSummary(filters);
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }
}

class ExpenseController {
  async getAll(req, res, next) {
    try {
      const filters = {
        category: req.query.category,
        paymentMode: req.query.paymentMode,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        timeRange: req.query.timeRange,
      };
      const expenses = await Expense.getAll(filters);
      res.json({ success: true, data: expenses });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const expense = await Expense.getById(req.params.id);
      if (!expense) {
        return res.status(404).json({ success: false, message: 'Expense not found' });
      }
      res.json({ success: true, data: expense });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const id = await Expense.create(req.body);
      const expense = await Expense.getById(id);
      res.status(201).json({ success: true, message: 'Expense created', data: expense });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const success = await Expense.update(req.params.id, req.body);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Expense not found' });
      }
      const expense = await Expense.getById(req.params.id);
      res.json({ success: true, message: 'Expense updated', data: expense });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const success = await Expense.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Expense not found' });
      }
      res.json({ success: true, message: 'Expense deleted' });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryWiseSummary(req, res, next) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const data = await Expense.getCategoryWiseSummary(filters);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentModeWiseSummary(req, res, next) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const data = await Expense.getPaymentModeWiseSummary(filters);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getSummaryMetrics(req, res, next) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const data = await Expense.getSummaryMetrics(filters);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  getCategories(req, res) {
    res.json({ success: true, data: Expense.getCategories() });
  }
}

module.exports = { SalesOrderController: new SalesOrderController(), SalesPaymentController: new SalesPaymentController(), ExpenseController: new ExpenseController() };
