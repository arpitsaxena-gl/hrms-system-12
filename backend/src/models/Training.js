const mongoose = require('mongoose');
const { TRAINING_STATUS } = require('../config/constants');

const trainingSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: { type: String, enum: ['technical', 'soft_skills', 'compliance', 'leadership', 'safety', 'other'], default: 'other' },
  type: { type: String, enum: ['internal', 'external', 'online', 'workshop', 'seminar'], default: 'internal' },
  trainer: { name: String, organization: String, email: String, phone: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  duration: Number,
  venue: String,
  maxParticipants: { type: Number, default: 20 },
  cost: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  materials: [{ filename: String, url: String }],
  participants: [{
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    status: { type: String, enum: ['invited', 'confirmed', 'attended', 'absent', 'cancelled'], default: 'invited' },
    attendance: { type: Boolean, default: false },
    score: Number, feedback: String, certificate: String, completedAt: Date
  }],
  status: { type: String, enum: TRAINING_STATUS, default: 'scheduled' },
  objectives: [String], outcomes: [String], prerequisites: [String],
  isMandatory: { type: Boolean, default: false },
  departments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

trainingSchema.index({ status: 1 });
trainingSchema.index({ startDate: 1 });
trainingSchema.index({ category: 1 });

module.exports = mongoose.model('Training', trainingSchema);
