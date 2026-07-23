const mongoose = require('mongoose');
const { DOCUMENT_TYPES } = require('../config/constants');

const documentSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  title: { type: String, required: true, trim: true },
  type: { type: String, enum: DOCUMENT_TYPES, default: 'other' },
  filename: { type: String, required: true },
  originalName: String, mimeType: String, size: Number, url: String, path: String, description: String,
  isVerified: { type: Boolean, default: false },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: Date, expiryDate: Date, tags: [String],
  isConfidential: { type: Boolean, default: false },
  accessLevel: { type: String, enum: ['all', 'hr', 'admin'], default: 'all' },
  version: { type: Number, default: 1 },
  previousVersions: [{ url: String, uploadedAt: Date, uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

documentSchema.index({ employee: 1 });
documentSchema.index({ type: 1 });
documentSchema.index({ isVerified: 1 });

module.exports = mongoose.model('Document', documentSchema);
