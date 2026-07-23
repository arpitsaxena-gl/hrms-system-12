const express = require('express');
const router = express.Router();
const { getSettings, updateSetting, bulkUpdateSettings } = require('../controllers/settingController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getSettings);
router.put('/', authorize('admin'), updateSetting);
router.put('/bulk', authorize('admin'), bulkUpdateSettings);

module.exports = router;
