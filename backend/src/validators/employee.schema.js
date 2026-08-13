const Joi = require('joi');
const { ROLES } = require('../config/constants');

const objectId = Joi.string().hex().length(24);
const roles = Object.values(ROLES);

// `unknown(true)` keeps the many optional employee profile fields (address,
// bank, salary, etc.) which are validated by the Mongoose schema. The role and
// core refs below are validated explicitly; role authorization is enforced
// separately by policy.canAssignRole (SEC-3).
const createSchema = Joi.object({
  firstName: Joi.string().trim().max(50).required(),
  lastName: Joi.string().trim().max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128),
  role: Joi.string().valid(...roles),
  department: objectId.required(),
  designation: objectId.required(),
  joiningDate: Joi.date().iso().required(),
  manager: objectId.allow(null),
}).unknown(true);

const updateSchema = Joi.object({
  firstName: Joi.string().trim().max(50),
  lastName: Joi.string().trim().max(50),
  phone: Joi.string().trim().allow(''),
  role: Joi.string().valid(...roles),
  manager: objectId.allow(null),
}).unknown(true);

module.exports = { createSchema, updateSchema };
