const AuditLog = require('../models/AuditLog');
const ApiResponse = require('../utils/apiResponse');

const getAuditLogs = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { userId, module, action, startDate, endDate } = req.query;
    let query = {};
    if (userId) query.user = userId;
    if (module) query.module = module;
    if (action) query.action = action;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    const [logs, total] = await Promise.all([
      AuditLog.find(query).populate('user', 'firstName lastName email role').skip(skip).limit(limit).sort({ createdAt: -1 }),
      AuditLog.countDocuments(query)
    ]);
    ApiResponse.paginated(res, logs, total, page, limit);
  } catch (err) { next(err); }
};

module.exports = { getAuditLogs };
