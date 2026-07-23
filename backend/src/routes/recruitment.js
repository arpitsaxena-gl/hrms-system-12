const express = require('express');
const router = express.Router();
const { getJobs, createJob, updateJob, getApplications, createApplication, updateApplicationStatus } = require('../controllers/recruitmentController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const paginate = require('../middleware/paginate');

router.get('/jobs', paginate, getJobs);
router.post('/apply/:jobId', optionalAuth, createApplication);
router.use(protect);
router.post('/jobs', authorize('admin', 'hr'), createJob);
router.put('/jobs/:id', authorize('admin', 'hr'), updateJob);
router.get('/applications', authorize('admin', 'hr'), paginate, getApplications);
router.put('/applications/:id/status', authorize('admin', 'hr'), updateApplicationStatus);

module.exports = router;
