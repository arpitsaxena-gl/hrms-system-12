const express = require('express');
const router = express.Router();
const { getUsers, getUser, updateUser, deleteUser, resetUserPassword } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const paginate = require('../middleware/paginate');

router.use(protect);
router.get('/', authorize('admin', 'hr'), paginate, getUsers);
router.get('/:id', authorize('admin', 'hr'), getUser);
router.put('/:id', authorize('admin', 'hr'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);
router.put('/:id/reset-password', authorize('admin', 'hr'), resetUserPassword);

module.exports = router;
