/**
 * Leave application and state-transition logic (BUG-1, PERF-5/6).
 *
 * Extracted from the controller so that balance math is computed BEFORE the
 * balance check and every multi-document mutation runs atomically:
 *   - totalDays is computed up front (not deferred to a pre('save') hook)
 *   - balance is reserved with an atomic conditional $inc that can never go
 *     negative under concurrency
 *   - reject/cancel restores the reserved balance exactly once, guarded by the
 *     `balanceReserved` flag
 */
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const AppError = require('../utils/AppError');
const { ROLES } = require('../config/constants');
const { withTransaction } = require('../utils/withTransaction');

// Only these leave types draw down a tracked balance. Others (unpaid, maternity,
// paternity) do not consume balance.
const BALANCE_TRACKED = ['annual', 'sick', 'casual', 'compensatory'];

function computeTotalDays(startDate, endDate, isHalfDay) {
  if (isHalfDay) return 0.5;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
}

async function resolveEmployee(actor, employeeId) {
  if (actor.role === ROLES.EMPLOYEE || !employeeId) {
    return Employee.findOne({ user: actor._id }).populate('user');
  }
  return Employee.findById(employeeId).populate('user');
}

async function applyLeave(actor, body) {
  const { leaveType, startDate, endDate, reason, isHalfDay, halfDayType, isEmergency, employeeId } = body;

  const employee = await resolveEmployee(actor, employeeId);
  if (!employee) throw AppError.notFound('Employee not found');

  const totalDays = computeTotalDays(startDate, endDate, isHalfDay);
  if (!(totalDays >= 0.5)) throw AppError.badRequest('Invalid leave duration', 'endDate');

  // Reject overlapping pending/approved leaves for the same employee.
  const overlap = await Leave.findOne({
    employee: employee._id,
    status: { $in: ['pending', 'approved'] },
    startDate: { $lte: new Date(endDate) },
    endDate: { $gte: new Date(startDate) },
  });
  if (overlap) throw AppError.conflict('An overlapping leave request already exists for these dates');

  const tracked = BALANCE_TRACKED.includes(leaveType);

  const leave = await withTransaction(async (session) => {
    if (tracked) {
      const path = `leaveBalance.${leaveType}`;
      // Atomic, conditional decrement: only succeeds if enough balance remains.
      const updated = await Employee.findOneAndUpdate(
        { _id: employee._id, [path]: { $gte: totalDays } },
        { $inc: { [path]: -totalDays } },
        { new: true, session }
      );
      if (!updated) {
        throw new AppError(`Insufficient ${leaveType} leave balance`, {
          code: 'VALIDATION_ERROR',
          field: 'leaveType',
          errors: [{ field: 'leaveType', message: `Requested ${totalDays} day(s) exceeds available balance` }],
        });
      }
    }
    const doc = new Leave({
      employee: employee._id,
      leaveType, startDate, endDate, totalDays, reason,
      isHalfDay, halfDayType, isEmergency,
      balanceReserved: tracked,
      createdBy: actor._id,
    });
    await doc.save({ session });
    return doc;
  });

  return { leave, employee };
}

async function restoreIfReserved(leave, session) {
  if (leave.balanceReserved && BALANCE_TRACKED.includes(leave.leaveType)) {
    const employeeId = leave.employee && leave.employee._id ? leave.employee._id : leave.employee;
    await Employee.findByIdAndUpdate(
      employeeId,
      { $inc: { [`leaveBalance.${leave.leaveType}`]: leave.totalDays } },
      { session }
    );
    leave.balanceReserved = false;
  }
}

async function changeStatus(actor, leaveId, status, rejectionReason) {
  return withTransaction(async (session) => {
    const query = Leave.findById(leaveId).populate({ path: 'employee', populate: 'user' });
    if (session) query.session(session);
    const leave = await query;
    if (!leave) throw AppError.notFound('Leave not found');
    if (leave.status !== 'pending') throw AppError.badRequest('Leave already processed');

    if (status === 'rejected') {
      // Balance was reserved at apply time — return it exactly once.
      await restoreIfReserved(leave, session);
      leave.rejectionReason = rejectionReason;
    }
    // Approve keeps the balance reserved (no change).
    leave.status = status;
    leave.approvedBy = actor._id;
    leave.approvedAt = new Date();
    await leave.save({ session });
    return leave;
  });
}

async function cancelLeave(actor, leaveId) {
  return withTransaction(async (session) => {
    const query = Leave.findById(leaveId);
    if (session) query.session(session);
    const leave = await query;
    if (!leave) throw AppError.notFound('Leave not found');
    if (!['pending', 'approved'].includes(leave.status)) throw AppError.badRequest('Cannot cancel this leave');

    await restoreIfReserved(leave, session);
    leave.status = 'cancelled';
    leave.cancelledAt = new Date();
    leave.cancelledBy = actor._id;
    await leave.save({ session });
    return leave;
  });
}

module.exports = { applyLeave, changeStatus, cancelLeave, computeTotalDays, BALANCE_TRACKED };
