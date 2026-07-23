const AuditLog = require('../models/AuditLog');

const auditMiddleware = (module, action) => async (req, res, next) => {
  const start = Date.now();
  const originalJson = res.json.bind(res);
  res.json = function(body) {
    res.responseBody = body;
    return originalJson(body);
  };
  res.on('finish', async () => {
    try {
      if (req.user) {
        await AuditLog.create({
          user: req.user._id,
          action,
          module,
          resourceId: req.params.id,
          resourceType: module,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          duration: Date.now() - start,
          description: `${action} on ${module}`
        });
      }
    } catch (_) {}
  });
  next();
};

module.exports = auditMiddleware;
