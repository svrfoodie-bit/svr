const Settings = require('../models/Settings.model');

const getSettings = async (req, res) => {
  try {
    const settings = await Settings.get();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const saveSection = async (req, res) => {
  try {
    const { section } = req.params;
    const settings = await Settings.save(section, req.body);
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getSettings, saveSection };
