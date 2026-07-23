const mongoose = require('mongoose');
const { PERFORMANCE_STATUS } = require('../config/constants');

const performanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  reviewPeriod: {
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    type: { type: String, enum: ['monthly', 'quarterly', 'half_yearly', 'annual'], default: 'annual' }
  },
  goals: [{
    title: String, description: String, targetDate: Date,
    weightage: { type: Number, default: 10 },
    achieved: { type: Boolean, default: false },
    achievementPercentage: { type: Number, default: 0, min: 0, max: 100 },
    comments: String
  }],
  competencies: [{
    name: String, description: String,
    rating: { type: Number, min: 1, max: 5 },
    comments: String
  }],
  selfAssessment: {
    achievements: String, areasForImprovement: String,
    trainingNeeds: String, careerGoals: String,
    overallRating: { type: Number, min: 1, max: 5 }
  },
  managerAssessment: {
    strengths: String, areasForImprovement: String, developmentPlan: String,
    overallRating: { type: Number, min: 1, max: 5 },
    recommendation: { type: String, enum: ['promote', 'retain', 'improve', 'terminate'] }
  },
  finalRating: { type: Number, min: 1, max: 5 },
  grade: { type: String, enum: ['A+', 'A', 'B+', 'B', 'C', 'D'] },
  status: { type: String, enum: PERFORMANCE_STATUS, default: 'draft' },
  submittedAt: Date, reviewedAt: Date, acknowledgedAt: Date,
  incrementPercentage: { type: Number, default: 0 },
  bonusPercentage: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

performanceSchema.index({ employee: 1 });
performanceSchema.index({ reviewer: 1 });
performanceSchema.index({ status: 1 });

module.exports = mongoose.model('Performance', performanceSchema);
