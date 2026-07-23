const { Job, Application } = require('../models/Recruitment');
const ApiResponse = require('../utils/apiResponse');
const { createError } = require('../utils/helpers');

const getJobs = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { status, department, search } = req.query;
    let query = {};
    if (status) query.status = status;
    if (department) query.department = department;
    if (search) query.title = new RegExp(search, 'i');
    const [jobs, total] = await Promise.all([
      Job.find(query).populate('department', 'name').populate('designation', 'name').populate('postedBy', 'firstName lastName').skip(skip).limit(limit).sort({ createdAt: -1 }),
      Job.countDocuments(query)
    ]);
    ApiResponse.paginated(res, jobs, total, page, limit);
  } catch (err) { next(err); }
};

const createJob = async (req, res, next) => {
  try {
    const job = await Job.create({ ...req.body, postedBy: req.user._id, createdBy: req.user._id });
    ApiResponse.created(res, job, 'Job posting created');
  } catch (err) { next(err); }
};

const updateJob = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, { ...req.body, updatedBy: req.user._id }, { new: true, runValidators: true });
    if (!job) return next(createError('Job not found', 404));
    ApiResponse.success(res, job, 'Job updated');
  } catch (err) { next(err); }
};

const getApplications = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { jobId, status } = req.query;
    let query = {};
    if (jobId) query.job = jobId;
    if (status) query.status = status;
    const [apps, total] = await Promise.all([
      Application.find(query).populate('job', 'title department').skip(skip).limit(limit).sort({ createdAt: -1 }),
      Application.countDocuments(query)
    ]);
    ApiResponse.paginated(res, apps, total, page, limit);
  } catch (err) { next(err); }
};

const createApplication = async (req, res, next) => {
  try {
    const app = await Application.create({ ...req.body, createdBy: req.user ? req.user._id : undefined });
    ApiResponse.created(res, app, 'Application submitted');
  } catch (err) { next(err); }
};

const updateApplicationStatus = async (req, res, next) => {
  try {
    const app = await Application.findByIdAndUpdate(req.params.id, { status: req.body.status, reviewedBy: req.user._id, updatedBy: req.user._id }, { new: true });
    if (!app) return next(createError('Application not found', 404));
    ApiResponse.success(res, app, 'Application status updated');
  } catch (err) { next(err); }
};

module.exports = { getJobs, createJob, updateJob, getApplications, createApplication, updateApplicationStatus };
