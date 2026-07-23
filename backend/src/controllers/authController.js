const User = require('../models/User');
const Employee = require('../models/Employee');
const { createError } = require('../utils/helpers');
const ApiResponse = require('../utils/apiResponse');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    const existing = await User.findByEmail(email);
    if (existing) return next(createError('Email already registered', 400));
    const user = await User.create({ firstName, lastName, email, password, role: role || 'employee' });
    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
    user.password = undefined;
    return ApiResponse.created(res, { token, refreshToken, user }, 'Account created successfully');
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email).select('+password').populate('employee');
    if (!user) return next(createError('Invalid credentials', 401));
    if (!user.isActive) return next(createError('Account deactivated. Contact admin.', 401));
    if (user.isLocked) return next(createError('Account temporarily locked. Try again later.', 401));
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await User.findByIdAndUpdate(user._id, { $inc: { loginAttempts: 1 } });
      if (user.loginAttempts >= 4) await User.findByIdAndUpdate(user._id, { lockUntil: new Date(Date.now() + 30 * 60 * 1000) });
      return next(createError('Invalid credentials', 401));
    }
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date(), loginAttempts: 0, lockUntil: null });
    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();
    user.password = undefined;
    logger.info(`User ${user.email} logged in`);
    return ApiResponse.success(res, { token, refreshToken, user }, 'Login successful');
  } catch (err) { next(err); }
};

const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).populate('employee');
  ApiResponse.success(res, user);
};

const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!await user.comparePassword(currentPassword)) return next(createError('Current password is incorrect', 400));
    user.password = newPassword;
    await user.save();
    const token = user.generateAuthToken();
    ApiResponse.success(res, { token }, 'Password updated successfully');
  } catch (err) { next(err); }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: rToken } = req.body;
    if (!rToken) return next(createError('Refresh token required', 400));
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(rToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret');
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return next(createError('Invalid token', 401));
    const newToken = user.generateAuthToken();
    const newRefresh = user.generateRefreshToken();
    ApiResponse.success(res, { token: newToken, refreshToken: newRefresh });
  } catch (err) { next(createError('Invalid or expired refresh token', 401)); }
};

module.exports = { register, login, getMe, updatePassword, refreshToken };
