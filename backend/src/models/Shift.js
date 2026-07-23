const mongoose = require('mongoose');
const { SHIFT_TYPES } = require('../config/constants');

const shiftSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  type: { type: String, enum: SHIFT_TYPES, default: 'general' },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  breakDuration: { type: Number, default: 30 },
  workHours: { type: Number, default: 8 },
  gracePeriod: { type: Number, default: 15 },
  halfDayHours: { type: Number, default: 4 },
  overtimeThreshold: { type: Number, default: 9 },
  weeklyOff: [{ type: String, enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] }],
  isFlexible: { type: Boolean, default: false },
  flexibleWindowMinutes: { type: Number, default: 60 },
  description: String,
  color: { type: String, default: '#3B82F6' },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

shiftSchema.index({ isActive: 1 });

module.exports = mongoose.model('Shift', shiftSchema);

