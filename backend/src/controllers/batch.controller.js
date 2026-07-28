const JobWork = require('../models/JobWork.model');
const ProcessingBatch = require('../models/ProcessingBatch.model');

class JobWorkController {
  async getAll(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        cashewType: req.query.cashewType,
        paymentStatus: req.query.paymentStatus,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const works = await JobWork.getAll(filters);
      res.json({ success: true, data: works });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const work = await JobWork.getById(req.params.id);
      if (!work) {
        return res.status(404).json({ success: false, message: 'Job work not found' });
      }
      res.json({ success: true, data: work });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const id = await JobWork.create(req.body);
      const work = await JobWork.getById(id);
      res.status(201).json({ success: true, message: 'Job work created', data: work });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const success = await JobWork.update(req.params.id, req.body);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Job work not found' });
      }
      const work = await JobWork.getById(req.params.id);
      res.json({ success: true, message: 'Job work updated', data: work });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const success = await JobWork.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Job work not found' });
      }
      res.json({ success: true, message: 'Job work deleted' });
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req, res, next) {
    try {
      const filters = {
        cashewType: req.query.cashewType,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const summary = await JobWork.getSummary(filters);
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }
}

class ProcessingBatchController {
  async getAll(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        rawType: req.query.rawType,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const batches = await ProcessingBatch.getAll(filters);
      res.json({ success: true, data: batches });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const batch = await ProcessingBatch.getById(req.params.id);
      if (!batch) {
        return res.status(404).json({ success: false, message: 'Batch not found' });
      }
      res.json({ success: true, data: batch });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const id = await ProcessingBatch.create(req.body);
      const batch = await ProcessingBatch.getById(id);
      res.status(201).json({ success: true, message: 'Batch created', data: batch });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const success = await ProcessingBatch.update(req.params.id, req.body);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Batch not found' });
      }
      const batch = await ProcessingBatch.getById(req.params.id);
      res.json({ success: true, message: 'Batch updated', data: batch });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const success = await ProcessingBatch.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Batch not found' });
      }
      res.json({ success: true, message: 'Batch deleted' });
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        rawType: req.query.rawType,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const summary = await ProcessingBatch.getSummary(filters);
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }

  getGrades(req, res) {
    res.json({ success: true, data: ProcessingBatch.getGrades() });
  }
}

module.exports = { JobWorkController: new JobWorkController(), ProcessingBatchController: new ProcessingBatchController() };
