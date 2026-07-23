const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const ApiResponse = require('../utils/apiResponse');

const getAttendanceReport = async (req, res, next) => {
  try {
    const { month, year, departmentId } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    let empQuery = { employmentStatus: 'active' };
    if (departmentId) empQuery.department = departmentId;
    const employees = await Employee.find(empQuery).populate('user', 'firstName lastName').populate('department', 'name');
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0);
    const report = await Promise.all(employees.map(async (emp) => {
      const records = await Attendance.find({ employee: emp._id, date: { $gte: startDate, $lte: endDate } });
      const statusCounts = records.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
      const totalHours = records.reduce((acc, r) => acc + (r.workHours || 0), 0);
      return {
        employee: { id: emp._id, employeeId: emp.employeeId, name: `${emp.user.firstName} ${emp.user.lastName}`, department: emp.department ? emp.department.name : '' },
        attendance: statusCounts,
        totalWorkingHours: Math.round(totalHours * 100) / 100,
        totalDays: records.length
      };
    }));
    ApiResponse.success(res, { month: m, year: y, report });
  } catch (err) { next(err); }
};

const getLeaveReport = async (req, res, next) => {
  try {
    const { year, departmentId } = req.query;
    const y = parseInt(year) || new Date().getFullYear();
    const startDate = new Date(y, 0, 1);
    const endDate = new Date(y, 11, 31);
    const leaveStats = await Leave.aggregate([
      { $match: { startDate: { $gte: startDate, $lte: endDate }, status: 'approved' } },
      { $group: { _id: { employee: '$employee', type: '$leaveType' }, totalDays: { $sum: '$totalDays' }, count: { $sum: 1 } } },
      { $group: { _id: '$_id.employee', leaves: { $push: { type: '$_id.type', totalDays: '$totalDays', count: '$count' } }, totalDays: { $sum: '$totalDays' } } },
      { $lookup: { from: 'employees', localField: '_id', foreignField: '_id', as: 'employee' } },
      { $unwind: '$employee' },
      { $lookup: { from: 'users', localField: 'employee.user', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { employeeId: '$employee.employeeId', name: { $concat: ['$user.firstName', ' ', '$user.lastName'] }, leaves: 1, totalDays: 1 } }
    ]);
    ApiResponse.success(res, { year: y, report: leaveStats });
  } catch (err) { next(err); }
};

const getPayrollReport = async (req, res, next) => {
  try {
    const { year } = req.query;
    const y = parseInt(year) || new Date().getFullYear();
    const monthlyPayroll = await Payroll.aggregate([
      { $match: { year: y, status: { $in: ['processed', 'paid'] } } },
      { $group: { _id: '$month', totalGross: { $sum: '$earnings.grossEarnings' }, totalNet: { $sum: '$netSalary' }, totalDeductions: { $sum: '$deductions.totalDeductions' }, employeeCount: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const annualTotal = monthlyPayroll.reduce((acc, m) => { acc.gross += m.totalGross; acc.net += m.totalNet; return acc; }, { gross: 0, net: 0 });
    ApiResponse.success(res, { year: y, monthly: monthlyPayroll, annual: annualTotal });
  } catch (err) { next(err); }
};

const getHeadcountReport = async (req, res, next) => {
  try {
    const [byDept, byDesig, byType, byStatus, byGender] = await Promise.all([
      Employee.aggregate([{ $group: { _id: '$department', count: { $sum: 1 } } }, { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } }, { $unwind: '$dept' }, { $project: { name: '$dept.name', count: 1 } }, { $sort: { count: -1 } }]),
      Employee.aggregate([{ $group: { _id: '$designation', count: { $sum: 1 } } }, { $lookup: { from: 'designations', localField: '_id', foreignField: '_id', as: 'desig' } }, { $unwind: '$desig' }, { $project: { name: '$desig.name', count: 1 } }, { $sort: { count: -1 } }]),
      Employee.aggregate([{ $group: { _id: '$employmentType', count: { $sum: 1 } } }]),
      Employee.aggregate([{ $group: { _id: '$employmentStatus', count: { $sum: 1 } } }]),
      Employee.aggregate([{ $group: { _id: '$gender', count: { $sum: 1 } } }])
    ]);
    ApiResponse.success(res, { byDepartment: byDept, byDesignation: byDesig, byEmploymentType: byType, byStatus, byGender });
  } catch (err) { next(err); }
};

module.exports = { getAttendanceReport, getLeaveReport, getPayrollReport, getHeadcountReport };
