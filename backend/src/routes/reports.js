const express = require('express');
const router = express.Router();
const { getAttendanceReport, getLeaveReport, getPayrollReport, getHeadcountReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin', 'hr'));
router.get('/attendance', getAttendanceReport);
router.get('/leaves', getLeaveReport);
router.get('/payroll', getPayrollReport);
router.get('/headcount', getHeadcountReport);

module.exports = router;
