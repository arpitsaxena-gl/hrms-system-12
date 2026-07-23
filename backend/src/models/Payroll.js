const mongoose = require('mongoose');
const { PAYROLL_STATUS } = require('../config/constants');

const payrollSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  payPeriod: { start: Date, end: Date },
  earnings: {
    basic: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    da: { type: Number, default: 0 },
    ta: { type: Number, default: 0 },
    medical: { type: Number, default: 0 },
    overtime: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    incentive: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
    grossEarnings: { type: Number, default: 0 }
  },
  deductions: {
    pf: { type: Number, default: 0 },
    esi: { type: Number, default: 0 },
    tds: { type: Number, default: 0 },
    professionalTax: { type: Number, default: 0 },
    loanRepayment: { type: Number, default: 0 },
    leave: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 }
  },
  attendanceSummary: {
    totalDays: { type: Number, default: 0 },
    presentDays: { type: Number, default: 0 },
    absentDays: { type: Number, default: 0 },
    leaveDays: { type: Number, default: 0 },
    holidays: { type: Number, default: 0 },
    workingDays: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 }
  },
  netSalary: { type: Number, default: 0 },
  status: { type: String, enum: PAYROLL_STATUS, default: 'draft' },
  paymentDate: Date,
  paymentMethod: { type: String, enum: ['bank_transfer', 'cash', 'cheque'], default: 'bank_transfer' },
  transactionId: String,
  payslipUrl: String,
  notes: String,
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedAt: Date,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

payrollSchema.pre('save', function(next) {
  const e = this.earnings;
  e.grossEarnings = (e.basic||0)+(e.hra||0)+(e.da||0)+(e.ta||0)+(e.medical||0)+(e.overtime||0)+(e.bonus||0)+(e.incentive||0)+(e.other||0);
  const d = this.deductions;
  d.totalDeductions = (d.pf||0)+(d.esi||0)+(d.tds||0)+(d.professionalTax||0)+(d.loanRepayment||0)+(d.leave||0)+(d.other||0);
  this.netSalary = e.grossEarnings - d.totalDeductions;
  next();
});

payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });
payrollSchema.index({ status: 1 });
payrollSchema.index({ year: 1, month: 1 });

module.exports = mongoose.model('Payroll', payrollSchema);
