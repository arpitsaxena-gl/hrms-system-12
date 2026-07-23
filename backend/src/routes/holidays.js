const express = require('express');
const router = express.Router();
const { getHolidays, createHoliday, updateHoliday, deleteHoliday } = require('../controllers/holidayController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getHolidays);
router.post('/', authorize('admin', 'hr'), createHoliday);
router.put('/:id', authorize('admin', 'hr'), updateHoliday);
router.delete('/:id', authorize('admin', 'hr'), deleteHoliday);

module.exports = router;
