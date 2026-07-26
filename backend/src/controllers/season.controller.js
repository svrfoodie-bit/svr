const Season = require('../models/Season.model');

Season.createTable().catch(console.error);

class SeasonController {
  async getAll(req, res, next) {
    try {
      const seasons = await Season.getAll();
      res.json({ success: true, data: seasons });
    } catch (error) { next(error); }
  }

  async getById(req, res, next) {
    try {
      const season = await Season.getById(req.params.id);
      if (!season) return res.status(404).json({ success: false, message: 'Season not found' });
      res.json({ success: true, data: season });
    } catch (error) { next(error); }
  }

  async create(req, res, next) {
    try {
      const id = await Season.create({ ...req.body, createdBy: req.user?.id || 1 });
      const season = await Season.getById(id);
      res.status(201).json({ success: true, message: 'Season created', data: season });
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const success = await Season.update(req.params.id, req.body);
      if (!success) return res.status(404).json({ success: false, message: 'Season not found' });
      const season = await Season.getById(req.params.id);
      res.json({ success: true, message: 'Season updated', data: season });
    } catch (error) { next(error); }
  }

  async delete(req, res, next) {
    try {
      const success = await Season.delete(req.params.id);
      if (!success) return res.status(404).json({ success: false, message: 'Season not found' });
      res.json({ success: true, message: 'Season deleted' });
    } catch (error) { next(error); }
  }
}

module.exports = new SeasonController();
