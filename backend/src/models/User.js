const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ROLES } = require('../config/constants');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required: [firstName, lastName, email, password, role]
 *       properties:
 *         _id: { type: string }
 *         firstName: { type: string }
 *         lastName: { type: string }
 *         email: { type: string }
 *         role: { type: string, enum: [admin, hr, manager, employee] }
 *         isActive: { type: boolean }
 *         avatar: { type: string }
 */
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: [true, 'First name is required'], trim: true, maxlength: 50 },
  lastName: { type: String, required: [true, 'Last name is required'], trim: true, maxlength: 50 },
  email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email'] },
  password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
  role: { type: String, enum: Object.values(ROLES), default: ROLES.EMPLOYEE },
  isActive: { type: Boolean, default: true },
  avatar: { type: String, default: null },
  phone: { type: String, trim: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  passwordChangedAt: { type: Date },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, select: false },
  preferences: {
    theme: { type: String, default: 'light' },
    language: { type: String, default: 'en' },
    notifications: { email: { type: Boolean, default: true }, push: { type: Boolean, default: true } },
    timezone: { type: String, default: 'UTC' }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

userSchema.virtual('fullName').get(function() { return `${this.firstName} ${this.lastName}`; });
userSchema.virtual('isLocked').get(function() { return !!(this.lockUntil && this.lockUntil > Date.now()); });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
  this.password = await bcrypt.hash(this.password, rounds);
  if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAuthToken = function() {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET || 'secret', { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

userSchema.methods.generateRefreshToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_REFRESH_SECRET || 'refresh_secret', { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' });
};

userSchema.methods.passwordChangedAfter = function(jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedAt = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return jwtTimestamp < changedAt;
  }
  return false;
};

userSchema.statics.findByEmail = function(email) { return this.findOne({ email: email.toLowerCase() }); };

userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ employee: 1 });

module.exports = mongoose.model('User', userSchema);

