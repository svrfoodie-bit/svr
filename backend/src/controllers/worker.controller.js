const Worker = require('../models/Worker.model');
const DailyWork = require('../models/DailyWork.model');

class WorkerController {
  async getAll(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        areaOfWork: req.query.areaOfWork,
        search: req.query.search
      };
      const workers = await Worker.getAll(filters);
      res.json({ success: true, data: workers });
    } catch (error) {
      next(error);
    }
  }

  async getActive(req, res, next) {
    try {
      const workers = await Worker.getActive();
      res.json({ success: true, data: workers });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const worker = await Worker.getById(req.params.id);
      if (!worker) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }
      res.json({ success: true, data: worker });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const id = await Worker.create(req.body);
      const worker = await Worker.getById(id);
      res.status(201).json({ success: true, message: 'Worker created', data: worker });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const success = await Worker.update(req.params.id, req.body);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }
      const worker = await Worker.getById(req.params.id);
      res.json({ success: true, message: 'Worker updated', data: worker });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const success = await Worker.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }
      res.json({ success: true, message: 'Worker deleted' });
    } catch (error) {
      next(error);
    }
  }
}

class DailyWorkController {
  async getAll(req, res, next) {
    try {
      const filters = {
        workerId: req.query.workerId,
        workType: req.query.workType,
        status: req.query.status,
        date: req.query.date,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const works = await DailyWork.getAll(filters);
      res.json({ success: true, data: works });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const work = await DailyWork.getById(req.params.id);
      if (!work) {
        return res.status(404).json({ success: false, message: 'Daily work not found' });
      }
      res.json({ success: true, data: work });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const id = await DailyWork.create(req.body);
      const work = await DailyWork.getById(id);
      res.status(201).json({ success: true, message: 'Daily work created', data: work });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const success = await DailyWork.update(req.params.id, req.body);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Daily work not found' });
      }
      const work = await DailyWork.getById(req.params.id);
      res.json({ success: true, message: 'Daily work updated', data: work });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const success = await DailyWork.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Daily work not found' });
      }
      res.json({ success: true, message: 'Daily work deleted' });
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req, res, next) {
    try {
      const filters = {
        workerId: req.query.workerId,
        workType: req.query.workType,
        status: req.query.status,
        date: req.query.date,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const summary = await DailyWork.getSummary(filters);
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }

  getWorkTypes(req, res) {
    res.json({ success: true, data: DailyWork.getAllWorkTypes() });
  }
}

module.exports = { WorkerController: new WorkerController(), DailyWorkController: new DailyWorkController() };
