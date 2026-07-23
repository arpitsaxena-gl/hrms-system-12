const mongoose = require('mongoose');
const { RECRUITMENT_STATUS, APPLICATION_STATUS } = require('../config/constants');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  designation: { type: mongoose.Schema.Types.ObjectId, ref: 'Designation' },
  vacancies: { type: Number, default: 1, min: 1 },
  description: { type: String, required: true },
  requirements: [String],
  responsibilities: [String],
  skills: [String],
  experienceRequired: { min: Number, max: Number },
  salaryRange: { min: Number, max: Number, currency: { type: String, default: 'INR' } },
  location: String,
  jobType: { type: String, enum: ['full_time', 'part_time', 'contract', 'intern'], default: 'full_time' },
  status: { type: String, enum: RECRUITMENT_STATUS, default: 'open' },
  deadline: Date,
  publishedAt: Date,
  closedAt: Date,
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true, toJSON: { virtuals: true } });

jobSchema.virtual('applicationCount', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'job',
  count: true
});

const applicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  applicantName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true },
  phone: String,
  resumeUrl: String,
  coverLetter: String,
  experience: Number,
  currentCompany: String,
  currentSalary: Number,
  expectedSalary: Number,
  noticePeriod: Number,
  skills: [String],
  status: { type: String, enum: APPLICATION_STATUS, default: 'applied' },
  source: { type: String, enum: ['website', 'referral', 'linkedin', 'naukri', 'indeed', 'other'], default: 'website' },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  interviews: [{
    round: Number,
    type: { type: String, enum: ['phone', 'video', 'in_person', 'technical'] },
    scheduledAt: Date,
    conductedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
    feedback: String,
    rating: { type: Number, min: 1, max: 5 },
    result: { type: String, enum: ['pass', 'fail', 'hold', 'pending'], default: 'pending' }
  }],
  offerDetails: {
    offeredSalary: Number,
    joiningDate: Date,
    offerLetterUrl: String,
    offerSentAt: Date,
    offerAcceptedAt: Date
  },
  notes: String,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const Job = mongoose.model('Job', jobSchema);
const Application = mongoose.model('Application', applicationSchema);
module.exports = { Job, Application };
