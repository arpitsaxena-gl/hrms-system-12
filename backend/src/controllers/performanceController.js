const Performance = require('../models/Performance');
const Employee = require('../models/Employee');
const ApiResponse = require('../utils/apiResponse');
const { createError } = require('../utils/helpers');

const getReviews = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { status, employeeId, year } = req.query;
    let query = {};
    if (req.user.role === 'employee') {
      const emp = await Employee.findOne({ user: req.user._id });
      if (emp) query.$or = [{ employee: emp._id }, { reviewer: emp._id }];
    } else if (employeeId) query.employee = employeeId;
    if (status) query.status = status;
    if (year) query['reviewPeriod.from'] = { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31) };
    const [reviews, total] = await Promise.all([
      Performance.find(query).populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName avatar' } }).populate({ path: 'reviewer', populate: { path: 'user', select: 'firstName lastName' } }).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Performance.countDocuments(query)
    ]);
    ApiResponse.paginated(res, reviews, total, page, limit);
  } catch (err) { next(err); }
};

const createReview = async (req, res, next) => {
  try {
    const review = await Performance.create({ ...req.body, createdBy: req.user._id });
    ApiResponse.created(res, review, 'Performance review created');
  } catch (err) { next(err); }
};

const updateReview = async (req, res, next) => {
  try {
    const review = await Performance.findByIdAndUpdate(req.params.id, { ...req.body, updatedBy: req.user._id }, { new: true, runValidators: true });
    if (!review) return next(createError('Review not found', 404));
    ApiResponse.success(res, review, 'Review updated');
  } catch (err) { next(err); }
};

const submitReview = async (req, res, next) => {
  try {
    const review = await Performance.findByIdAndUpdate(req.params.id, { status: 'submitted', submittedAt: new Date(), updatedBy: req.user._id }, { new: true });
    if (!review) return next(createError('Review not found', 404));
    ApiResponse.success(res, review, 'Review submitted');
  } catch (err) { next(err); }
};

module.exports = { getReviews, createReview, updateReview, submitReview };
