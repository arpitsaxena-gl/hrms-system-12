const express = require('express');
const router = express.Router();
const { getLeaves, applyLeave, updateLeaveStatus, cancelLeave, getLeaveBalance } = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/auth');
const paginate = require('../middleware/paginate');

router.use(protect);
router.get('/balance', getLeaveBalance);
router.get('/balance/:id', authorize('admin', 'hr', 'manager'), getLeaveBalance);
router.get('/', paginate, getLeaves);
router.post('/', applyLeave);
router.put('/:id/status', authorize('admin', 'hr', 'manager'), updateLeaveStatus);
router.put('/:id/cancel', cancelLeave);

module.exports = router;
