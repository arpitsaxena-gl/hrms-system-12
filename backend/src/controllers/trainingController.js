const Training = require('../models/Training');
const Employee = require('../models/Employee');
const ApiResponse = require('../utils/apiResponse');
const { createError } = require('../utils/helpers');

const getTrainings = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { status, category, search } = req.query;
    let query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) query.title = new RegExp(search, 'i');
    const [trainings, total] = await Promise.all([
      Training.find(query).populate('departments', 'name').populate({ path: 'participants.employee', populate: { path: 'user', select: 'firstName lastName' } }).skip(skip).limit(limit).sort({ startDate: -1 }),
      Training.countDocuments(query)
    ]);
    ApiResponse.paginated(res, trainings, total, page, limit);
  } catch (err) { next(err); }
};

const createTraining = async (req, res, next) => {
  try {
    const training = await Training.create({ ...req.body, createdBy: req.user._id });
    ApiResponse.created(res, training, 'Training created');
  } catch (err) { next(err); }
};

const updateTraining = async (req, res, next) => {
  try {
    const training = await Training.findByIdAndUpdate(req.params.id, { ...req.body, updatedBy: req.user._id }, { new: true, runValidators: true });
    if (!training) return next(createError('Training not found', 404));
    ApiResponse.success(res, training, 'Training updated');
  } catch (err) { next(err); }
};

const enrollEmployee = async (req, res, next) => {
  try {
    const { employeeId } = req.body;
    const training = await Training.findById(req.params.id);
    if (!training) return next(createError('Training not found', 404));
    if (training.participants.length >= training.maxParticipants) return next(createError('Training is full', 400));
    const already = training.participants.find(p => String(p.employee) === employeeId);
    if (already) return next(createError('Employee already enrolled', 400));
    training.participants.push({ employee: employeeId, status: 'confirmed' });
    await training.save();
    ApiResponse.success(res, training, 'Employee enrolled');
  } catch (err) { next(err); }
};

module.exports = { getTrainings, createTraining, updateTraining, enrollEmployee };
