const mongoose = require('mongoose');
const { GENDER, MARITAL_STATUS, BLOOD_GROUPS, EMPLOYMENT_TYPES, EMPLOYMENT_STATUS } = require('../config/constants');

const addressSchema = new mongoose.Schema({
  street: String, city: String, state: String, country: { type: String, default: 'India' }, zipCode: String
}, { _id: false });

const emergencyContactSchema = new mongoose.Schema({
  name: String, relationship: String, phone: String, email: String
}, { _id: false });

const bankDetailsSchema = new mongoose.Schema({
  bankName: String, accountNumber: String, ifscCode: String, accountType: { type: String, enum: ['savings', 'current'], default: 'savings' }
}, { _id: false });

const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, unique: true, trim: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  designation: { type: mongoose.Schema.Types.ObjectId, ref: 'Designation', required: true },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  shift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', default: null },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: GENDER },
  maritalStatus: { type: String, enum: MARITAL_STATUS },
  bloodGroup: { type: String, enum: BLOOD_GROUPS },
  nationality: { type: String, default: 'Indian' },
  religion: String,
  phone: { type: String, trim: true },
  alternatePhone: String,
  personalEmail: String,
  joiningDate: { type: Date, required: true },
  confirmationDate: Date,
  resignationDate: Date,
  terminationDate: Date,
  lastWorkingDay: Date,
  employmentType: { type: String, enum: EMPLOYMENT_TYPES, default: 'full_time' },
  employmentStatus: { type: String, enum: EMPLOYMENT_STATUS, default: 'on_probation' },
  probationPeriod: { type: Number, default: 6 },
  noticePeriod: { type: Number, default: 30 },
  currentAddress: addressSchema,
  permanentAddress: addressSchema,
  emergencyContact: emergencyContactSchema,
  bankDetails: bankDetailsSchema,
  skills: [{ type: String, trim: true }],
  qualifications: [{
    degree: String, institution: String, year: Number, grade: String
  }],
  experience: [{
    company: String, position: String, from: Date, to: Date, description: String
  }],
  salary: {
    basic: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    da: { type: Number, default: 0 },
    ta: { type: Number, default: 0 },
    medical: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
    gross: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' }
  },
  documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
  leaveBalance: {
    annual: { type: Number, default: 18 },
    sick: { type: Number, default: 12 },
    casual: { type: Number, default: 6 },
    compensatory: { type: Number, default: 0 }
  },
  assets: [{ name: String, assetId: String, assignedDate: Date }],
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

employeeSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
});

employeeSchema.virtual('yearsOfService').get(function() {
  if (!this.joiningDate) return 0;
  const diff = Date.now() - new Date(this.joiningDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
});

employeeSchema.pre('save', function(next) {
  const s = this.salary;
  if (s) s.gross = (s.basic || 0) + (s.hra || 0) + (s.da || 0) + (s.ta || 0) + (s.medical || 0) + (s.other || 0);
  next();
});

employeeSchema.pre('save', async function(next) {
  if (!this.employeeId) {
    const count = await this.constructor.countDocuments();
    this.employeeId = `EMP${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

employeeSchema.index({ department: 1 });
employeeSchema.index({ designation: 1 });
employeeSchema.index({ manager: 1 });
employeeSchema.index({ employmentStatus: 1 });
employeeSchema.index({ user: 1 });

module.exports = mongoose.model('Employee', employeeSchema);

