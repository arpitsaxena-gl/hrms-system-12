const express = require('express');
const router = express.Router();
const { getEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee, getEmployeeStats } = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/auth');
const paginate = require('../middleware/paginate');
const validate = require('../middleware/validate');
const { createSchema, updateSchema } = require('../validators/employee.schema');

router.use(protect);
router.get('/stats', authorize('admin', 'hr', 'manager'), getEmployeeStats);
router.get('/', paginate, getEmployees);
router.get('/:id', getEmployee);
router.post('/', authorize('admin', 'hr'), validate.schema(createSchema), createEmployee);
router.put('/:id', authorize('admin', 'hr'), validate.schema(updateSchema), updateEmployee);
router.delete('/:id', authorize('admin'), deleteEmployee);

module.exports = router;
