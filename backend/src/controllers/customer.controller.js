const Customer = require('../models/Customer.model');
const { auditLog } = require('../utils/auditLogger');

class CustomerController {
  async getAll(req, res, next) {
    try {
      const filters = {
        type: req.query.type,
        isActive: req.query.isActive,
        area: req.query.area,
        search: req.query.search
      };
      const customers = await Customer.getAll(filters);
      res.json({ success: true, data: customers });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const customer = await Customer.getById(req.params.id);
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }
      res.json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const id = await Customer.create(req.body);
      const customer = await Customer.getById(id);
      auditLog({ user: req.user, action: 'CREATE', entity: 'customers', entityId: id, entityLabel: customer.name, ip: req.ip });
      res.status(201).json({ success: true, message: 'Customer created', data: customer });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const success = await Customer.update(req.params.id, req.body);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }
      const customer = await Customer.getById(req.params.id);
      auditLog({ user: req.user, action: 'UPDATE', entity: 'customers', entityId: req.params.id, entityLabel: customer.name, ip: req.ip });
      res.json({ success: true, message: 'Customer updated', data: customer });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const customer = await Customer.getById(req.params.id);
      const success = await Customer.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }
      auditLog({ user: req.user, action: 'DELETE', entity: 'customers', entityId: req.params.id, entityLabel: customer?.name, ip: req.ip });
      res.json({ success: true, message: 'Customer archived' });
    } catch (error) {
      next(error);
    }
  }

  async restore(req, res, next) {
    try {
      const success = await Customer.restore(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }
      auditLog({ user: req.user, action: 'UPDATE', entity: 'customers', entityId: req.params.id, entityLabel: 'Restored customer', ip: req.ip });
      res.json({ success: true, message: 'Customer restored' });
    } catch (error) {
      next(error);
    }
  }

  async getOutstanding(req, res, next) {
    try {
      const data = await Customer.getOutstanding();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CustomerController();
