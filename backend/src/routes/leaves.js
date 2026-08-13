const express = require('express');
const router = express.Router();
const { getLeaves, applyLeave, updateLeaveStatus, cancelLeave, getLeaveBalance } = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/auth');
const paginate = require('../middleware/paginate');
const validate = require('../middleware/validate');
const { applyLeaveSchema, updateStatusSchema, listQuerySchema } = require('../validators/leave.schema');

router.use(protect);
router.get('/balance', getLeaveBalance);
router.get('/balance/:id', authorize('admin', 'hr', 'manager'), getLeaveBalance);
router.get('/', paginate, validate.schema(listQuerySchema, 'query'), getLeaves);
router.post('/', validate.schema(applyLeaveSchema), applyLeave);
router.put('/:id/status', authorize('admin', 'hr', 'manager'), validate.schema(updateStatusSchema), updateLeaveStatus);
router.put('/:id/cancel', cancelLeave);

module.exports = router;
