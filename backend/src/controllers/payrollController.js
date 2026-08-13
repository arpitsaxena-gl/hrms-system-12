const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const ApiResponse = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const { runPayroll } = require('../services/payrollService');
const { employeeScopeFilter } = require('../middleware/policy');

const getPayrolls = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { month, year, status, employeeId } = req.query;
    // Scope the list to what the viewer may see (SEC-4).
    const scope = await employeeScopeFilter(req.user);
    const query = { ...scope };
    if (Object.keys(scope).length === 0 && employeeId) query.employee = employeeId;
    if (month) query.month = parseInt(month, 10);
    if (year) query.year = parseInt(year, 10);
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
    const result = await runPayroll({ month, year, employeeIds, actorId: req.user._id });
    ApiResponse.success(res, result, 'Payroll processed');
  } catch (err) { next(err); }
};

const approvePayroll = async (req, res, next) => {
  try {
    const payroll = await Payroll.findByIdAndUpdate(req.params.id, { status: 'processed', approvedBy: req.user._id, approvedAt: new Date(), updatedBy: req.user._id }, { new: true });
    if (!payroll) return next(AppError.notFound('Payroll not found'));
    ApiResponse.success(res, payroll, 'Payroll approved');
  } catch (err) { next(err); }
};

const markAsPaid = async (req, res, next) => {
  try {
    const { paymentDate, paymentMethod, transactionId } = req.body;
    const payroll = await Payroll.findByIdAndUpdate(req.params.id, { status: 'paid', paymentDate: paymentDate || new Date(), paymentMethod, transactionId, updatedBy: req.user._id }, { new: true });
    if (!payroll) return next(AppError.notFound('Payroll not found'));
    ApiResponse.success(res, payroll, 'Payroll marked as paid');
  } catch (err) { next(err); }
};

const getPayrollSummary = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const m = parseInt(month, 10) || new Date().getMonth() + 1;
    const y = parseInt(year, 10) || new Date().getFullYear();
    const summary = await Payroll.aggregate([
      { $match: { month: m, year: y } },
      { $group: { _id: '$status', count: { $sum: 1 }, totalGross: { $sum: '$earnings.grossEarnings' }, totalNet: { $sum: '$netSalary' }, totalDeductions: { $sum: '$deductions.totalDeductions' } } }
    ]);
    ApiResponse.success(res, { month: m, year: y, summary });
  } catch (err) { next(err); }
};

module.exports = { getPayrolls, processPayroll, approvePayroll, markAsPaid, getPayrollSummary };
