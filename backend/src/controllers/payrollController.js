const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const ApiResponse = require('../utils/apiResponse');
const { createError } = require('../utils/helpers');
const { calculatePayroll } = require('../services/payrollService');

const getPayrolls = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { month, year, status, employeeId } = req.query;
    let query = {};
    if (req.user.role === 'employee') {
      const emp = await Employee.findOne({ user: req.user._id });
      if (emp) query.employee = emp._id;
    } else if (employeeId) query.employee = employeeId;
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (status) query.status = status;
    const [payrolls, total] = await Promise.all([
      Payroll.find(query).populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName' }, select: 'employeeId' }).populate('processedBy', 'firstName lastName').skip(skip).limit(limit).sort({ year: -1, month: -1 }),
      Payroll.countDocuments(query)
    ]);
    ApiResponse.paginated(res, payrolls, total, page, limit);
  } catch (err) { next(err); }
};

const processPayroll = async (req, res, next) => {
  try {
    const { month, year, employeeIds } = req.body;
    let employees;
    if (employeeIds && employeeIds.length > 0) employees = await Employee.find({ _id: { $in: employeeIds } });
    else employees = await Employee.find({ employmentStatus: 'active' });
    const results = await Promise.allSettled(employees.map(async (emp) => {
      const existing = await Payroll.findOne({ employee: emp._id, month, year });
      if (existing && existing.status !== 'draft') throw new Error(`Payroll already processed for ${emp.employeeId}`);
      const data = await calculatePayroll(emp, month, year);
      if (existing) return Payroll.findByIdAndUpdate(existing._id, { ...data, processedBy: req.user._id, processedAt: new Date(), updatedBy: req.user._id }, { new: true });
      return Payroll.create({ ...data, processedBy: req.user._id, processedAt: new Date(), createdBy: req.user._id });
    }));
    const success = results.filter(r => r.status === 'fulfilled').length;
    ApiResponse.success(res, { processed: success, failed: results.length - success }, 'Payroll processed');
  } catch (err) { next(err); }
};

const approvePayroll = async (req, res, next) => {
  try {
    const payroll = await Payroll.findByIdAndUpdate(req.params.id, { status: 'processed', approvedBy: req.user._id, approvedAt: new Date(), updatedBy: req.user._id }, { new: true });
    if (!payroll) return next(createError('Payroll not found', 404));
    ApiResponse.success(res, payroll, 'Payroll approved');
  } catch (err) { next(err); }
};

const markAsPaid = async (req, res, next) => {
  try {
    const { paymentDate, paymentMethod, transactionId } = req.body;
    const payroll = await Payroll.findByIdAndUpdate(req.params.id, { status: 'paid', paymentDate: paymentDate || new Date(), paymentMethod, transactionId, updatedBy: req.user._id }, { new: true });
    if (!payroll) return next(createError('Payroll not found', 404));
    ApiResponse.success(res, payroll, 'Payroll marked as paid');
  } catch (err) { next(err); }
};

const getPayrollSummary = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    const summary = await Payroll.aggregate([
      { $match: { month: m, year: y } },
      { $group: { _id: '$status', count: { $sum: 1 }, totalGross: { $sum: '$earnings.grossEarnings' }, totalNet: { $sum: '$netSalary' }, totalDeductions: { $sum: '$deductions.totalDeductions' } } }
    ]);
    ApiResponse.success(res, { month: m, year: y, summary });
  } catch (err) { next(err); }
};

module.exports = { getPayrolls, processPayroll, approvePayroll, markAsPaid, getPayrollSummary };
