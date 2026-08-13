/**
 * Authenticated, ownership-checked file download controller (SEC-5).
 * Replaces the previous unauthenticated `express.static('/uploads')` serving.
 */
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/AppError');
const Employee = require('../models/Employee');
const logger = require('../utils/logger');
const { PRIVILEGED } = require('../middleware/policy');

const UPLOAD_ROOT = path.join(__dirname, '../../uploads');
// Accept both singular (api) and plural (legacy folder) category names.
const CATEGORIES = {
  avatar: 'avatars', avatars: 'avatars',
  document: 'documents', documents: 'documents',
  resume: 'resumes', resumes: 'resumes',
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function isAuthorized(user, category, filename) {
  if (PRIVILEGED.includes(user.role)) return true;

  const suffix = new RegExp(`${escapeRegex(filename)}$`);
  if (CATEGORIES[category] === 'avatars') {
    return !!(user.avatar && suffix.test(user.avatar));
  }

  // documents/resumes: owned via the requester's own Employee documents.
  try {
    const emp = user.employee && user.employee._id
      ? user.employee
      : await Employee.findOne({ user: user._id }).select('_id documents').populate('documents');
    if (!emp) return false;
    const docs = emp.documents || [];
    return docs.some((d) => {
      const candidates = [d.fileUrl, d.path, d.url, d.filename].filter(Boolean);
      return candidates.some((c) => suffix.test(String(c)));
    });
  } catch (err) {
    logger.warn(`downloadController ownership check failed: ${err.message}`);
    return false;
  }
}

const downloadFile = async (req, res, next) => {
  try {
    const { category, filename } = req.params;
    const folder = CATEGORIES[category];
    if (!folder) throw AppError.notFound('File not found');

    // Path-traversal guard: allow only simple file names within the folder.
    if (!/^[\w.\-]+$/.test(filename) || filename.includes('..')) {
      throw AppError.badRequest('Invalid file name');
    }
    const base = path.resolve(UPLOAD_ROOT, folder);
    const resolved = path.resolve(base, filename);
    if (resolved !== base && !resolved.startsWith(base + path.sep)) {
      throw AppError.badRequest('Invalid file path');
    }
    if (!fs.existsSync(resolved)) throw AppError.notFound('File not found');

    const authorized = await isAuthorized(req.user, category, filename);
    if (!authorized) throw AppError.forbidden('You are not allowed to access this file');

    return res.sendFile(resolved);
  } catch (err) {
    next(err);
  }
};

module.exports = { downloadFile };
