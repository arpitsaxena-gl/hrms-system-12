const mongoose = require('mongoose');
const { ATTENDANCE_STATUS } = require('../config/constants');

const breakSchema = new mongoose.Schema({
  start: Date, end: Date, duration: Number
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  status: { type: String, enum: ATTENDANCE_STATUS, default: 'present' },
  shift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' },
  breaks: [breakSchema],
  workHours: { type: Number, default: 0 },
  overtime: { type: Number, default: 0 },
  lateMinutes: { type: Number, default: 0 },
  earlyLeaveMinutes: { type: Number, default: 0 },
  location: {
    checkIn: { latitude: Number, longitude: Number, address: String },
    checkOut: { latitude: Number, longitude: Number, address: String }
  },
  isRemote: { type: Boolean, default: false },
  notes: String,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  ipAddress: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ employee: 1 });

attendanceSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut) {
    const diff = (this.checkOut - this.checkIn) / (1000 * 60 * 60);
    const breakTime = this.breaks.reduce((acc, b) => {
      if (b.start && b.end) acc += (b.end - b.start) / (1000 * 60 * 60);
      return acc;
    }, 0);
    this.workHours = Math.max(0, diff - breakTime);
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
