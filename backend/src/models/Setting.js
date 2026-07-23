const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, trim: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  type: { type: String, enum: ['string', 'number', 'boolean', 'object', 'array'], default: 'string' },
  group: { type: String, enum: ['general', 'hr', 'payroll', 'attendance', 'leave', 'email', 'system'], default: 'general' },
  label: String, description: String,
  isPublic: { type: Boolean, default: false },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

settingSchema.index({ group: 1 });

module.exports = mongoose.model('Setting', settingSchema);

