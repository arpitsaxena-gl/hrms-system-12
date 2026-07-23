const Setting = require('../models/Setting');
const ApiResponse = require('../utils/apiResponse');
const { createError } = require('../utils/helpers');

const getSettings = async (req, res, next) => {
  try {
    const { group } = req.query;
    let query = {};
    if (group) query.group = group;
    if (!['admin', 'hr'].includes(req.user.role)) query.isPublic = true;
    const settings = await Setting.find(query);
    const settingsMap = {};
    settings.forEach(s => { settingsMap[s.key] = s.value; });
    ApiResponse.success(res, settingsMap);
  } catch (err) { next(err); }
};

const updateSetting = async (req, res, next) => {
  try {
    const { key, value } = req.body;
    const setting = await Setting.findOneAndUpdate({ key }, { value, updatedBy: req.user._id }, { new: true, upsert: true, runValidators: true });
    ApiResponse.success(res, setting, 'Setting updated');
  } catch (err) { next(err); }
};

const bulkUpdateSettings = async (req, res, next) => {
  try {
    const { settings } = req.body;
    const results = await Promise.allSettled(
      Object.entries(settings).map(([key, value]) =>
        Setting.findOneAndUpdate({ key }, { value, updatedBy: req.user._id }, { new: true, upsert: true })
      )
    );
    ApiResponse.success(res, null, `${results.filter(r => r.status === 'fulfilled').length} settings updated`);
  } catch (err) { next(err); }
};

module.exports = { getSettings, updateSetting, bulkUpdateSettings };
