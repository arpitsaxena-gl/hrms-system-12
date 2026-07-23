const User = require('../models/User');
const Employee = require('../models/Employee');
const ApiResponse = require('../utils/apiResponse');
const { createError } = require('../utils/helpers');

const getUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { search, role, isActive } = req.query;
    let query = {};
    if (search) query.$or = [{ firstName: new RegExp(search, 'i') }, { lastName: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    const [users, total] = await Promise.all([
      User.find(query).select('-password -passwordResetToken').populate('employee', 'employeeId department designation').skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(query)
    ]);
    ApiResponse.paginated(res, users, total, page, limit);
  } catch (err) { next(err); }
};

const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password -passwordResetToken').populate('employee');
    if (!user) return next(createError('User not found', 404));
    ApiResponse.success(res, user);
  } catch (err) { next(err); }
};

const updateUser = async (req, res, next) => {
  try {
    const allowed = ['firstName', 'lastName', 'phone', 'role', 'isActive', 'preferences'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    updates.updatedBy = req.user._id;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password');
    if (!user) return next(createError('User not found', 404));
    ApiResponse.success(res, user, 'User updated');
  } catch (err) { next(err); }
};

const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) return next(createError('Cannot delete your own account', 400));
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false, updatedBy: req.user._id }, { new: true });
    if (!user) return next(createError('User not found', 404));
    ApiResponse.success(res, null, 'User deactivated');
  } catch (err) { next(err); }
};

const resetUserPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return next(createError('User not found', 404));
    user.password = newPassword;
    await user.save();
    ApiResponse.success(res, null, 'Password reset successfully');
  } catch (err) { next(err); }
};

module.exports = { getUsers, getUser, updateUser, deleteUser, resetUserPassword };
