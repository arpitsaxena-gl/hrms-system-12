const express = require('express');
const router = express.Router();
const { getDashboardStats, getAdminDashboard } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getDashboardStats);
router.get('/admin', authorize('admin', 'hr'), getAdminDashboard);

module.exports = router;
