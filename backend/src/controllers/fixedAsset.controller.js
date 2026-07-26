const { FixedAsset } = require('../models/FixedAsset.model');

// Init table on startup
FixedAsset.createTable().catch(console.error);

exports.getAll = async (req, res) => {
  try {
    const assets = await FixedAsset.getAll(req.query);
    res.json({ success: true, data: assets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch fixed assets' });
  }
};

exports.getById = async (req, res) => {
  try {
    const asset = await FixedAsset.getById(req.params.id);
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
    res.json({ success: true, data: asset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch asset' });
  }
};

exports.create = async (req, res) => {
  try {
    const id    = await FixedAsset.create({ ...req.body, createdBy: req.user?.id || 1 });
    const asset = await FixedAsset.getById(id);
    res.status(201).json({ success: true, data: asset, message: 'Fixed asset recorded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create fixed asset' });
  }
};

exports.update = async (req, res) => {
  try {
    const updated = await FixedAsset.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Asset not found' });
    const asset = await FixedAsset.getById(req.params.id);
    res.json({ success: true, data: asset, message: 'Fixed asset updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update fixed asset' });
  }
};

exports.remove = async (req, res) => {
  try {
    const deleted = await FixedAsset.delete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Asset not found' });
    res.json({ success: true, message: 'Fixed asset deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete fixed asset' });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const summary = await FixedAsset.getSummary();
    res.json({ success: true, data: summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch summary' });
  }
};
