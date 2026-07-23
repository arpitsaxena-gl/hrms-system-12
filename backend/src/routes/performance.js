const express = require('express');
const router = express.Router();
const { getReviews, createReview, updateReview, submitReview } = require('../controllers/performanceController');
const { protect, authorize } = require('../middleware/auth');
const paginate = require('../middleware/paginate');

router.use(protect);
router.get('/', paginate, getReviews);
router.post('/', authorize('admin', 'hr', 'manager'), createReview);
router.put('/:id', updateReview);
router.put('/:id/submit', submitReview);

module.exports = router;
