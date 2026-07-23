const Designation = require('../models/Designation');
const Employee = require('../models/Employee');
const ApiResponse = require('../utils/apiResponse');
const { createError } = require('../utils/helpers');

const getDesignations = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { search, department, isActive } = req.query;
    let query = {};
    if (search) query.name = new RegExp(search, 'i');
    if (department) query.department = department;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    const [designations, total] = await Promise.all([
      Designation.find(query).populate('department', 'name').skip(skip).limit(limit).sort({ name: 1 }),
      Designation.countDocuments(query)
    ]);
    ApiResponse.paginated(res, designations, total, page, limit);
  } catch (err) { next(err); }
};

const createDesignation = async (req, res, next) => {
  try {
    const desig = await Designation.create({ ...req.body, createdBy: req.user._id });
    ApiResponse.created(res, desig, 'Designation created');
  } catch (err) { next(err); }
};

const updateDesignation = async (req, res, next) => {
  try {
    const desig = await Designation.findByIdAndUpdate(req.params.id, { ...req.body, updatedBy: req.user._id }, { new: true, runValidators: true });
    if (!desig) return next(createError('Designation not found', 404));
    ApiResponse.success(res, desig, 'Designation updated');
  } catch (err) { next(err); }
};

const deleteDesignation = async (req, res, next) => {
  try {
    const count = await Employee.countDocuments({ designation: req.params.id });
    if (count > 0) return next(createError(`Cannot delete designation with ${count} employees`, 400));
    const desig = await Designation.findByIdAndDelete(req.params.id);
    if (!desig) return next(createError('Designation not found', 404));
    ApiResponse.success(res, null, 'Designation deleted');
  } catch (err) { next(err); }
};

module.exports = { getDesignations, createDesignation, updateDesignation, deleteDesignation };
