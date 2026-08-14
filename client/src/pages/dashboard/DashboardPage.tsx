import { format } from 'date-fns'
import type { LucideIcon } from 'lucide-react'
import {
  Users,
  Clock,
  CalendarDays,
  DollarSign,
  UserPlus,
  TrendingUp,
  Briefcase,
  UserCheck,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface StatCard {
  label: string
  value: string
  subtext?: string
  subtextColor?: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
}

const STAT_CARDS: StatCard[] = [
  {
    label: 'Total Employees',
    value: '11',
    subtext: '↗ 5% vs last month',
    subtextColor: 'text-green-500',
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
    iconColor: 'text-blue-400',
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
    icon: Briefcase,
    iconBg: 'bg-pink-50',
    iconColor: 'text-pink-500',
  },
  {
    label: 'Active Employees',
    value: '10',
    icon: UserCheck,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
  },
]

const ATTENDANCE_DATA = [
  { day: 'Mon', present: 8, absent: 1, onLeave: 1 },
  { day: 'Tue', present: 7, absent: 2, onLeave: 1 },
  { day: 'Wed', present: 9, absent: 0, onLeave: 1 },
  { day: 'Thu', present: 6, absent: 2, onLeave: 2 },
  { day: 'Fri', present: 8, absent: 1, onLeave: 1 },
  { day: 'Sat', present: 0, absent: 10, onLeave: 0 },
  { day: 'Sun', present: 0, absent: 10, onLeave: 0 },
]

const DEPT_DATA = [
  { name: 'Design', value: 2, color: '#8B5CF6' },
  { name: 'Engineering', value: 4, color: '#3B82F6' },
  { name: 'Finance', value: 1, color: '#EC4899' },
  { name: 'Human Resources', value: 2, color: '#10B981' },
  { name: 'Marketing', value: 1, color: '#F97316' },
]

export default function DashboardPage() {
  const today = new Date()

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Welcome back, Super! {format(today, 'EEEE, MMMM do yyyy')}
        </p>
      </div>

      {/* Stat Cards — 2 rows × 4 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col gap-3"
            >
              <div className="flex items-start justify-between">
                <p className="text-xs font-medium text-gray-500 leading-snug">{card.label}</p>
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${card.iconBg}`}
                >
                  <Icon className={`w-[18px] h-[18px] ${card.iconColor}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 leading-none">{card.value}</p>
              {card.subtext && (
                <p className={`text-xs font-medium ${card.subtextColor}`}>{card.subtext}</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Charts — 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Attendance Trend (~65% width) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-800 mb-5">Attendance Trend</h2>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={ATTENDANCE_DATA}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradAbsent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradLeave" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="present"
                  name="Present"
                  stroke="#22C55E"
                  strokeWidth={2}
                  fill="url(#gradPresent)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="absent"
                  name="Absent"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fill="url(#gradAbsent)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="onLeave"
                  name="On Leave"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  fill="url(#gradLeave)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-5 mt-4 border-t border-gray-100 pt-3">
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

        {/* By Department (~35% width) */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">By Department</h2>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={DEPT_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {DEPT_DATA.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2 mt-2 border-t border-gray-100 pt-3">
            {DEPT_DATA.map((dept) => (
              <div key={dept.name} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: dept.color }}
                />
                <span className="text-xs text-gray-600 truncate flex-1">{dept.name}</span>
                <span className="text-xs font-medium text-gray-700">{dept.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
