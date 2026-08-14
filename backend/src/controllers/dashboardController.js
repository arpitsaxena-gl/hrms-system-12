const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const ApiResponse = require('../utils/apiResponse');

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DEPT_COLORS = ['#8B5CF6', '#3B82F6', '#EC4899', '#10B981', '#F97316', '#EAB308', '#EF4444', '#06B6D4'];

const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const [
      totalEmployees, activeEmployees, newJoinees,
      todayPresent, todayAbsent, pendingLeaves,
      monthPayroll, pendingRecruitment,
      attrition, upcomingBirthdays
    ] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ employmentStatus: 'active' }),
      Employee.countDocuments({ joiningDate: { $gte: thisMonth } }),
      Attendance.countDocuments({ date: today, status: { $in: ['present', 'work_from_home'] } }),
      Attendance.countDocuments({ date: today, status: 'absent' }),
      Leave.countDocuments({ status: 'pending' }),
      Payroll.aggregate([{ $match: { month: today.getMonth() + 1, year: today.getFullYear(), status: { $in: ['processed', 'paid'] } } }, { $group: { _id: null, total: { $sum: '$netSalary' } } }]),
      (async () => {
        const { Job } = require('../models/Recruitment');
        return Job.countDocuments({ status: 'open' });
      })(),
      Employee.countDocuments({ terminationDate: { $gte: thisMonth } }),
      Employee.find({ employmentStatus: 'active' }).populate('user', 'firstName lastName avatar').select('user dateOfBirth employeeId')
        .then(employees => employees.filter(e => {
          if (!e.dateOfBirth) return false;
          const bDay = new Date(e.dateOfBirth); bDay.setFullYear(today.getFullYear());
          const diff = (bDay - today) / (1000 * 60 * 60 * 24);
          return diff >= 0 && diff <= 7;
        }).slice(0, 5))
    ]);
    const attendanceRate = totalEmployees > 0 ? Math.round((todayPresent / totalEmployees) * 100) : 0;
    const monthlyTrend = await Attendance.aggregate([
      { $match: { date: { $gte: new Date(today.getFullYear(), today.getMonth() - 5, 1) } } },
      { $group: { _id: { month: { $month: '$date' }, year: { $year: '$date' }, status: '$status' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    const deptDistribution = await Employee.aggregate([
      { $match: { employmentStatus: 'active' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      { $unwind: '$dept' },
      { $project: { name: '$dept.name', count: 1, color: '$dept.color' } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    ApiResponse.success(res, {
      overview: { totalEmployees, activeEmployees, newJoinees, attrition },
      attendance: { todayPresent, todayAbsent, attendanceRate },
      leaves: { pendingLeaves },
      payroll: { monthTotal: monthPayroll[0] ? monthPayroll[0].total : 0 },
      recruitment: { openPositions: pendingRecruitment },
      upcomingBirthdays,
      charts: { monthlyTrend, deptDistribution }
    });
  } catch (err) { next(err); }
};

const getDashboardStatsFlat = async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const [
      totalEmployees, activeEmployees, newJoiners,
      presentToday, pendingLeaves, payrollAgg, openPositions,
    ] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ employmentStatus: 'active' }),
      Employee.countDocuments({ joiningDate: { $gte: thisMonth } }),
      Attendance.countDocuments({ date: today, status: { $in: ['present', 'work_from_home'] } }),
      Leave.countDocuments({ status: 'pending' }),
      Payroll.aggregate([
        { $match: { month: today.getMonth() + 1, year: today.getFullYear(), status: { $in: ['processed', 'paid'] } } },
        { $group: { _id: null, total: { $sum: '$netSalary' } } },
      ]),
      (async () => { const { Job } = require('../models/Recruitment'); return Job.countDocuments({ status: 'open' }); })(),
    ]);
    ApiResponse.success(res, {
      totalEmployees,
      presentToday,
      presentCapacity: totalEmployees,
      pendingLeaves,
      monthlyPayrollRs: payrollAgg[0] ? payrollAgg[0].total : 0,
      newJoinersThisMonth: newJoiners,
      attendanceRatePercent: totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0,
      openPositions,
      activeEmployees,
    });
  } catch (err) { next(err); }
};

const getAttendanceTrend7d = async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(today.getDate() - 6);
    const endOfToday = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);
    const records = await Attendance.aggregate([
      { $match: { date: { $gte: sevenDaysAgo, $lte: endOfToday } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        present: { $sum: { $cond: [{ $in: ['$status', ['present', 'work_from_home']] }, 1, 0] } },
        absent:  { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
        onLeave: { $sum: { $cond: [{ $eq: ['$status', 'on_leave'] }, 1, 0] } },
      }},
      { $sort: { _id: 1 } },
    ]);
    const trend = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo); d.setDate(sevenDaysAgo.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const found = records.find(r => r._id === key);
      trend.push({
        day: DAY_LABELS[d.getDay()],
        present: found ? found.present : 0,
        absent:  found ? found.absent  : 0,
        onLeave: found ? found.onLeave : 0,
      });
    }
    ApiResponse.success(res, trend);
  } catch (err) { next(err); }
};

const getDeptDistribution = async (req, res, next) => {
  try {
    const data = await Employee.aggregate([
      { $match: { employmentStatus: 'active' } },
      { $group: { _id: '$department', value: { $sum: 1 } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      { $unwind: '$dept' },
      { $project: { name: '$dept.name', value: 1, color: { $ifNull: ['$dept.color', ''] } } },
      { $sort: { value: -1 } },
      { $limit: 10 },
    ]);
    const result = data.map((d, i) => ({
      name: d.name,
      value: d.value,
      color: d.color || DEPT_COLORS[i % DEPT_COLORS.length],
    }));
    ApiResponse.success(res, result);
  } catch (err) { next(err); }
};

const getAdminDashboard = async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const headcountTrend = await Employee.aggregate([
      { $match: { joiningDate: { $gte: yearStart } } },
      { $group: { _id: { month: { $month: '$joiningDate' }, year: { $year: '$joiningDate' } }, joined: { $sum: 1 } } },
      { $sort: { '_id.month': 1 } }
    ]);
    const payrollTrend = await Payroll.aggregate([
      { $match: { year: today.getFullYear(), status: { $in: ['processed', 'paid'] } } },
      { $group: { _id: '$month', total: { $sum: '$netSalary' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    ApiResponse.success(res, { headcountTrend, payrollTrend });
  } catch (err) { next(err); }
};

module.exports = { getDashboardStats, getAdminDashboard, getDashboardStatsFlat, getAttendanceTrend7d, getDeptDistribution };
