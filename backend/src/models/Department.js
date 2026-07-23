const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true, maxlength: 100 },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, trim: true },
  head: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  budget: { type: Number, default: 0 },
  costCenter: { type: String, trim: true },
  location: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  color: { type: String, default: '#3B82F6' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

departmentSchema.virtual('employeeCount', {
  ref: 'Employee',
  localField: '_id',
  foreignField: 'department',
  count: true
});

departmentSchema.index({ isActive: 1 });

module.exports = mongoose.model('Department', departmentSchema);

