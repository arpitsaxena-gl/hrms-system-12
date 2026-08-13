/**
 * Payroll calculation and batch processing (PERF-1, PAYROLL).
 *
 * calculatePayroll() is pure and consumes pre-aggregated attendance/leave/holiday
 * counts. runPayroll() pages employees, aggregates those counts in bulk (removing
 * the previous per-employee N+1), computes statutory deductions from
 * config/payroll.js, and upserts each payroll inside a transaction so re-runs are
 * idempotent (unique {employee,month,year} index). Failures are collected and
 * reported per employee rather than silently counted.
 */
const Payroll = require('../models/Payroll');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Holiday = require('../models/Holiday');
const Employee = require('../models/Employee');
const config = require('../config/payroll');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { withTransaction } = require('../utils/withTransaction');

const PAGE_SIZE = 200;

function computeProfessionalTax(basic) {
  for (const tier of config.professionalTax.tiers) {
    if (basic <= tier.upTo) return tier.amount;
  }
  return 0;
}

function computeTds(monthlyGross) {
  const annual = monthlyGross * 12;
  let tax = 0;
  let prev = 0;
  for (const slab of config.tds.annualSlabs) {
    if (annual <= prev) break;
    const taxable = Math.min(annual, slab.upTo) - prev;
    tax += taxable * slab.rate;
    prev = slab.upTo;
  }
  return tax / 12;
}

function calculatePayroll(employee, month, year, aggregates = {}) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  const holidays = aggregates.holidays || 0;
  const att = (aggregates.attendance && aggregates.attendance[String(employee._id)]) || { present: 0, half: 0, absent: 0, overtime: 0 };
  const leaveDays = (aggregates.leaves && aggregates.leaves[String(employee._id)]) || 0;

  const totalDaysInMonth = endDate.getDate();
  const totalWorkingDays = Math.max(0, totalDaysInMonth - holidays);
  const salary = employee.salary || {};
  const basic = salary.basic || 0;
  const perDaySalary = totalWorkingDays > 0 ? basic / totalWorkingDays : 0;
  const overtimePay = (perDaySalary / config.overtime.hoursPerDay) * att.overtime * config.overtime.multiplier;
  const absentDeduction = perDaySalary * att.absent;

  const earnings = {
    basic,
    hra: salary.hra || 0,
    da: salary.da || 0,
    ta: salary.ta || 0,
    medical: salary.medical || 0,
    overtime: Math.round(overtimePay),
    other: salary.other || 0,
  };
  const grossEarnings = earnings.basic + earnings.hra + earnings.da + earnings.ta + earnings.medical + earnings.overtime + earnings.other;

  const pf = basic * config.pf.rate;
  // ESI is computed on the COMPUTED gross earnings, not the possibly-NaN salary.gross.
  const esi = grossEarnings <= config.esi.grossCeiling ? grossEarnings * config.esi.rate : 0;
  const professionalTax = computeProfessionalTax(basic);
  const tds = computeTds(grossEarnings);

  const deductions = {
    pf: Math.round(pf),
    esi: Math.round(esi),
    tds: Math.round(tds),
    professionalTax,
    leave: Math.round(absentDeduction),
  };
  const totalDeductions = deductions.pf + deductions.esi + deductions.tds + deductions.professionalTax + deductions.leave;
  const netSalary = Math.max(0, grossEarnings - totalDeductions);

  return {
    employee: employee._id,
    month, year,
    payPeriod: { start: startDate, end: endDate },
    earnings,
    deductions,
    netSalary,
    attendanceSummary: {
      totalDays: totalDaysInMonth,
      presentDays: att.present,
      absentDays: att.absent,
      leaveDays,
      holidays,
      workingDays: totalWorkingDays,
      overtimeHours: att.overtime,
    },
  };
}

async function aggregateAttendance(empIds, start, end) {
  const rows = await Attendance.aggregate([
    { $match: { employee: { $in: empIds }, date: { $gte: start, $lte: end } } },
    { $group: {
      _id: '$employee',
      present: { $sum: { $cond: [{ $in: ['$status', ['present', 'work_from_home']] }, 1, 0] } },
      half: { $sum: { $cond: [{ $eq: ['$status', 'half_day'] }, 1, 0] } },
      absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
      overtime: { $sum: { $ifNull: ['$overtime', 0] } },
    } },
  ]);
  const map = {};
  rows.forEach((r) => { map[String(r._id)] = { present: r.present, half: r.half, absent: r.absent, overtime: r.overtime }; });
  return map;
}

async function aggregateLeaves(empIds, start, end) {
  const rows = await Leave.aggregate([
    { $match: { employee: { $in: empIds }, status: 'approved', startDate: { $lte: end }, endDate: { $gte: start } } },
    { $group: { _id: '$employee', count: { $sum: 1 } } },
  ]);
  const map = {};
  rows.forEach((r) => { map[String(r._id)] = r.count; });
  return map;
}

async function upsertPayroll(emp, month, year, aggregates, actorId) {
  const data = calculatePayroll(emp, month, year, aggregates);
  return withTransaction(async (session) => {
    const q = Payroll.findOne({ employee: emp._id, month, year });
    if (session) q.session(session);
    const existing = await q;
    if (existing && existing.status !== 'draft') {
      throw new Error(`Payroll already finalized (${existing.status}) for this period`);
    }
    if (existing) {
      Object.assign(existing, data, { processedBy: actorId, processedAt: new Date(), updatedBy: actorId });
      await existing.save({ session });
      return existing;
    }
    const docs = await Payroll.create([{ ...data, status: 'draft', processedBy: actorId, processedAt: new Date(), createdBy: actorId }], session ? { session } : undefined);
    return Array.isArray(docs) ? docs[0] : docs;
  });
}

async function runPayroll({ month, year, employeeIds, actorId }) {
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(m) || m < 1 || m > 12 || !Number.isInteger(y) || y < 2000 || y > 2100) {
    throw AppError.validation('Invalid payroll period', [{ field: 'month', message: 'month must be 1-12 and year a valid 4-digit year' }]);
  }

  const startDate = new Date(y, m - 1, 1);
  const endDate = new Date(y, m, 0);
  const empQuery = employeeIds && employeeIds.length ? { _id: { $in: employeeIds } } : { employmentStatus: 'active' };

  // Shared across all employees — fetched once.
  const holidays = await Holiday.countDocuments({ date: { $gte: startDate, $lte: endDate } });

  let skip = 0;
  let processed = 0;
  const failed = [];

  // Page through employees, aggregating attendance/leave per page (no per-employee N+1).
  for (;;) {
    const employees = await Employee.find(empQuery).skip(skip).limit(PAGE_SIZE);
    if (!employees.length) break;
    const empIds = employees.map((e) => e._id);
    const [attendance, leaves] = await Promise.all([
      aggregateAttendance(empIds, startDate, endDate),
      aggregateLeaves(empIds, startDate, endDate),
    ]);
    const aggregates = { holidays, attendance, leaves };

    for (const emp of employees) {
      try {
        await upsertPayroll(emp, m, y, aggregates, actorId);
        processed += 1;
      } catch (err) {
        logger.warn(`Payroll failed for ${emp.employeeId || emp._id}: ${err.message}`);
        failed.push({ employeeId: emp.employeeId || String(emp._id), reason: err.message });
      }
    }
    if (employees.length < PAGE_SIZE) break;
    skip += PAGE_SIZE;
  }

  return { processed, failed };
}

module.exports = { calculatePayroll, runPayroll, computeTds, computeProfessionalTax };
