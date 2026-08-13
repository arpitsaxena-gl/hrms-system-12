const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Legacy express-validator result handler (kept for existing routes).
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      AppError.validation(
        'Validation failed',
        errors.array().map((e) => ({ field: e.path, message: e.msg }))
      )
    );
  }
  next();
};

/**
 * Joi schema validation middleware factory (SEC-11, SEC-9).
 *
 * Validates `req[target]` against a Joi schema, strips unknown keys, coerces
 * types, and rejects with a 400 VALIDATION_ERROR carrying field-level errors.
 * The sanitized value replaces `req[target]` so downstream code sees only
 * allow-listed fields.
 *
 *   router.post('/', validate.schema(applyLeaveSchema), applyLeave)
 *   router.get('/', validate.schema(listQuerySchema, 'query'), getLeaves)
 */
validate.schema = (schema, target = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[target], {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });
  if (error) {
    const errors = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message.replace(/"/g, ''),
    }));
    return next(AppError.validation('Validation failed', errors));
  }
  req[target] = value;
  next();
};

module.exports = validate;
