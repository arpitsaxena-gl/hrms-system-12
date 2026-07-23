const mongoose = require('mongoose');
const { NOTIFICATION_TYPES } = require('../config/constants');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  type: { type: String, enum: NOTIFICATION_TYPES, default: 'info' },
  category: { type: String, enum: ['leave', 'attendance', 'payroll', 'performance', 'training', 'recruitment', 'general', 'system'], default: 'general' },
  isRead: { type: Boolean, default: false },
  readAt: Date,
  link: String,
  data: { type: mongoose.Schema.Types.Mixed },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  expiresAt: Date
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('Notification', notificationSchema);
