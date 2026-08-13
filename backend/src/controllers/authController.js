const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const ApiResponse = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');
const { env } = require('../config/env');

const LOCK_THRESHOLD = 5;
const LOCK_TIME_MS = 30 * 60 * 1000;
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const refreshExpiry = () => new Date(Date.now() + REFRESH_TTL_MS);

const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const existing = await User.findByEmail(email);
    if (existing) return next(AppError.conflict('Email already registered'));
    // role is NEVER read from the request body — always an employee (SEC-1).
    const user = await User.create({ firstName, lastName, email, password, role: 'employee' });
    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();
    await RefreshToken.issue(user._id, refreshToken, refreshExpiry());
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
    user.password = undefined;
    return ApiResponse.created(res, { token, refreshToken, user }, 'Account created successfully');
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email).select('+password').populate('employee');
    if (!user) return next(AppError.unauthorized('Invalid credentials'));
    if (!user.isActive) return next(AppError.unauthorized('Account deactivated. Contact admin.'));
    if (user.isLocked) return next(AppError.locked('Account temporarily locked. Try again later.'));
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Atomically $inc, then read the PERSISTED count to decide lockout (SEC-8/PERF-8).
      const updated = await User.findByIdAndUpdate(user._id, { $inc: { loginAttempts: 1 } }, { new: true });
      if (updated.loginAttempts >= LOCK_THRESHOLD) {
        await User.findByIdAndUpdate(user._id, { lockUntil: new Date(Date.now() + LOCK_TIME_MS) });
        return next(AppError.locked('Account locked due to too many failed attempts. Try again later.'));
      }
      return next(AppError.unauthorized('Invalid credentials'));
    }
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date(), loginAttempts: 0, lockUntil: null });
    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();
    await RefreshToken.issue(user._id, refreshToken, refreshExpiry());
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
    if (!user || !(await user.comparePassword(currentPassword))) {
      return next(AppError.badRequest('Current password is incorrect'));
    }
    user.password = newPassword;
    await user.save();
    // Revoke all existing refresh tokens so other sessions must re-authenticate (SEC-7).
    await RefreshToken.revokeAllForUser(user._id);
    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();
    await RefreshToken.issue(user._id, refreshToken, refreshExpiry());
    ApiResponse.success(res, { token, refreshToken }, 'Password updated successfully');
  } catch (err) { next(err); }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: rToken } = req.body;
    if (!rToken) return next(AppError.badRequest('Refresh token required'));
    let decoded;
    try {
      decoded = jwt.verify(rToken, env.JWT_REFRESH_SECRET);
    } catch (e) {
      return next(AppError.unauthorized('Invalid or expired refresh token'));
    }
    const stored = await RefreshToken.findActive(rToken);
    if (!stored) return next(AppError.unauthorized('Refresh token revoked or unknown'));
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return next(AppError.unauthorized('Invalid token'));
    if (user.isLocked) return next(AppError.unauthorized('Account locked'));
    if (user.passwordChangedAfter(decoded.iat)) {
      return next(AppError.unauthorized('Password recently changed. Please login again.'));
    }
    // Rotate: revoke the presented token and issue a fresh pair.
    await RefreshToken.revoke(rToken);
    const newToken = user.generateAuthToken();
    const newRefresh = user.generateRefreshToken();
    await RefreshToken.issue(user._id, newRefresh, refreshExpiry());
    ApiResponse.success(res, { token: newToken, refreshToken: newRefresh });
  } catch (err) { next(err); }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken: rToken } = req.body || {};
    if (rToken) await RefreshToken.revoke(rToken);
    else if (req.user) await RefreshToken.revokeAllForUser(req.user._id);
    ApiResponse.success(res, null, 'Logged out');
  } catch (err) { next(err); }
};

module.exports = { register, login, getMe, updatePassword, refreshToken, logout };
