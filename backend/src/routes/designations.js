const express = require('express');
const router = express.Router();
const { getDesignations, createDesignation, updateDesignation, deleteDesignation } = require('../controllers/designationController');
const { protect, authorize } = require('../middleware/auth');
const paginate = require('../middleware/paginate');

router.use(protect);
router.get('/', paginate, getDesignations);
router.post('/', authorize('admin', 'hr'), createDesignation);
router.put('/:id', authorize('admin', 'hr'), updateDesignation);
router.delete('/:id', authorize('admin'), deleteDesignation);

module.exports = router;
