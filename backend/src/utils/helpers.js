const crypto = require('crypto');

const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const generateToken = (length = 32) => crypto.randomBytes(length).toString('hex');

const formatDate = (date) => new Date(date).toISOString().split('T')[0];

const sendResponse = (res, statusCode, data, message = 'Success') => {
  res.status(statusCode).json({ success: true, message, data });
};

const sendPaginatedResponse = (res, data, total, page, limit, message = 'Success') => {
  res.status(200).json({
    success: true, message, data,
    pagination: {
      total, page, limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    }
  });
};

const buildSearchQuery = (search, fields) => {
  if (!search) return {};
  const regex = new RegExp(search, 'i');
  return { $or: fields.map(field => ({ [field]: regex })) };
};

const buildDateRange = (startDate, endDate, field = 'createdAt') => {
  const query = {};
  if (startDate || endDate) {
    query[field] = {};
    if (startDate) query[field].$gte = new Date(startDate);
    if (endDate) query[field].$lte = new Date(endDate);
  }
  return query;
};

const calculateWorkingDays = (startDate, endDate, holidays = []) => {
  let count = 0;
  const cur = new Date(startDate);
  const end = new Date(endDate);
  const holidayStrings = holidays.map(h => new Date(h).toDateString());
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6 && !holidayStrings.includes(cur.toDateString())) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

const sanitizeObject = (obj, fields) => {
  const result = {};
  fields.forEach(field => { if (obj[field] !== undefined) result[field] = obj[field]; });
  return result;
};

module.exports = { createError, generateToken, formatDate, sendResponse, sendPaginatedResponse, buildSearchQuery, buildDateRange, calculateWorkingDays, sanitizeObject };
