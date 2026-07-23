const express = require('express');
const router = express.Router();
const { getShifts, createShift, updateShift, deleteShift } = require('../controllers/shiftController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getShifts);
router.post('/', authorize('admin', 'hr'), createShift);
router.put('/:id', authorize('admin', 'hr'), updateShift);
router.delete('/:id', authorize('admin'), deleteShift);

module.exports = router;
