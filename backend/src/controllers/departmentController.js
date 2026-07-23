const Department = require('../models/Department');
const Employee = require('../models/Employee');
const ApiResponse = require('../utils/apiResponse');
const { createError } = require('../utils/helpers');

const getDepartments = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { search, isActive } = req.query;
    let query = {};
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { code: new RegExp(search, 'i') }];
    if (isActive !== undefined) query.isActive = isActive === 'true';
    const [departments, total] = await Promise.all([
      Department.find(query).populate('head', 'employeeId').skip(skip).limit(limit).sort({ name: 1 }),
      Department.countDocuments(query)
    ]);
    ApiResponse.paginated(res, departments, total, page, limit);
  } catch (err) { next(err); }
};

const getDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findById(req.params.id).populate({ path: 'head', populate: { path: 'user', select: 'firstName lastName email avatar' } }).populate('parent', 'name');
    if (!dept) return next(createError('Department not found', 404));
    const empCount = await Employee.countDocuments({ department: dept._id, employmentStatus: 'active' });
    ApiResponse.success(res, { ...dept.toObject(), employeeCount: empCount });
  } catch (err) { next(err); }
};

const createDepartment = async (req, res, next) => {
  try {
    const dept = await Department.create({ ...req.body, createdBy: req.user._id });
    ApiResponse.created(res, dept, 'Department created');
  } catch (err) { next(err); }
};

const updateDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, { ...req.body, updatedBy: req.user._id }, { new: true, runValidators: true });
    if (!dept) return next(createError('Department not found', 404));
    ApiResponse.success(res, dept, 'Department updated');
  } catch (err) { next(err); }
};

const deleteDepartment = async (req, res, next) => {
  try {
    const empCount = await Employee.countDocuments({ department: req.params.id });
    if (empCount > 0) return next(createError(`Cannot delete department with ${empCount} employees`, 400));
    const dept = await Department.findByIdAndDelete(req.params.id);
    if (!dept) return next(createError('Department not found', 404));
    ApiResponse.success(res, null, 'Department deleted');
  } catch (err) { next(err); }
};

const getDepartmentTree = async (req, res, next) => {
  try {
    const departments = await Department.find({ isActive: true }).lean();
    const buildTree = (items, parentId = null) =>
      items.filter(i => String(i.parent || null) === String(parentId))
           .map(i => ({ ...i, children: buildTree(items, i._id) }));
    ApiResponse.success(res, buildTree(departments));
  } catch (err) { next(err); }
};

module.exports = { getDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment, getDepartmentTree };
