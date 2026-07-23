const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const ApiResponse = require('../utils/apiResponse');
const { createError } = require('../utils/helpers');

const checkIn = async (req, res, next) => {
  try {
    let employee;
    if (req.user.role === 'employee') {
      employee = await Employee.findOne({ user: req.user._id });
      if (!employee) return next(createError('Employee profile not found', 404));
    } else {
      employee = await Employee.findById(req.body.employeeId);
    }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const existing = await Attendance.findOne({ employee: employee._id, date: today });
    if (existing && existing.checkIn) return next(createError('Already checked in today', 400));
    const attendance = existing
      ? await Attendance.findByIdAndUpdate(existing._id, { checkIn: new Date(), status: 'present', ipAddress: req.ip, updatedBy: req.user._id }, { new: true })
      : await Attendance.create({ employee: employee._id, date: today, checkIn: new Date(), status: 'present', ipAddress: req.ip, isRemote: req.body.isRemote || false, location: req.body.location, createdBy: req.user._id });
    ApiResponse.success(res, attendance, 'Checked in successfully');
  } catch (err) { next(err); }
};

const checkOut = async (req, res, next) => {
  try {
    let employee;
    if (req.user.role === 'employee') employee = await Employee.findOne({ user: req.user._id });
    else employee = await Employee.findById(req.body.employeeId || req.params.id);
    if (!employee) return next(createError('Employee not found', 404));
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const attendance = await Attendance.findOne({ employee: employee._id, date: today });
    if (!attendance) return next(createError('No check-in found for today', 404));
    if (attendance.checkOut) return next(createError('Already checked out', 400));
    attendance.checkOut = new Date();
    attendance.updatedBy = req.user._id;
    if (req.body.location) attendance.location.checkOut = req.body.location;
    await attendance.save();
    ApiResponse.success(res, attendance, 'Checked out successfully');
  } catch (err) { next(err); }
};

const getAttendance = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { employeeId, startDate, endDate, status, month, year } = req.query;
    let query = {};
    if (employeeId) query.employee = employeeId;
    else if (req.user.role === 'employee') {
      const emp = await Employee.findOne({ user: req.user._id });
      if (emp) query.employee = emp._id;
    }
    if (status) query.status = status;
    if (month && year) {
      query.date = { $gte: new Date(year, month - 1, 1), $lte: new Date(year, month, 0) };
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    const [records, total] = await Promise.all([
      Attendance.find(query).populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName' } }).skip(skip).limit(limit).sort({ date: -1 }),
      Attendance.countDocuments(query)
    ]);
    ApiResponse.paginated(res, records, total, page, limit);
  } catch (err) { next(err); }
};

const getAttendanceSummary = async (req, res, next) => {
  try {
    const { month, year, employeeId } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    let empId = employeeId;
    if (req.user.role === 'employee') {
      const emp = await Employee.findOne({ user: req.user._id });
      empId = emp?._id;
    }
    const query = { date: { $gte: new Date(y, m - 1, 1), $lte: new Date(y, m, 0) } };
    if (empId) query.employee = empId;
    const summary = await Attendance.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 }, totalHours: { $sum: '$workHours' } } }
    ]);
    const statusMap = {};
    summary.forEach(s => { statusMap[s._id] = { count: s.count, totalHours: Math.round(s.totalHours * 100) / 100 }; });
    ApiResponse.success(res, { month: m, year: y, summary: statusMap });
  } catch (err) { next(err); }
};

const bulkAttendance = async (req, res, next) => {
  try {
    const { date, records } = req.body;
    const results = await Promise.allSettled(
      records.map(r => Attendance.findOneAndUpdate(
        { employee: r.employeeId, date: new Date(date) },
        { ...r, date: new Date(date), updatedBy: req.user._id },
        { upsert: true, new: true, runValidators: true }
      ))
    );
    const success = results.filter(r => r.status === 'fulfilled').length;
    ApiResponse.success(res, { processed: success, failed: results.length - success }, 'Bulk attendance updated');
  } catch (err) { next(err); }
};

module.exports = { checkIn, checkOut, getAttendance, getAttendanceSummary, bulkAttendance };
