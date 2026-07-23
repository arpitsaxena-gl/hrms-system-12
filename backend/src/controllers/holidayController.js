const Holiday = require('../models/Holiday');
const ApiResponse = require('../utils/apiResponse');
const { createError } = require('../utils/helpers');

const getHolidays = async (req, res, next) => {
  try {
    const { year } = req.query;
    const y = parseInt(year) || new Date().getFullYear();
    const holidays = await Holiday.find({ year: y }).sort({ date: 1 });
    ApiResponse.success(res, holidays);
  } catch (err) { next(err); }
};

const createHoliday = async (req, res, next) => {
  try {
    const holiday = await Holiday.create({ ...req.body, createdBy: req.user._id });
    ApiResponse.created(res, holiday, 'Holiday created');
  } catch (err) { next(err); }
};

const updateHoliday = async (req, res, next) => {
  try {
    const holiday = await Holiday.findByIdAndUpdate(req.params.id, { ...req.body, updatedBy: req.user._id }, { new: true, runValidators: true });
    if (!holiday) return next(createError('Holiday not found', 404));
    ApiResponse.success(res, holiday, 'Holiday updated');
  } catch (err) { next(err); }
};

const deleteHoliday = async (req, res, next) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);
    if (!holiday) return next(createError('Holiday not found', 404));
    ApiResponse.success(res, null, 'Holiday deleted');
  } catch (err) { next(err); }
};

module.exports = { getHolidays, createHoliday, updateHoliday, deleteHoliday };
