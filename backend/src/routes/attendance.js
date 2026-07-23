const express = require('express');
const router = express.Router();
const { checkIn, checkOut, getAttendance, getAttendanceSummary, bulkAttendance } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');
const paginate = require('../middleware/paginate');

router.use(protect);
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/summary', getAttendanceSummary);
router.post('/bulk', authorize('admin', 'hr'), bulkAttendance);
router.get('/', paginate, getAttendance);

module.exports = router;
