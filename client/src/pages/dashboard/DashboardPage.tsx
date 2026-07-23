import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import { StatCard } from '../../components/ui/StatCard'
import { useAuthStore } from '../../store/authStore'
import { format } from 'date-fns'
import { Users, Clock, Calendar, DollarSign, UserPlus, TrendingUp, Building2, Briefcase } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4']

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { data: raw, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then(r => r.data.data),
    staleTime: 60000,
  })
  const d = raw ?? {}

  const attendanceChart = (d.charts?.monthlyTrend ?? []).reduce((acc: Record<string, number | string>[], item: { _id: { year: number; month: number; status: string }; count: number }) => {
    const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`
    const existing = acc.find(a => a.month === key)
    if (existing) existing[item._id.status] = ((existing[item._id.status] as number) ?? 0) + item.count
    else acc.push({ month: key, [item._id.status]: item.count })
    return acc
  }, []).slice(-6)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, <span className="font-semibold text-primary-600">{user?.firstName}</span>! {format(new Date(), 'EEEE, MMMM do yyyy')}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="Total Employees" value={d.overview?.totalEmployees ?? 0} icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600" trend={5} trendLabel="vs last month" loading={isLoading} />
        <StatCard title="Present Today" value={d.attendance?.todayPresent ?? 0} icon={Clock} iconBg="bg-emerald-50" iconColor="text-emerald-600" suffix={`/ ${d.overview?.activeEmployees ?? 0}`} loading={isLoading} />
        <StatCard title="Pending Leaves" value={d.leaves?.pendingLeaves ?? 0} icon={Calendar} iconBg="bg-amber-50" iconColor="text-amber-600" loading={isLoading} />
        <StatCard title="Monthly Payroll" value={d.payroll?.monthTotal ? `Rs.${((d.payroll.monthTotal as number) / 100000).toFixed(1)}L` : 'Rs.0'} icon={DollarSign} iconBg="bg-purple-50" iconColor="text-purple-600" loading={isLoading} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="New Joiners (Month)" value={d.overview?.newJoinees ?? 0} icon={UserPlus} iconBg="bg-indigo-50" iconColor="text-indigo-600" loading={isLoading} />
        <StatCard title="Attendance Rate" value={`${d.attendance?.attendanceRate ?? 0}%`} icon={TrendingUp} iconBg="bg-cyan-50" iconColor="text-cyan-600" loading={isLoading} />
        <StatCard title="Open Positions" value={d.recruitment?.openPositions ?? 0} icon={Building2} iconBg="bg-pink-50" iconColor="text-pink-600" loading={isLoading} />
        <StatCard title="Active Employees" value={d.overview?.activeEmployees ?? 0} icon={Briefcase} iconBg="bg-orange-50" iconColor="text-orange-600" loading={isLoading} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h3 className="section-title">Attendance Trend</h3>
          {isLoading ? (
            <div className="skeleton rounded-lg h-52 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={attendanceChart} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" fill="#10B981" name="Present" radius={[3, 3, 0, 0]} />
                <Bar dataKey="absent" fill="#EF4444" name="Absent" radius={[3, 3, 0, 0]} />
                <Bar dataKey="on_leave" fill="#F59E0B" name="On Leave" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card">
          <h3 className="section-title">By Department</h3>
          {isLoading ? (
            <div className="skeleton rounded-lg h-52 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={d.charts?.deptDistribution ?? []} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={75} fontSize={10}>
                  {(d.charts?.deptDistribution ?? []).map((_: unknown, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      {(d.upcomingBirthdays?.length ?? 0) > 0 && (
        <div className="card">
          <h3 className="section-title">Upcoming Birthdays (Next 7 Days)</h3>
          <div className="flex flex-wrap gap-3">
            {(d.upcomingBirthdays as { _id: string; user?: { firstName?: string; lastName?: string }; dateOfBirth: string }[]).map(emp => (
              <div key={emp._id} className="flex items-center gap-3 bg-pink-50 border border-pink-200 rounded-xl px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-pink-500 flex items-center justify-center text-white text-sm font-bold">
                  {emp.user?.firstName?.[0]}{emp.user?.lastName?.[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{emp.user?.firstName} {emp.user?.lastName}</p>
                  <p className="text-xs text-pink-600 font-medium">{format(new Date(emp.dateOfBirth), 'MMM do')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
