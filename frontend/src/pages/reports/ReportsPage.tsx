import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts'
import { BarChart3, Users, Calendar, DollarSign } from 'lucide-react'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
const tabs = [
  { id: 'attendance', label: 'Attendance', icon: Calendar },
  { id: 'headcount', label: 'Headcount', icon: Users },
  { id: 'payroll', label: 'Payroll', icon: DollarSign },
  { id: 'leave', label: 'Leave', icon: BarChart3 },
]

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('attendance')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)

  const { data: attReport, isLoading: attLoading } = useQuery({
    queryKey: ['report-attendance', year, month],
    queryFn: () => api.get('/reports/attendance', { params: { year, month } }).then(r => r.data.data),
    enabled: activeTab === 'attendance'
  })

  const { data: headReport, isLoading: headLoading } = useQuery({
    queryKey: ['report-headcount'],
    queryFn: () => api.get('/reports/headcount').then(r => r.data.data),
    enabled: activeTab === 'headcount'
  })

  const { data: payReport, isLoading: payLoading } = useQuery({
    queryKey: ['report-payroll', year],
    queryFn: () => api.get('/reports/payroll', { params: { year } }).then(r => r.data.data),
    enabled: activeTab === 'payroll'
  })

  const { data: leaveReport, isLoading: leaveLoading } = useQuery({
    queryKey: ['report-leave', year],
    queryFn: () => api.get('/reports/leave', { params: { year } }).then(r => r.data.data),
    enabled: activeTab === 'leave'
  })

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Analytics and insights</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        <select value={year} onChange={e => setYear(Number(e.target.value))} className="input w-28">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        {(activeTab === 'attendance' || activeTab === 'leave') && (
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="input w-36">
            {months.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
        )}
      </div>

      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {attLoading ? <div className="skeleton h-64 w-full" /> : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Working Days', value: attReport?.summary?.workingDays || 0, color: 'text-blue-600' },
                  { label: 'Avg Present', value: attReport?.summary?.avgPresent || 0, color: 'text-emerald-600' },
                  { label: 'Avg Absent', value: attReport?.summary?.avgAbsent || 0, color: 'text-red-600' },
                  { label: 'Attendance Rate', value: `${attReport?.summary?.rate || 0}%`, color: 'text-purple-600' },
                ].map(s => (
                  <div key={s.label} className="card text-center">
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="card">
                <h3 className="section-title">Daily Attendance - {months[month-1]} {year}</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={attReport?.daily || []} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="present" fill="#10B981" name="Present" radius={[2,2,0,0]} />
                    <Bar dataKey="absent" fill="#EF4444" name="Absent" radius={[2,2,0,0]} />
                    <Bar dataKey="on_leave" fill="#F59E0B" name="On Leave" radius={[2,2,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'headcount' && (
        <div className="space-y-6">
          {headLoading ? <div className="skeleton h-64 w-full" /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="section-title">By Department</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={headReport?.byDepartment || []} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                      {(headReport?.byDepartment || []).map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <h3 className="section-title">By Employment Type</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={headReport?.byType || []} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={100} label={({ _id, percent }: { _id: string; percent: number }) => `${_id} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                      {(headReport?.byType || []).map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'payroll' && (
        <div className="space-y-6">
          {payLoading ? <div className="skeleton h-64 w-full" /> : (
            <div className="card">
              <h3 className="section-title">Monthly Payroll Trend - {year}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={payReport?.monthly || []} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${(v/100000).toFixed(1)}L`} />
                  <Tooltip formatter={(v: number) => [`Rs.${v.toLocaleString()}`, '']} />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#3B82F6" name="Total Payroll" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="netTotal" stroke="#10B981" name="Net Paid" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {activeTab === 'leave' && (
        <div className="space-y-6">
          {leaveLoading ? <div className="skeleton h-64 w-full" /> : (
            <div className="card">
              <h3 className="section-title">Leave by Type - {months[month-1]} {year}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={leaveReport?.byType || []} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8B5CF6" name="Leave Count" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
