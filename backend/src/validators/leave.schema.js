const Joi = require('joi');
const { LEAVE_TYPES, LEAVE_STATUS } = require('../config/constants');

const objectId = Joi.string().hex().length(24);

const applyLeaveSchema = Joi.object({
  leaveType: Joi.string().valid(...LEAVE_TYPES).required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required().messages({
    'date.min': 'endDate must be on or after startDate',
  }),
  reason: Joi.string().trim().max(500).required(),
  isHalfDay: Joi.boolean().default(false),
  halfDayType: Joi.string().valid('morning', 'afternoon').when('isHalfDay', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  isEmergency: Joi.boolean().default(false),
  // Only used by non-employee callers applying on behalf of someone else.
  employeeId: objectId,
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected').required(),
  rejectionReason: Joi.string().trim().max(500).when('status', {
    is: 'rejected',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});

// Allow-listed query keys for the leaves list endpoint (SEC-9).
const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  status: Joi.string().valid(...LEAVE_STATUS),
  leaveType: Joi.string().valid(...LEAVE_TYPES),
  employeeId: objectId,
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso(),
});

module.exports = { applyLeaveSchema, updateStatusSchema, listQuerySchema };
