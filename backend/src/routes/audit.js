const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const { protect, authorize } = require('../middleware/auth');
const paginate = require('../middleware/paginate');

router.use(protect, authorize('admin'));
router.get('/', paginate, getAuditLogs);

module.exports = router;
