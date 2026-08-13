const mongoose = require('mongoose');
const { LEAVE_TYPES, LEAVE_STATUS } = require('../config/constants');

const leaveSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  leaveType: { type: String, enum: LEAVE_TYPES, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalDays: { type: Number, default: 1, min: [0.5, 'A leave must be at least half a day'] },
  isHalfDay: { type: Boolean, default: false },
  halfDayType: { type: String, enum: ['morning', 'afternoon'] },
  reason: { type: String, required: true, trim: true, maxlength: 500 },
  status: { type: String, enum: LEAVE_STATUS, default: 'pending' },
  // True while this leave holds a reserved balance decrement; guards restore-once (BUG-1).
  balanceReserved: { type: Boolean, default: false },
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

// Compute totalDays BEFORE validation so the balance check always sees the real
// span, not the default of 1 (BUG-1).
leaveSchema.pre('validate', function(next) {
  if (this.isHalfDay) {
    this.totalDays = 0.5;
  } else if (this.startDate && this.endDate) {
    const diff = Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24)) + 1;
    this.totalDays = diff > 0 ? diff : this.totalDays;
  }
  next();
});

leaveSchema.index({ employee: 1 });
leaveSchema.index({ status: 1 });
leaveSchema.index({ startDate: 1, endDate: 1 });
leaveSchema.index({ leaveType: 1 });
// Supports the overlap query in leaveService (pending|approved leaves for an employee).
leaveSchema.index({ employee: 1, status: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('Leave', leaveSchema);
