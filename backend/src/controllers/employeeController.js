const Employee = require('../models/Employee');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const { createError, buildSearchQuery, buildDateRange } = require('../utils/helpers');
const emailService = require('../services/emailService');
const { sendNotification } = require('../services/socketService');

const getEmployees = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { search, department, designation, status, employmentType, manager } = req.query;
    let query = {};
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const users = await User.find({ $or: [{ firstName: searchRegex }, { lastName: searchRegex }, { email: searchRegex }] }).select('_id');
      query.$or = [{ employeeId: searchRegex }, { user: { $in: users.map(u => u._id) } }];
    }
    if (department) query.department = department;
    if (designation) query.designation = designation;
    if (status) query.employmentStatus = status;
    if (employmentType) query.employmentType = employmentType;
    if (manager) query.manager = manager;
    const [employees, total] = await Promise.all([
      Employee.find(query).populate('user', '-password').populate('department', 'name code').populate('designation', 'name').populate('manager', 'employeeId').populate('shift', 'name').skip(skip).limit(limit).sort({ createdAt: -1 }),
      Employee.countDocuments(query)
    ]);
    ApiResponse.paginated(res, employees, total, page, limit);
  } catch (err) { next(err); }
};

const getEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('user', '-password -passwordResetToken -passwordResetExpires')
      .populate('department').populate('designation').populate('manager').populate('shift')
      .populate('documents');
    if (!employee) return next(createError('Employee not found', 404));
    ApiResponse.success(res, employee);
  } catch (err) { next(err); }
};

const createEmployee = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role, department, designation, joiningDate, ...empData } = req.body;
    const existingUser = await User.findByEmail(email);
    if (existingUser) return next(createError('Email already registered', 400));
    const tempPassword = password || Math.random().toString(36).slice(-8) + 'A1!';
    const user = await User.create({ firstName, lastName, email, password: tempPassword, role: role || 'employee', createdBy: req.user._id });
    const employee = await Employee.create({ user: user._id, department, designation, joiningDate, ...empData, createdBy: req.user._id });
    await User.findByIdAndUpdate(user._id, { employee: employee._id });
    try { await emailService.sendWelcomeEmail(user, tempPassword); } catch (_) {}
    const populated = await Employee.findById(employee._id).populate('user', '-password').populate('department', 'name').populate('designation', 'name');
    ApiResponse.created(res, populated, 'Employee created successfully');
  } catch (err) { next(err); }
};

const updateEmployee = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, role, ...empData } = req.body;
    const employee = await Employee.findById(req.params.id);
    if (!employee) return next(createError('Employee not found', 404));
    if (firstName || lastName || phone || role) {
      const userUpdate = {};
      if (firstName) userUpdate.firstName = firstName;
      if (lastName) userUpdate.lastName = lastName;
      if (phone) userUpdate.phone = phone;
      if (role && ['admin', 'hr', 'manager', 'employee'].includes(req.user.role)) userUpdate.role = role;
      userUpdate.updatedBy = req.user._id;
      await User.findByIdAndUpdate(employee.user, userUpdate);
    }
    Object.assign(employee, empData, { updatedBy: req.user._id });
    await employee.save();
    const updated = await Employee.findById(employee._id).populate('user', '-password').populate('department', 'name').populate('designation', 'name');
    ApiResponse.success(res, updated, 'Employee updated successfully');
  } catch (err) { next(err); }
};

const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return next(createError('Employee not found', 404));
    await User.findByIdAndUpdate(employee.user, { isActive: false, updatedBy: req.user._id });
    employee.employmentStatus = 'terminated';
    employee.updatedBy = req.user._id;
    await employee.save();
    ApiResponse.success(res, null, 'Employee deactivated successfully');
  } catch (err) { next(err); }
};

const getEmployeeStats = async (req, res, next) => {
  try {
    const [total, active, byDept, byType] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ employmentStatus: 'active' }),
      Employee.aggregate([{ $group: { _id: '$department', count: { $sum: 1 } } }, { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } }, { $unwind: '$dept' }, { $project: { name: '$dept.name', count: 1 } }]),
      Employee.aggregate([{ $group: { _id: '$employmentType', count: { $sum: 1 } } }])
    ]);
    ApiResponse.success(res, { total, active, byDepartment: byDept, byType });
  } catch (err) { next(err); }
};

module.exports = { getEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee, getEmployeeStats };
