const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const ApiResponse = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const leaveService = require('../services/leaveService');
const { employeeScopeFilter } = require('../middleware/policy');
const emailService = require('../services/emailService');
const { sendNotification } = require('../services/socketService');

const getLeaves = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { status, leaveType, employeeId, startDate, endDate } = req.query;
    // Scope the list to what the viewer may see (SEC-4).
    const scope = await employeeScopeFilter(req.user);
    const query = { ...scope };
    // Privileged callers (scope === {}) may additionally filter by employeeId.
    if (Object.keys(scope).length === 0 && employeeId) query.employee = employeeId;
    if (status) query.status = status;
    if (leaveType) query.leaveType = leaveType;
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }
    const [leaves, total] = await Promise.all([
      Leave.find(query).populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName avatar' }, select: 'employeeId' }).populate('approvedBy', 'firstName lastName').skip(skip).limit(limit).sort({ createdAt: -1 }),
      Leave.countDocuments(query)
    ]);
    ApiResponse.paginated(res, leaves, total, page, limit);
  } catch (err) { next(err); }
};

const applyLeave = async (req, res, next) => {
  try {
    const { leave, employee } = await leaveService.applyLeave(req.user, req.body);
    // Best-effort manager notification (failure must not fail the request — PERF-7).
    if (employee.manager) {
      try {
        const managerEmployee = await Employee.findById(employee.manager).populate('user');
        if (managerEmployee && managerEmployee.user) {
          await sendNotification(managerEmployee.user._id, {
            sender: req.user._id,
            title: 'New Leave Request',
            message: `${employee.user.firstName} ${employee.user.lastName} applied for ${leave.leaveType} leave`,
            type: 'info',
            category: 'leave',
            link: `/leaves/${leave._id}`
          });
        }
      } catch (err) {
        logger.warn(`Leave apply notification failed: ${err.message}`);
      }
    }
    ApiResponse.created(res, leave, 'Leave applied successfully');
  } catch (err) { next(err); }
};

const updateLeaveStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const leave = await leaveService.changeStatus(req.user, req.params.id, status, rejectionReason);
    if (leave.employee && leave.employee.user) {
      try {
        await sendNotification(leave.employee.user._id, {
          sender: req.user._id,
          title: `Leave ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: `Your ${leave.leaveType} leave has been ${status}`,
          type: status === 'approved' ? 'success' : 'error',
          category: 'leave',
          link: `/leaves/${leave._id}`
        });
      } catch (err) {
        logger.warn(`Leave status notification failed: ${err.message}`);
      }
      try {
        await emailService.sendLeaveStatusEmail(leave, status, rejectionReason);
      } catch (err) {
        logger.warn(`Leave status email failed: ${err.message}`);
      }
    }
    ApiResponse.success(res, leave, `Leave ${status}`);
  } catch (err) { next(err); }
};

const cancelLeave = async (req, res, next) => {
  try {
    const leave = await leaveService.cancelLeave(req.user, req.params.id);
    ApiResponse.success(res, leave, 'Leave cancelled');
  } catch (err) { next(err); }
};

const getLeaveBalance = async (req, res, next) => {
  try {
    let employee;
    if (req.user.role === 'employee') employee = await Employee.findOne({ user: req.user._id });
    else employee = await Employee.findById(req.params.id || req.query.employeeId);
    if (!employee) return next(AppError.notFound('Employee not found'));
    ApiResponse.success(res, employee.leaveBalance);
  } catch (err) { next(err); }
};

module.exports = { getLeaves, applyLeave, updateLeaveStatus, cancelLeave, getLeaveBalance };
