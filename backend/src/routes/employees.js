const express = require('express');
const router = express.Router();
const { getEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee, getEmployeeStats } = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/auth');
const paginate = require('../middleware/paginate');

router.use(protect);
router.get('/stats', authorize('admin', 'hr', 'manager'), getEmployeeStats);
router.get('/', paginate, getEmployees);
router.get('/:id', getEmployee);
router.post('/', authorize('admin', 'hr'), createEmployee);
router.put('/:id', authorize('admin', 'hr'), updateEmployee);
router.delete('/:id', authorize('admin'), deleteEmployee);

module.exports = router;
