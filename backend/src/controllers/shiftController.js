const Shift = require('../models/Shift');
const ApiResponse = require('../utils/apiResponse');
const { createError } = require('../utils/helpers');

const getShifts = async (req, res, next) => {
  try {
    const shifts = await Shift.find({ isActive: true }).sort({ name: 1 });
    ApiResponse.success(res, shifts);
  } catch (err) { next(err); }
};

const createShift = async (req, res, next) => {
  try {
    const shift = await Shift.create({ ...req.body, createdBy: req.user._id });
    ApiResponse.created(res, shift, 'Shift created');
  } catch (err) { next(err); }
};

const updateShift = async (req, res, next) => {
  try {
    const shift = await Shift.findByIdAndUpdate(req.params.id, { ...req.body, updatedBy: req.user._id }, { new: true });
    if (!shift) return next(createError('Shift not found', 404));
    ApiResponse.success(res, shift, 'Shift updated');
  } catch (err) { next(err); }
};

const deleteShift = async (req, res, next) => {
  try {
    const shift = await Shift.findByIdAndDelete(req.params.id);
    if (!shift) return next(createError('Shift not found', 404));
    ApiResponse.success(res, null, 'Shift deleted');
  } catch (err) { next(err); }
};

module.exports = { getShifts, createShift, updateShift, deleteShift };
