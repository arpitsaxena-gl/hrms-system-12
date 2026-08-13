const Joi = require('joi');
const { PAYROLL_STATUS } = require('../config/constants');

const objectId = Joi.string().hex().length(24);

// month/year validated BEFORE any date math to avoid Invalid Date (PERF-1/PAYROLL).
const processSchema = Joi.object({
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(2000).max(2100).required(),
  employeeIds: Joi.array().items(objectId),
});

const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  month: Joi.number().integer().min(1).max(12),
  year: Joi.number().integer().min(2000).max(2100),
  status: Joi.string().valid(...PAYROLL_STATUS),
  employeeId: objectId,
});

module.exports = { processSchema, listQuerySchema };
