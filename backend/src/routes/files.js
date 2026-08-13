const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { downloadFile } = require('../controllers/downloadController');

// Authenticated download replacing static /uploads (SEC-5).
// GET /api/files/:category/:filename  (category in {avatar,document,resume})
router.use(protect);
router.get('/:category/:filename', downloadFile);

module.exports = router;
