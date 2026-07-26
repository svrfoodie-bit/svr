const GradePriceList = require('../models/GradePriceList.model');

GradePriceList.createTable().catch(console.error);

class GradeController {
  async getAll(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const grades = await GradePriceList.getAll(includeInactive);
      res.json({ success: true, data: grades });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const grade = await GradePriceList.getById(req.params.id);
      if (!grade) {
        return res.status(404).json({ success: false, message: 'Grade not found' });
      }
      res.json({ success: true, data: grade });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const success = await GradePriceList.update(req.params.id, req.body);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Grade not found or no changes' });
      }
      const grade = await GradePriceList.getById(req.params.id);
      res.json({ success: true, message: 'Grade price updated', data: grade });
    } catch (error) {
      next(error);
    }
  }

  async getStockSummary(req, res, next) {
    try {
      const summary = await GradePriceList.getGradeStockSummary();
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }

  async getSalesSummary(req, res, next) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };
      const summary = await GradePriceList.getGradeSalesSummary(filters);
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GradeController();
