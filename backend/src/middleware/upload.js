const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createError } = require('../utils/helpers');

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

const storage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads', folder);
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(createError(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`, 400), false);
};

const uploadAvatar = multer({
  storage: storage('avatars'),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
  fileFilter: fileFilter(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
}).single('avatar');

const uploadDocument = multer({
  storage: storage('documents'),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
  fileFilter: fileFilter(['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
}).single('document');

const uploadResume = multer({
  storage: storage('resumes'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
}).single('resume');

module.exports = { uploadAvatar, uploadDocument, uploadResume };
