import {
  Users,
  Clock3,
  CalendarDays,
  IndianRupee,
  UserPlus,
  TrendingUp,
  BriefcaseBusiness,
  ShoppingBag,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const STATS = [
  {
    label: 'Total Employees',
    value: '11',
    subtext: '↗ 5% vs last month',
    subtextClass: 'text-emerald-600',
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
    icon: IndianRupee,
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
    icon: BriefcaseBusiness,
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
  { day: 'Mon', present: 8, absent: 1, onLeave: 1 },
  { day: 'Tue', present: 9, absent: 0, onLeave: 1 },
  { day: 'Wed', present: 7, absent: 2, onLeave: 1 },
  { day: 'Thu', present: 10, absent: 0, onLeave: 0 },
  { day: 'Fri', present: 0, absent: 0, onLeave: 0 },
  { day: 'Sat', present: 0, absent: 0, onLeave: 0 },
  { day: 'Sun', present: 0, absent: 0, onLeave: 0 },
]

const DEPARTMENT_DATA = [
  { name: 'Design', value: 2, color: '#8B5CF6' },
  { name: 'Engineering', value: 4, color: '#3B82F6' },
  { name: 'Finance', value: 1, color: '#EC4899' },
  { name: 'Human Resources', value: 2, color: '#22C55E' },
  { name: 'Marketing', value: 1, color: '#F97316' },
]

function StatCard({
  label,
  value,
  subtext,
  subtextClass,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string
  value: string
  subtext?: string
  subtextClass?: string
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
          {subtext && <p className={`text-xs mt-2 ${subtextClass ?? 'text-slate-500'}`}>{subtext}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Welcome back, Super! Friday, July 24th 2026</p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map(item => (
          <StatCard key={item.label} {...item} />
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-semibold text-slate-900">Attendance Trend</h2>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ATTENDANCE_TREND}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#94A3B8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="absent" stackId="1" stroke="#EF4444" fill="#FCA5A5" />
                <Area type="monotone" dataKey="onLeave" stackId="1" stroke="#F59E0B" fill="#FCD34D" />
                <Area type="monotone" dataKey="present" stackId="1" stroke="#22C55E" fill="#86EFAC" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center gap-5 text-sm text-slate-600">
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-red-500" />Absent</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-amber-400" />On Leave</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-green-500" />Present</span>
          </div>
        </div>

        <div className="xl:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-semibold text-slate-900">By Department</h2>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={DEPARTMENT_DATA} dataKey="value" nameKey="name" innerRadius={52} outerRadius={88} paddingAngle={4}>
                  {DEPARTMENT_DATA.map(item => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-700">
            {DEPARTMENT_DATA.map(item => (
              <span key={item.name} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-slate-100">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
