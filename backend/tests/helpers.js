const mongoose = require('mongoose');
const User = require('../src/models/User');
const Employee = require('../src/models/Employee');

let counter = 0;
const uniqueEmail = () => `user${Date.now()}_${counter++}@test.com`;

/**
 * Seed a User + Employee. department/designation refs are not existence-checked
 * by the schema, so arbitrary ObjectIds keep the fixture independent of the
 * Department/Designation models.
 */
async function seedEmployee({ role = 'employee', email, leaveBalance, manager } = {}) {
  const user = await User.create({
    firstName: 'T', lastName: 'U', email: email || uniqueEmail(), password: 'secret1', role,
  });
  const emp = await Employee.create({
    user: user._id,
    department: new mongoose.Types.ObjectId(),
    designation: new mongoose.Types.ObjectId(),
    joiningDate: new Date(),
    ...(manager ? { manager } : {}),
    ...(leaveBalance ? { leaveBalance } : {}),
  });
  await User.findByIdAndUpdate(user._id, { employee: emp._id });
  const populated = await User.findById(user._id).populate('employee');
  return { user: populated, emp };
}

module.exports = { seedEmployee, uniqueEmail };
