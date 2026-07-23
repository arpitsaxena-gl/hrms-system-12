const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createError } = require('../utils/helpers');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return next(createError('Not authorized to access this route', 401));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.id).populate('employee');
    if (!user) return next(createError('User not found', 401));
    if (!user.isActive) return next(createError('Your account has been deactivated', 401));
    if (user.passwordChangedAfter(decoded.iat)) return next(createError('Password was recently changed. Please login again.', 401));
    req.user = user;
    next();
  } catch (err) {
    return next(createError('Invalid token', 401));
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return next(createError(`Role ${req.user.role} is not authorized`, 403));
  next();
};

const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      req.user = await User.findById(decoded.id);
    } catch (_) {}
  }
  next();
};

module.exports = { protect, authorize, optionalAuth };
