import { useMemo } from 'react'
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
  AlertCircle,
  RefreshCw,
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
import { ErrorBoundary } from '../../components/ui/ErrorBoundary'
import { useDashboardStats } from '../../hooks/useDashboardStats'
import { useAttendanceTrend } from '../../hooks/useAttendanceTrend'
import { useDeptDistribution } from '../../hooks/useDeptDistribution'
import type { DashboardStats } from '../../lib/schemas/dashboard'

// ---- Discriminated union: subtext and subtextColor must appear together or not at all ----
type StatCardBase = {
  label: string
  value: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
}
type StatCardWithSubtext = StatCardBase & { subtext: string; subtextColor: string }
type StatCardWithoutSubtext = StatCardBase & { subtext?: never; subtextColor?: never }
type StatCard = StatCardWithSubtext | StatCardWithoutSubtext

function formatPayroll(amount: number): string {
  if (amount >= 100_000) return `Rs.${(amount / 100_000).toFixed(1)}L`
  if (amount >= 1_000) return `Rs.${(amount / 1_000).toFixed(1)}K`
  return `Rs.${amount}`
}

function buildStatCards(stats: DashboardStats): StatCard[] {
  return [
    {
      label: 'Total Employees',
      value: String(stats.totalEmployees),
      subtext: '↗ 5% vs last month',
      subtextColor: 'text-green-500',
      icon: Users,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
    },
    {
      label: 'Present Today',
      value: `${stats.presentToday} / ${stats.presentCapacity}`,
      icon: Clock,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-500',
    },
    {
      label: 'Pending Leaves',
      value: String(stats.pendingLeaves),
      icon: CalendarDays,
      iconBg: 'bg-yellow-50',
      iconColor: 'text-yellow-500',
    },
    {
      label: 'Monthly Payroll',
      value: formatPayroll(stats.monthlyPayrollRs),
      icon: DollarSign,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-500',
    },
    {
      label: 'New Joiners (Month)',
      value: String(stats.newJoinersThisMonth),
      icon: UserPlus,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-400',
    },
    {
      label: 'Attendance Rate',
      value: `${stats.attendanceRatePercent}%`,
      icon: TrendingUp,
      iconBg: 'bg-cyan-50',
      iconColor: 'text-cyan-500',
    },
    {
      label: 'Open Positions',
      value: String(stats.openPositions),
      icon: Briefcase,
      iconBg: 'bg-pink-50',
      iconColor: 'text-pink-500',
    },
    {
      label: 'Active Employees',
      value: String(stats.activeEmployees),
      icon: UserCheck,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
    },
  ]
}

// ---- Skeleton components ----
function StatCardSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading stat card"
      className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col gap-3 animate-pulse"
    >
      <div className="flex items-start justify-between">
        <div className="h-3 w-28 bg-gray-200 rounded" />
        <div className="w-9 h-9 rounded-lg bg-gray-100" />
      </div>
      <div className="h-7 w-16 bg-gray-200 rounded" />
    </div>
  )
}

function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div
      className="animate-pulse bg-gray-100 rounded-lg"
      style={{ height }}
      aria-busy="true"
      aria-label="Loading chart data"
    />
  )
}

function InlineError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-2 py-6 text-center">
      <AlertCircle className="w-5 h-5 text-red-400" />
      <p className="text-sm text-gray-500">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
      >
        <RefreshCw className="w-3 h-3" /> Try again
      </button>
    </div>
  )
}

export default function DashboardPage() {
  const today = new Date()

  const {
    data: statsData,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useDashboardStats()

  const {
    data: trendData,
    isLoading: trendLoading,
    isError: trendError,
    refetch: refetchTrend,
  } = useAttendanceTrend()

  const {
    data: deptData,
    isLoading: deptLoading,
    isError: deptError,
    refetch: refetchDept,
  } = useDeptDistribution()

  const statCards = useMemo(
    () => (statsData ? buildStatCards(statsData) : []),
    [statsData],
  )

  return (
    <ErrorBoundary>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, Super! {format(today, 'EEEE, MMMM do yyyy')}
          </p>
        </div>

        {/* Stat Cards — 2 rows x 4 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsLoading ? (
            Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)
          ) : statsError ? (
            <div className="sm:col-span-2 lg:col-span-4">
              <InlineError
                message="Could not load dashboard stats."
                onRetry={refetchStats}
              />
            </div>
          ) : (
            statCards.map((card) => {
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
            })
          )}
        </div>

        {/* Charts — 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Attendance Trend (~65% width) */}
          <ErrorBoundary>
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-800 mb-5">Attendance Trend</h2>
              {trendLoading ? (
                <ChartSkeleton height={220} />
              ) : trendError ? (
                <InlineError
                  message="Could not load attendance trend."
                  onRetry={refetchTrend}
                />
              ) : (
                <div
                  className="h-[220px]"
                  role="img"
                  aria-label="Attendance trend area chart showing present, absent, and on-leave employee counts over the last 7 days"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={trendData}
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
              )}
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
          </ErrorBoundary>

          {/* By Department (~35% width) */}
          <ErrorBoundary>
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">By Department</h2>
              {deptLoading ? (
                <ChartSkeleton height={200} />
              ) : deptError ? (
                <InlineError
                  message="Could not load department data."
                  onRetry={refetchDept}
                />
              ) : (
                <div
                  className="h-[200px]"
                  role="img"
                  aria-label={`Department distribution donut chart showing ${deptData?.length ?? 0} departments`}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deptData}
                        cx="50%"
                        cy="50%"
                        innerRadius={54}
                        outerRadius={78}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {(deptData ?? []).map((entry) => (
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
              )}
              <div className="flex flex-col gap-2 mt-2 border-t border-gray-100 pt-3">
                {(deptData ?? []).map((dept) => (
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
          </ErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  )
}
