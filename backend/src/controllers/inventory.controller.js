const FinishedGoodsStock = require('../models/FinishedGoodsStock.model');
const WorkerAdvance = require('../models/WorkerAdvance.model');
const Supplier = require('../models/Supplier.model');

FinishedGoodsStock.migrate().catch(console.error);

class FinishedGoodsStockController {
  async getAll(req, res, next) {
    try {
      const filters = {
        grade: req.query.grade,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const stocks = await FinishedGoodsStock.getAll(filters);
      res.json({ success: true, data: stocks });
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req, res, next) {
    try {
      const data = await FinishedGoodsStock.getSummary();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getGradeStock(req, res, next) {
    try {
      const grade = req.params.grade;
      const stock = await FinishedGoodsStock.getGradeStock(grade);
      res.json({ success: true, data: { grade, stock } });
    } catch (error) {
      next(error);
    }
  }

  async getAdjustments(req, res, next) {
    try {
      const filters = {
        grade: req.query.grade,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const adjustments = await FinishedGoodsStock.getAdjustments(filters);
      res.json({ success: true, data: adjustments });
    } catch (error) {
      next(error);
    }
  }

  async recordAdjustment(req, res, next) {
    try {
      const id = await FinishedGoodsStock.recordAdjustment(req.body);
      res.status(201).json({ success: true, message: 'Adjustment recorded', id });
    } catch (error) {
      next(error);
    }
  }

  async addStock(req, res, next) {
    try {
      const id = await FinishedGoodsStock.create(req.body);
      res.status(201).json({ success: true, message: 'Stock added', id });
    } catch (error) {
      next(error);
    }
  }
}

class WorkerAdvanceController {
  async getAll(req, res, next) {
    try {
      const filters = {
        workerId: req.query.workerId,
        status: req.query.status
      };
      const advances = await WorkerAdvance.getAll(filters);
      res.json({ success: true, data: advances });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const advance = await WorkerAdvance.getById(req.params.id);
      if (!advance) {
        return res.status(404).json({ success: false, message: 'Advance not found' });
      }
      res.json({ success: true, data: advance });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const id = await WorkerAdvance.create(req.body);
      const advance = await WorkerAdvance.getById(id);
      res.status(201).json({ success: true, message: 'Advance created', data: advance });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const success = await WorkerAdvance.update(req.params.id, req.body);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Advance not found' });
      }
      const advance = await WorkerAdvance.getById(req.params.id);
      res.json({ success: true, message: 'Advance updated', data: advance });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const success = await WorkerAdvance.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Advance not found' });
      }
      res.json({ success: true, message: 'Advance deleted' });
    } catch (error) {
      next(error);
    }
  }

  async getWorkerOutstanding(req, res, next) {
    try {
      const outstanding = await WorkerAdvance.getWorkerOutstanding(req.params.workerId);
      res.json({ success: true, data: { outstanding } });
    } catch (error) {
      next(error);
    }
  }
}

class SupplierController {
  async getAll(req, res, next) {
    try {
      const filters = {
        isActive: req.query.isActive,
        area: req.query.area,
        search: req.query.search
      };
      const suppliers = await Supplier.getAll(filters);
      res.json({ success: true, data: suppliers });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const supplier = await Supplier.getById(req.params.id);
      if (!supplier) {
        return res.status(404).json({ success: false, message: 'Supplier not found' });
      }
      res.json({ success: true, data: supplier });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const id = await Supplier.create(req.body);
      const supplier = await Supplier.getById(id);
      res.status(201).json({ success: true, message: 'Supplier created', data: supplier });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const success = await Supplier.update(req.params.id, req.body);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Supplier not found' });
      }
      const supplier = await Supplier.getById(req.params.id);
      res.json({ success: true, message: 'Supplier updated', data: supplier });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const success = await Supplier.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Supplier not found' });
      }
      res.json({ success: true, message: 'Supplier archived' });
    } catch (error) {
      next(error);
    }
  }

  async restore(req, res, next) {
    try {
      const success = await Supplier.restore(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Supplier not found' });
      }
      res.json({ success: true, message: 'Supplier restored' });
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
      const data = await Supplier.getSummary(filters);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { FinishedGoodsStockController: new FinishedGoodsStockController(), WorkerAdvanceController: new WorkerAdvanceController(), SupplierController: new SupplierController() };
