import { format } from 'date-fns'
import {
  Users,
  Clock,
  CalendarDays,
  DollarSign,
  UserPlus,
  TrendingUp,
  Building2,
  Briefcase,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts'

const attendanceData = [
  { day: 'Mon', present: 8, absent: 1, onLeave: 1 },
  { day: 'Tue', present: 7, absent: 2, onLeave: 1 },
  { day: 'Wed', present: 9, absent: 1, onLeave: 0 },
  { day: 'Thu', present: 6, absent: 2, onLeave: 2 },
  { day: 'Fri', present: 8, absent: 1, onLeave: 1 },
  { day: 'Sat', present: 3, absent: 5, onLeave: 2 },
  { day: 'Sun', present: 0, absent: 8, onLeave: 2 },
]

const departmentData = [
  { name: 'Design', value: 2 },
  { name: 'Engineering', value: 4 },
  { name: 'Finance', value: 2 },
  { name: 'Human Resources', value: 1 },
  { name: 'Marketing', value: 1 },
]

const DEPT_COLORS = ['#8b5cf6', '#3b82f6', '#ec4899', '#22c55e', '#f97316']

const STAT_CARDS = [
  {
    label: 'Total Employees',
    value: '11',
    subtext: '↗ 5% vs last month',
    subtextColor: 'text-emerald-600',
    icon: Users,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
  },
  {
    label: 'Present Today',
    value: '0 / 10',
    icon: Clock,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-500',
  },
  {
    label: 'Pending Leaves',
    value: '0',
    icon: CalendarDays,
    iconBg: 'bg-yellow-50',
    iconColor: 'text-yellow-500',
  },
  {
    label: 'Monthly Payroll',
    value: 'Rs.2.2L',
    icon: DollarSign,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-500',
  },
  {
    label: 'New Joiners (Month)',
    value: '0',
    icon: UserPlus,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
  },
  {
    label: 'Attendance Rate',
    value: '0%',
    icon: TrendingUp,
    iconBg: 'bg-cyan-50',
    iconColor: 'text-cyan-500',
  },
  {
    label: 'Open Positions',
    value: '0',
    icon: Building2,
    iconBg: 'bg-pink-50',
    iconColor: 'text-pink-500',
  },
  {
    label: 'Active Employees',
    value: '10',
    icon: Briefcase,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
  },
] as const

export default function DashboardPage() {
  const today = new Date()
  const formattedDate = format(today, "EEEE, MMMM do yyyy")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, Super! {formattedDate}
        </p>
      </div>

      {/* Stat Cards - 2 rows of 4 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide leading-none">
                  {card.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900 leading-none">
                  {card.value}
                </p>
                {'subtext' in card && card.subtext && (
                  <p className={`mt-2 text-xs font-medium ${'subtextColor' in card ? card.subtextColor : ''}`}>
                    {card.subtext}
                  </p>
                )}
              </div>
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${card.iconBg}`}
              >
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Attendance Trend — ~65% width */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-800 mb-5">Attendance Trend</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={attendanceData}
              margin={{ top: 4, right: 8, left: -24, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradAbsent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradLeave" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                cursor={{ stroke: '#e2e8f0' }}
              />
              <Area
                type="monotone"
                dataKey="present"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#gradPresent)"
                name="Present"
              />
              <Area
                type="monotone"
                dataKey="absent"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#gradAbsent)"
                name="Absent"
              />
              <Area
                type="monotone"
                dataKey="onLeave"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#gradLeave)"
                name="On Leave"
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-5 mt-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />
              <span className="text-xs text-gray-500">Absent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" />
              <span className="text-xs text-gray-500">On Leave</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />
              <span className="text-xs text-gray-500">Present</span>
            </div>
          </div>
        </div>

        {/* By Department — ~35% width */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">By Department</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={departmentData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {departmentData.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={DEPT_COLORS[index % DEPT_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 mt-3">
            {departmentData.map((dept, index) => (
              <div key={dept.name} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: DEPT_COLORS[index] }}
                />
                <span className="text-xs text-gray-600 truncate flex-1">{dept.name}</span>
                <span className="text-xs font-medium text-gray-400">{dept.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
