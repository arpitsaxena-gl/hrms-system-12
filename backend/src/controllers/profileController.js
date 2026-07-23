const User = require('../models/User');
const Employee = require('../models/Employee');
const ApiResponse = require('../utils/apiResponse');
const { createError } = require('../utils/helpers');

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'employee',
      populate: [{ path: 'department', select: 'name' }, { path: 'designation', select: 'name' }, { path: 'shift', select: 'name startTime endTime' }]
    });
    ApiResponse.success(res, user);
  } catch (err) { next(err); }
};

const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['firstName', 'lastName', 'phone', 'preferences'];
    const updates = {};
    allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    if (req.user.employee && req.body.employee) {
      const empFields = ['currentAddress', 'permanentAddress', 'emergencyContact', 'bankDetails', 'skills'];
      const empUpdates = {};
      empFields.forEach(f => { if (req.body.employee[f] !== undefined) empUpdates[f] = req.body.employee[f]; });
      await Employee.findByIdAndUpdate(req.user.employee._id, empUpdates);
    }
    ApiResponse.success(res, user, 'Profile updated');
  } catch (err) { next(err); }
};

const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return next(createError('No file uploaded', 400));
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl }, { new: true });
    ApiResponse.success(res, { avatar: avatarUrl }, 'Avatar uploaded');
  } catch (err) { next(err); }
};

module.exports = { getProfile, updateProfile, uploadAvatar };
