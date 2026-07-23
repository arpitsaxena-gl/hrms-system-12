const express = require('express');
const router = express.Router();
const { getPayrolls, processPayroll, approvePayroll, markAsPaid, getPayrollSummary } = require('../controllers/payrollController');
const { protect, authorize } = require('../middleware/auth');
const paginate = require('../middleware/paginate');

router.use(protect);
router.get('/summary', authorize('admin', 'hr'), getPayrollSummary);
router.get('/', paginate, getPayrolls);
router.post('/process', authorize('admin', 'hr'), processPayroll);
router.put('/:id/approve', authorize('admin', 'hr'), approvePayroll);
router.put('/:id/paid', authorize('admin', 'hr'), markAsPaid);

module.exports = router;
