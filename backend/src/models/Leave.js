const mongoose = require('mongoose');
const { LEAVE_TYPES, LEAVE_STATUS } = require('../config/constants');

const leaveSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  leaveType: { type: String, enum: LEAVE_TYPES, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalDays: { type: Number, default: 1 },
  isHalfDay: { type: Boolean, default: false },
  halfDayType: { type: String, enum: ['morning', 'afternoon'] },
  reason: { type: String, required: true, trim: true, maxlength: 500 },
  status: { type: String, enum: LEAVE_STATUS, default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  rejectionReason: String,
  cancelledAt: Date,
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attachments: [{ filename: String, path: String, uploadedAt: { type: Date, default: Date.now } }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comment: String,
    date: { type: Date, default: Date.now }
  }],
  isEmergency: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

leaveSchema.pre('save', function(next) {
  if (this.startDate && this.endDate && !this.isHalfDay) {
    const diff = Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24)) + 1;
    this.totalDays = diff;
  } else if (this.isHalfDay) {
    this.totalDays = 0.5;
  }
  next();
});

leaveSchema.index({ employee: 1 });
leaveSchema.index({ status: 1 });
leaveSchema.index({ startDate: 1, endDate: 1 });
leaveSchema.index({ leaveType: 1 });

module.exports = mongoose.model('Leave', leaveSchema);
