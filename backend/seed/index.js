require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Employee = require('../src/models/Employee');
const Department = require('../src/models/Department');
const Designation = require('../src/models/Designation');
const Shift = require('../src/models/Shift');
const Holiday = require('../src/models/Holiday');
const Setting = require('../src/models/Setting');
const logger = require('../src/utils/logger');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms');
    logger.info('Connected to MongoDB for seeding...');

    await Promise.all([User.deleteMany(), Employee.deleteMany(), Department.deleteMany(), Designation.deleteMany(), Shift.deleteMany(), Holiday.deleteMany(), Setting.deleteMany()]);
    logger.info('Cleared existing data');

    const departments = await Department.insertMany([
      { name: 'Engineering', code: 'ENG', description: 'Software Engineering', color: '#3B82F6', isActive: true },
      { name: 'Human Resources', code: 'HR', description: 'HR Department', color: '#10B981', isActive: true },
      { name: 'Finance', code: 'FIN', description: 'Finance & Accounts', color: '#F59E0B', isActive: true },
      { name: 'Marketing', code: 'MKT', description: 'Marketing & Sales', color: '#8B5CF6', isActive: true },
      { name: 'Operations', code: 'OPS', description: 'Operations', color: '#EF4444', isActive: true },
      { name: 'Design', code: 'DES', description: 'UI/UX Design', color: '#EC4899', isActive: true }
    ]);
    logger.info(`Created ${departments.length} departments`);

    const designations = await Designation.insertMany([
      { name: 'Software Engineer', code: 'SE', department: departments[0]._id, level: 3, salaryRange: { min: 600000, max: 1200000 } },
      { name: 'Senior Software Engineer', code: 'SSE', department: departments[0]._id, level: 5, salaryRange: { min: 1200000, max: 2000000 } },
      { name: 'Engineering Manager', code: 'EM', department: departments[0]._id, level: 7 },
      { name: 'HR Executive', code: 'HRE', department: departments[1]._id, level: 2 },
      { name: 'HR Manager', code: 'HRM', department: departments[1]._id, level: 5 },
      { name: 'Finance Analyst', code: 'FA', department: departments[2]._id, level: 3 },
      { name: 'CFO', code: 'CFO', department: departments[2]._id, level: 9 },
      { name: 'Marketing Executive', code: 'ME', department: departments[3]._id, level: 2 },
      { name: 'UI/UX Designer', code: 'UXD', department: departments[5]._id, level: 3 },
      { name: 'CTO', code: 'CTO', department: departments[0]._id, level: 10 }
    ]);
    logger.info(`Created ${designations.length} designations`);

    const shifts = await Shift.insertMany([
      { name: 'General Shift', code: 'GEN', type: 'general', startTime: '09:00', endTime: '18:00', breakDuration: 60, workHours: 8, gracePeriod: 15, weeklyOff: ['sunday'], isActive: true },
      { name: 'Morning Shift', code: 'MOR', type: 'morning', startTime: '07:00', endTime: '15:00', breakDuration: 30, workHours: 7.5, weeklyOff: ['sunday'], isActive: true },
      { name: 'Night Shift', code: 'NGT', type: 'night', startTime: '22:00', endTime: '06:00', breakDuration: 30, workHours: 7.5, weeklyOff: ['sunday'], isActive: true }
    ]);
    logger.info(`Created ${shifts.length} shifts`);

    const year = new Date().getFullYear();
    await Holiday.insertMany([
      { name: "New Year's Day", date: new Date(year, 0, 1), type: 'public' },
      { name: 'Republic Day', date: new Date(year, 1, 26), type: 'public' },
      { name: 'Holi', date: new Date(year, 2, 25), type: 'public' },
      { name: 'Good Friday', date: new Date(year, 3, 18), type: 'public' },
      { name: 'Independence Day', date: new Date(year, 7, 15), type: 'public' },
      { name: 'Gandhi Jayanti', date: new Date(year, 9, 2), type: 'public' },
      { name: 'Diwali', date: new Date(year, 9, 20), type: 'public' },
      { name: 'Christmas', date: new Date(year, 11, 25), type: 'public' }
    ]);
    logger.info('Created holidays');

    await Setting.insertMany([
      { key: 'company_name', value: process.env.COMPANY_NAME || 'Acme Corp', type: 'string', group: 'general', label: 'Company Name', isPublic: true },
      { key: 'company_email', value: process.env.COMPANY_EMAIL || 'hr@acmecorp.com', type: 'string', group: 'general', label: 'Company Email', isPublic: true },
      { key: 'working_days_per_week', value: 5, type: 'number', group: 'hr', label: 'Working Days/Week', isPublic: true },
      { key: 'working_hours_per_day', value: 8, type: 'number', group: 'hr', label: 'Working Hours/Day', isPublic: true },
      { key: 'annual_leave_days', value: 18, type: 'number', group: 'leave', label: 'Annual Leave Days', isPublic: false },
      { key: 'sick_leave_days', value: 12, type: 'number', group: 'leave', label: 'Sick Leave Days', isPublic: false },
      { key: 'casual_leave_days', value: 6, type: 'number', group: 'leave', label: 'Casual Leave Days', isPublic: false },
      { key: 'pf_percentage', value: 12, type: 'number', group: 'payroll', label: 'PF %', isPublic: false },
      { key: 'esi_threshold', value: 21000, type: 'number', group: 'payroll', label: 'ESI Threshold', isPublic: false },
      { key: 'currency', value: 'INR', type: 'string', group: 'general', label: 'Currency', isPublic: true },
      { key: 'date_format', value: 'DD/MM/YYYY', type: 'string', group: 'general', label: 'Date Format', isPublic: true },
      { key: 'timezone', value: 'Asia/Kolkata', type: 'string', group: 'general', label: 'Timezone', isPublic: true }
    ]);
    logger.info('Created settings');

    const adminUser = await User.create({ firstName: 'Super', lastName: 'Admin', email: 'admin@hrms.com', password: 'Admin@123', role: 'admin', isActive: true });
    const hrUser = await User.create({ firstName: 'HR', lastName: 'Manager', email: 'hr@hrms.com', password: 'Hr@12345', role: 'hr', isActive: true });
    const managerUser = await User.create({ firstName: 'Tech', lastName: 'Manager', email: 'manager@hrms.com', password: 'Manager@123', role: 'manager', isActive: true });

    const adminEmp = await Employee.create({ user: adminUser._id, department: departments[1]._id, designation: designations[4]._id, joiningDate: new Date('2020-01-01'), employmentStatus: 'active', employmentType: 'full_time', gender: 'male', shift: shifts[0]._id, salary: { basic: 80000, hra: 24000, da: 8000, ta: 5000, medical: 3000, gross: 120000 } });
    const hrEmp = await Employee.create({ user: hrUser._id, department: departments[1]._id, designation: designations[3]._id, joiningDate: new Date('2021-03-01'), employmentStatus: 'active', employmentType: 'full_time', shift: shifts[0]._id, salary: { basic: 60000, hra: 18000, da: 6000, ta: 4000, medical: 2000, gross: 90000 } });
    const managerEmp = await Employee.create({ user: managerUser._id, department: departments[0]._id, designation: designations[2]._id, joiningDate: new Date('2019-06-15'), employmentStatus: 'active', employmentType: 'full_time', shift: shifts[0]._id, salary: { basic: 90000, hra: 27000, da: 9000, ta: 5000, medical: 4000, gross: 135000 } });

    await User.findByIdAndUpdate(adminUser._id, { employee: adminEmp._id });
    await User.findByIdAndUpdate(hrUser._id, { employee: hrEmp._id });
    await User.findByIdAndUpdate(managerUser._id, { employee: managerEmp._id });

    const empData = [
      { first: 'Alice', last: 'Johnson', email: 'alice@hrms.com', dept: 0, desig: 0, salary: { basic: 70000, hra: 21000, da: 7000, ta: 4000, medical: 3000, gross: 105000 } },
      { first: 'Bob', last: 'Smith', email: 'bob@hrms.com', dept: 0, desig: 1, salary: { basic: 85000, hra: 25500, da: 8500, ta: 5000, medical: 3000, gross: 127000 } },
      { first: 'Carol', last: 'Williams', email: 'carol@hrms.com', dept: 3, desig: 7, salary: { basic: 55000, hra: 16500, da: 5500, ta: 3000, medical: 2000, gross: 82000 } },
      { first: 'David', last: 'Brown', email: 'david@hrms.com', dept: 2, desig: 5, salary: { basic: 65000, hra: 19500, da: 6500, ta: 4000, medical: 2500, gross: 97500 } },
      { first: 'Emma', last: 'Davis', email: 'emma@hrms.com', dept: 5, desig: 8, salary: { basic: 60000, hra: 18000, da: 6000, ta: 3500, medical: 2000, gross: 89500 } },
      { first: 'Frank', last: 'Wilson', email: 'frank@hrms.com', dept: 0, desig: 0, salary: { basic: 68000, hra: 20400, da: 6800, ta: 4000, medical: 2500, gross: 101700 } },
      { first: 'Grace', last: 'Moore', email: 'grace@hrms.com', dept: 1, desig: 3, salary: { basic: 50000, hra: 15000, da: 5000, ta: 3000, medical: 2000, gross: 75000 } },
      { first: 'Henry', last: 'Taylor', email: 'henry@hrms.com', dept: 4, desig: 5, salary: { basic: 55000, hra: 16500, da: 5500, ta: 3000, medical: 2000, gross: 82000 } },
    ];

    for (const e of empData) {
      const user = await User.create({ firstName: e.first, lastName: e.last, email: e.email, password: 'Employee@123', role: 'employee', isActive: true });
      const emp = await Employee.create({
        user: user._id,
        department: departments[e.dept]._id,
        designation: designations[e.desig]._id,
        manager: managerEmp._id,
        joiningDate: new Date(2021 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 12), 1),
        employmentStatus: 'active',
        employmentType: 'full_time',
        shift: shifts[0]._id,
        gender: Math.random() > 0.5 ? 'male' : 'female',
        salary: e.salary,
        dateOfBirth: new Date(1990 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
      });
      await User.findByIdAndUpdate(user._id, { employee: emp._id });
    }

    logger.info('Created sample employees');
    logger.info('\n=== SEED COMPLETED ===');
    logger.info('Default Credentials:');
    logger.info('Admin:   admin@hrms.com / Admin@123');
    logger.info('HR:      hr@hrms.com / Hr@12345');
    logger.info('Manager: manager@hrms.com / Manager@123');
    logger.info('Employee: alice@hrms.com / Employee@123');
    logger.info('======================\n');
    process.exit(0);
  } catch (err) {
    logger.error(`Seed error: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
};

seedData();
