const Payroll = require('../models/Payroll');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Holiday = require('../models/Holiday');

const calculatePayroll = async (employee, month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  const holidays = await Holiday.countDocuments({ date: { $gte: startDate, $lte: endDate } });
  const attendance = await Attendance.find({ employee: employee._id, date: { $gte: startDate, $lte: endDate } });
  const presentDays = attendance.filter(a => ['present', 'work_from_home'].includes(a.status)).length;
  const halfDays = attendance.filter(a => a.status === 'half_day').length;
  const absentDays = attendance.filter(a => a.status === 'absent').length;
  const leaveDays = await Leave.countDocuments({
    employee: employee._id, status: 'approved',
    startDate: { $lte: endDate }, endDate: { $gte: startDate }
  });
  const totalWorkingDays = endDate.getDate() - holidays;
  const salary = employee.salary || {};
  const basic = salary.basic || 0;
  const perDaySalary = totalWorkingDays > 0 ? basic / totalWorkingDays : 0;
  const overtimeHours = attendance.reduce((acc, a) => acc + (a.overtime || 0), 0);
  const overtimePay = (perDaySalary / 8) * overtimeHours * 1.5;
  const absentDeduction = perDaySalary * absentDays;
  const pf = basic * 0.12;
  const esi = salary.gross <= 21000 ? salary.gross * 0.0075 : 0;
  const pt = basic <= 10000 ? 0 : basic <= 15000 ? 150 : 200;

  return {
    employee: employee._id,
    month, year,
    payPeriod: { start: startDate, end: endDate },
    earnings: {
      basic,
      hra: salary.hra || 0,
      da: salary.da || 0,
      ta: salary.ta || 0,
      medical: salary.medical || 0,
      overtime: Math.round(overtimePay),
      other: salary.other || 0
    },
    deductions: {
      pf: Math.round(pf),
      esi: Math.round(esi),
      professionalTax: pt,
      leave: Math.round(absentDeduction)
    },
    attendanceSummary: {
      totalDays: endDate.getDate(),
      presentDays,
      absentDays,
      leaveDays,
      holidays,
      workingDays: totalWorkingDays,
      overtimeHours
    }
  };
};

module.exports = { calculatePayroll };
