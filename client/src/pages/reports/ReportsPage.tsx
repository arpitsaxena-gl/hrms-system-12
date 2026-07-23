import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { BarChart2, Calendar, DollarSign, Users } from 'lucide-react'

const TABS = ['Attendance', 'Leaves', 'Payroll', 'Headcount'] as const
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function ReportsPage() {
  const today = new Date()
  const [tab, setTab] = useState<typeof TABS[number]>('Attendance')
  const [year, setYear] = useState(String(today.getFullYear()))
  const [month, setMonth] = useState(String(today.getMonth() + 1))

  const { data: attReport } = useQuery({
    queryKey: ['report-attendance', year, month],
    queryFn: () => api.get('/reports/attendance', { params: { year, month } }).then(r => r.data.data),
    enabled: tab === 'Attendance',
  })

  const { data: leaveReport } = useQuery({
    queryKey: ['report-leaves', year],
    queryFn: () => api.get('/reports/leaves', { params: { year } }).then(r => r.data.data),
    enabled: tab === 'Leaves',
  })

  const { data: payrollReport } = useQuery({
    queryKey: ['report-payroll', year],
    queryFn: () => api.get('/reports/payroll', { params: { year } }).then(r => r.data.data),
    enabled: tab === 'Payroll',
  })

  const { data: headcountReport } = useQuery({
    queryKey: ['report-headcount'],
    queryFn: () => api.get('/reports/headcount').then(r => r.data.data),
    enabled: tab === 'Headcount',
  })

  const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i)

  const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="card">
      <h3 className="section-title">{title}</h3>
      <div className="h-64">{children}</div>
    </div>
  )

  const TAB_ICONS = [BarChart2, Calendar, DollarSign, Users]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div><h1 className="page-title">Reports & Analytics</h1><p className="page-subtitle">Insights across HR modules</p></div>
        <div className="flex gap-2">
          {tab !== 'Headcount' && (
            <>
              {tab === 'Attendance' && (
                <select value={month} onChange={e => setMonth(e.target.value)} className="input w-36">
                  {Array.from({ length: 12 }, (_, i) => <option key={i+1} value={String(i+1)}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
                </select>
              )}
              <select value={year} onChange={e => setYear(e.target.value)} className="input w-24">
                {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((t, i) => {
          const Icon = TAB_ICONS[i]
          return (
            <button key={t} onClick={() => setTab(t)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <Icon className="w-4 h-4" />{t}
            </button>
          )
        })}
      </div>

      {tab === 'Attendance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard title="Daily Attendance Status">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attReport?.daily ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" fill="#10B981" radius={[3,3,0,0]} />
                <Bar dataKey="absent" fill="#EF4444" radius={[3,3,0,0]} />
                <Bar dataKey="late" fill="#F59E0B" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Department-wise Attendance %">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attReport?.departmentWise ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="department" tick={{ fontSize: 11 }} width={80} />
                <Tooltip formatter={(v: any) => `${v}%`} />
                <Bar dataKey="attendancePercentage" fill="#3B82F6" radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {tab === 'Leaves' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard title="Leave by Type">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={leaveReport?.byType ?? []} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label={({ _id, percent }: any) => `${_id}: ${(percent * 100).toFixed(0)}%`}>
                  {(leaveReport?.byType ?? []).map((_: any, index: number) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Monthly Leave Trend">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={leaveReport?.monthly ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="approved" stroke="#10B981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="pending" stroke="#F59E0B" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {tab === 'Payroll' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard title="Monthly Payroll Cost (₹L)">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(payrollReport?.monthly ?? []).map((p: any) => ({ ...p, netTotal: +(p.netTotal / 100000).toFixed(2) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => `₹${v}L`} />
                <Bar dataKey="netTotal" fill="#3B82F6" radius={[3,3,0,0]} name="Net Payroll" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Department Payroll Distribution">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={payrollReport?.byDepartment ?? []} dataKey="totalNet" nameKey="department" cx="50%" cy="50%" outerRadius={80}>
                  {(payrollReport?.byDepartment ?? []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => `₹${(v/100000).toFixed(1)}L`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {tab === 'Headcount' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard title="Employees by Department">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={headcountReport?.byDepartment ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="department" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#8B5CF6" radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Employment Type Distribution">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={headcountReport?.byType ?? []} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label={({ _id, count }: any) => `${_id}: ${count}`}>
                  {(headcountReport?.byType ?? []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Headcount Growth">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={headcountReport?.growth ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Gender Distribution">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={headcountReport?.byGender ?? []} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80}>
                  {(headcountReport?.byGender ?? []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  )
}
