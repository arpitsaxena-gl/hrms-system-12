import type { LucideIcon } from 'lucide-react'
import {
  Users,
  Clock3,
  CalendarDays,
  BadgeDollarSign,
  UserPlus,
  TrendingUp,
  Briefcase,
  ShoppingBag,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts'

type StatItem = {
  label: string
  value: string
  subtext?: string
  subtextColor?: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
}

const STATS: StatItem[] = [
  {
    label: 'Total Employees',
    value: '11',
    subtext: '↗ 5% vs last month',
    subtextColor: 'text-emerald-600',
    icon: Users,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    label: 'Present Today',
    value: '0 / 10',
    icon: Clock3,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    label: 'Pending Leaves',
    value: '0',
    icon: CalendarDays,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  {
    label: 'Monthly Payroll',
    value: 'Rs.2.2L',
    icon: BadgeDollarSign,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
  },
  {
    label: 'New Joiners (Month)',
    value: '0',
    icon: UserPlus,
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
  },
  {
    label: 'Attendance Rate',
    value: '0%',
    icon: TrendingUp,
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
  },
  {
    label: 'Open Positions',
    value: '0',
    icon: Briefcase,
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
  },
  {
    label: 'Active Employees',
    value: '10',
    icon: ShoppingBag,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
]

const ATTENDANCE_TREND = [
  { day: 'Mon', present: 0, leave: 0, absent: 0 },
  { day: 'Tue', present: 0, leave: 0, absent: 0 },
  { day: 'Wed', present: 0, leave: 0, absent: 0 },
  { day: 'Thu', present: 0, leave: 0, absent: 0 },
  { day: 'Fri', present: 0, leave: 0, absent: 0 },
  { day: 'Sat', present: 0, leave: 0, absent: 0 },
]

const DEPARTMENT_DISTRIBUTION = [
  { name: 'Design', value: 20, color: '#8B5CF6' },
  { name: 'Engineering', value: 35, color: '#3B82F6' },
  { name: 'Finance', value: 15, color: '#EC4899' },
  { name: 'Human Resources', value: 18, color: '#22C55E' },
  { name: 'Marketing', value: 12, color: '#F59E0B' },
]

function DashboardStatCard({ stat }: { stat: StatItem }) {
  const Icon = stat.icon

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{stat.label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
          {stat.subtext && <p className={`mt-2 text-xs font-semibold ${stat.subtextColor}`}>{stat.subtext}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${stat.iconColor}`} />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <section>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Welcome back, Super! Friday, July 24th 2026</p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map(stat => (
          <DashboardStatCard key={stat.label} stat={stat} />
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.8fr_1fr] gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <h2 className="text-base font-semibold text-slate-900">Attendance Trend</h2>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ATTENDANCE_TREND} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                <Tooltip />
                <Area type="monotone" dataKey="absent" stackId="1" stroke="#EF4444" fill="#FCA5A5" fillOpacity={0.8} />
                <Area type="monotone" dataKey="leave" stackId="1" stroke="#F59E0B" fill="#FCD34D" fillOpacity={0.85} />
                <Area type="monotone" dataKey="present" stackId="1" stroke="#22C55E" fill="#86EFAC" fillOpacity={0.85} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium text-slate-600">
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 bg-red-500 rounded-sm" />Absent</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 bg-amber-500 rounded-sm" />On Leave</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 bg-green-500 rounded-sm" />Present</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <h2 className="text-base font-semibold text-slate-900">By Department</h2>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={DEPARTMENT_DISTRIBUTION}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {DEPARTMENT_DISTRIBUTION.map(item => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {DEPARTMENT_DISTRIBUTION.map(item => (
              <span
                key={item.name}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: `${item.color}1A`, color: item.color }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
