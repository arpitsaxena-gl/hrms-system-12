const express = require('express');
const router = express.Router();
const { getTrainings, createTraining, updateTraining, enrollEmployee } = require('../controllers/trainingController');
const { protect, authorize } = require('../middleware/auth');
const paginate = require('../middleware/paginate');

router.use(protect);
router.get('/', paginate, getTrainings);
router.post('/', authorize('admin', 'hr'), createTraining);
router.put('/:id', authorize('admin', 'hr'), updateTraining);
router.post('/:id/enroll', authorize('admin', 'hr'), enrollEmployee);

module.exports = router;
