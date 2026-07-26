const Lead = require('../models/Lead.model');
const { LeadCampaign, LeadTemplate } = require('../models/LeadCampaign.model');

class LeadController {
  async getAll(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        campaignId: req.query.campaignId,
        waSent: req.query.waSent,
        search: req.query.search,
        limit: req.query.limit,
        page: req.query.page
      };
      const leads = await Lead.getAll(filters);
      res.json({ success: true, data: leads });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const lead = await Lead.getById(req.params.id);
      if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found' });
      }
      res.json({ success: true, data: lead });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const id = await Lead.create(req.body);
      const lead = await Lead.getById(id);
      res.status(201).json({ success: true, message: 'Lead created', data: lead });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const success = await Lead.update(req.params.id, req.body);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Lead not found' });
      }
      const lead = await Lead.getById(req.params.id);
      res.json({ success: true, message: 'Lead updated', data: lead });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const success = await Lead.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Lead not found' });
      }
      res.json({ success: true, message: 'Lead deleted' });
    } catch (error) {
      next(error);
    }
  }

  async deleteMany(req, res, next) {
    try {
      const { ids } = req.body;
      const count = await Lead.deleteMany(ids);
      res.json({ success: true, message: `${count} leads deleted` });
    } catch (error) {
      next(error);
    }
  }

  async bulkCreate(req, res, next) {
    try {
      const { leads } = req.body;
      const result = await Lead.bulkCreate(leads);
      res.json({ success: true, message: `${result.imported} leads imported, ${result.skipped} skipped`, ...result });
    } catch (error) {
      next(error);
    }
  }

  async markSent(req, res, next) {
    try {
      const { ids } = req.body;
      const count = await Lead.markSent(ids);
      res.json({ success: true, message: `${count} leads marked as sent` });
    } catch (error) {
      next(error);
    }
  }

  async clearAll(req, res, next) {
    try {
      const count = await Lead.clearAll();
      res.json({ success: true, message: `${count} leads deleted` });
    } catch (error) {
      next(error);
    }
  }
}

class LeadCampaignController {
  async getAll(req, res, next) {
    try {
      const campaigns = await LeadCampaign.getAll();
      res.json({ success: true, data: campaigns });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const id = await LeadCampaign.create(req.body);
      const campaign = await LeadCampaign.getById(id);
      res.status(201).json({ success: true, message: 'Campaign created', data: campaign });
    } catch (error) {
      next(error);
    }
  }

  async markSent(req, res, next) {
    try {
      const { contactId } = req.body;
      const campaign = await LeadCampaign.markSent(req.params.id, contactId);
      res.json({ success: true, data: campaign });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const success = await LeadCampaign.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Campaign not found' });
      }
      res.json({ success: true, message: 'Campaign deleted' });
    } catch (error) {
      next(error);
    }
  }
}

class LeadTemplateController {
  async getAll(req, res, next) {
    try {
      const templates = await LeadTemplate.getAll();
      res.json({ success: true, data: templates });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const id = await LeadTemplate.create(req.body);
      res.status(201).json({ success: true, message: 'Template created', id });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const success = await LeadTemplate.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Template not found' });
      }
      res.json({ success: true, message: 'Template deleted' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { LeadController: new LeadController(), LeadCampaignController: new LeadCampaignController(), LeadTemplateController: new LeadTemplateController() };
