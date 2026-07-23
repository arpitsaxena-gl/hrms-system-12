const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, uploadAvatar } = require('../controllers/profileController');
const { protect } = require('../middleware/auth');
const { uploadAvatar: avatarMiddleware } = require('../middleware/upload');

router.use(protect);
router.get('/', getProfile);
router.put('/', updateProfile);
router.post('/avatar', avatarMiddleware, uploadAvatar);

module.exports = router;
