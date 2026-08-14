const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAdminDashboard,
  getDashboardStatsFlat,
  getAttendanceTrend7d,
  getDeptDistribution,
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getDashboardStats);
router.get('/stats', getDashboardStatsFlat);
router.get('/attendance-trend', getAttendanceTrend7d);
router.get('/dept-distribution', getDeptDistribution);
router.get('/admin', authorize('admin', 'hr'), getAdminDashboard);

module.exports = router;
