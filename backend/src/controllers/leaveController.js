const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const ApiResponse = require('../utils/apiResponse');
const { createError } = require('../utils/helpers');
const emailService = require('../services/emailService');
const { sendNotification } = require('../services/socketService');

const getLeaves = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { status, leaveType, employeeId, startDate, endDate } = req.query;
    let query = {};
    if (req.user.role === 'employee') {
      const emp = await Employee.findOne({ user: req.user._id });
      if (emp) query.employee = emp._id;
    } else if (employeeId) query.employee = employeeId;
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
    let employee;
    if (req.user.role === 'employee') employee = await Employee.findOne({ user: req.user._id }).populate('user');
    else employee = await Employee.findById(req.body.employeeId).populate('user');
    if (!employee) return next(createError('Employee not found', 404));
    const { leaveType, startDate, endDate, reason, isHalfDay, halfDayType, isEmergency } = req.body;
    const balance = employee.leaveBalance[leaveType] || 0;
    const leave = new Leave({ employee: employee._id, leaveType, startDate, endDate, reason, isHalfDay, halfDayType, isEmergency, createdBy: req.user._id });
    await leave.validate();
    if (leave.totalDays > balance) return next(createError(`Insufficient ${leaveType} leave balance. Available: ${balance} days`, 400));
    await leave.save();
    if (employee.manager) {
      const managerEmployee = await Employee.findById(employee.manager).populate('user');
      if (managerEmployee && managerEmployee.user) {
        await sendNotification(managerEmployee.user._id, {
          sender: req.user._id,
          title: 'New Leave Request',
          message: `${employee.user.firstName} ${employee.user.lastName} applied for ${leaveType} leave`,
          type: 'info',
          category: 'leave',
          link: `/leaves/${leave._id}`
        });
      }
    }
    ApiResponse.created(res, leave, 'Leave applied successfully');
  } catch (err) { next(err); }
};

const updateLeaveStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const leave = await Leave.findById(req.params.id).populate({ path: 'employee', populate: 'user' });
    if (!leave) return next(createError('Leave not found', 404));
    if (leave.status !== 'pending') return next(createError('Leave already processed', 400));
    leave.status = status;
    leave.approvedBy = req.user._id;
    leave.approvedAt = new Date();
    if (status === 'rejected') leave.rejectionReason = rejectionReason;
    if (status === 'approved') {
      await Employee.findByIdAndUpdate(leave.employee._id, {
        $inc: { [`leaveBalance.${leave.leaveType}`]: -leave.totalDays }
      });
    }
    await leave.save();
    if (leave.employee && leave.employee.user) {
      await sendNotification(leave.employee.user._id, {
        sender: req.user._id,
        title: `Leave ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your ${leave.leaveType} leave has been ${status}`,
        type: status === 'approved' ? 'success' : 'error',
        category: 'leave',
        link: `/leaves/${leave._id}`
      });
      try { await emailService.sendLeaveStatusEmail(leave, status, rejectionReason); } catch (_) {}
    }
    ApiResponse.success(res, leave, `Leave ${status}`);
  } catch (err) { next(err); }
};

const cancelLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return next(createError('Leave not found', 404));
    if (!['pending', 'approved'].includes(leave.status)) return next(createError('Cannot cancel this leave', 400));
    if (leave.status === 'approved') {
      await Employee.findByIdAndUpdate(leave.employee, {
        $inc: { [`leaveBalance.${leave.leaveType}`]: leave.totalDays }
      });
    }
    leave.status = 'cancelled';
    leave.cancelledAt = new Date();
    leave.cancelledBy = req.user._id;
    await leave.save();
    ApiResponse.success(res, leave, 'Leave cancelled');
  } catch (err) { next(err); }
};

const getLeaveBalance = async (req, res, next) => {
  try {
    let employee;
    if (req.user.role === 'employee') employee = await Employee.findOne({ user: req.user._id });
    else employee = await Employee.findById(req.params.id || req.query.employeeId);
    if (!employee) return next(createError('Employee not found', 404));
    ApiResponse.success(res, employee.leaveBalance);
  } catch (err) { next(err); }
};

module.exports = { getLeaves, applyLeave, updateLeaveStatus, cancelLeave, getLeaveBalance };
