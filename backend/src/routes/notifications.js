const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, deleteNotification } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const paginate = require('../middleware/paginate');

router.use(protect);
router.get('/', paginate, getNotifications);
router.put('/mark-read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
