const crypto = require('crypto');
const Employee = require('../models/Employee');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const { createError } = require('../utils/helpers');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');
const { canAssignRole, canReadEmployee } = require('../middleware/policy');
const { withTransaction } = require('../utils/withTransaction');

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
    if (!employee) return next(AppError.notFound('Employee not found'));
    // Object-level authorization: self, manager-of, or admin/hr only (SEC-4).
    if (!(await canReadEmployee(req.user, employee))) {
      return next(AppError.forbidden('You are not allowed to view this employee'));
    }
    ApiResponse.success(res, employee);
  } catch (err) { next(err); }
};

const createEmployee = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role, department, designation, joiningDate, ...empData } = req.body;
    // Only an authorized actor may assign a (privileged) role (SEC-3).
    if (role && !canAssignRole(req.user, role)) {
      return next(AppError.forbidden('You are not allowed to assign this role'));
    }
    const existingUser = await User.findByEmail(email);
    if (existingUser) return next(AppError.conflict('Email already registered'));
    const tempPassword = password || `${crypto.randomBytes(6).toString('hex')}A1!`;

    // Provision User -> Employee -> back-reference atomically (PERF-5/6).
    const result = await withTransaction(async (session) => {
      const [user] = await User.create([{ firstName, lastName, email, password: tempPassword, role: role || 'employee', createdBy: req.user._id }], { session });
      const [employee] = await Employee.create([{ user: user._id, department, designation, joiningDate, ...empData, createdBy: req.user._id }], { session });
      await User.updateOne({ _id: user._id }, { employee: employee._id }, { session });
      return { user, employeeId: employee._id };
    });

    // Welcome email is best-effort and runs outside the transaction.
    try {
      await emailService.sendWelcomeEmail(result.user, tempPassword);
    } catch (err) {
      logger.warn(`Welcome email failed for ${email}: ${err.message}`);
    }

    const populated = await Employee.findById(result.employeeId).populate('user', '-password').populate('department', 'name').populate('designation', 'name');
    ApiResponse.created(res, populated, 'Employee created successfully');
  } catch (err) { next(err); }
};

const updateEmployee = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, role, ...empData } = req.body;
    // Actor-based role authorization replaces the previous no-op guard (SEC-3).
    if (role && !canAssignRole(req.user, role)) {
      return next(AppError.forbidden('You are not allowed to assign this role'));
    }
    const employee = await Employee.findById(req.params.id);
    if (!employee) return next(AppError.notFound('Employee not found'));
    if (firstName || lastName || phone || role) {
      const userUpdate = {};
      if (firstName) userUpdate.firstName = firstName;
      if (lastName) userUpdate.lastName = lastName;
      if (phone) userUpdate.phone = phone;
      if (role) userUpdate.role = role;
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
    if (!employee) return next(AppError.notFound('Employee not found'));
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
