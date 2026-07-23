const express = require('express');
const router = express.Router();
const { getDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment, getDepartmentTree } = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');
const paginate = require('../middleware/paginate');

router.use(protect);
router.get('/tree', getDepartmentTree);
router.get('/', paginate, getDepartments);
router.get('/:id', getDepartment);
router.post('/', authorize('admin', 'hr'), createDepartment);
router.put('/:id', authorize('admin', 'hr'), updateDepartment);
router.delete('/:id', authorize('admin'), deleteDepartment);

module.exports = router;
