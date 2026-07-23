import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import { format } from 'date-fns'
import { ArrowLeft, Edit2, Mail, Phone, Calendar, Building2, Briefcase, Clock, User } from 'lucide-react'
import { StatusBadge } from '../../components/ui/Badge'
import { Avatar } from '../../components/ui/Avatar'
import { useState } from 'react'
import { usePermissions } from '../../hooks/usePermissions'
import type { Employee } from '../../types'

const TABS = ['Overview', 'Attendance', 'Leaves', 'Payroll', 'Documents'] as const

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tab, setTab] = useState<typeof TABS[number]>('Overview')
  const { canManageEmployees } = usePermissions()

  const { data: emp, isLoading } = useQuery<Employee>({
    queryKey: ['employee', id],
    queryFn: () => api.get(`/employees/${id}`).then(r => r.data.data),
  })

  const { data: attData } = useQuery({
    queryKey: ['emp-attendance', id],
    queryFn: () => api.get('/attendance', { params: { employeeId: id, limit: 10 } }).then(r => r.data),
    enabled: tab === 'Attendance',
  })

  const { data: leaveData } = useQuery({
    queryKey: ['emp-leaves', id],
    queryFn: () => api.get('/leaves', { params: { employeeId: id, limit: 10 } }).then(r => r.data),
    enabled: tab === 'Leaves',
  })

  const { data: payData } = useQuery({
    queryKey: ['emp-payroll', id],
    queryFn: () => api.get('/payroll', { params: { employeeId: id, limit: 12 } }).then(r => r.data),
    enabled: tab === 'Payroll',
  })

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="loading-spinner w-10 h-10" /></div>
  if (!emp) return <div className="text-center py-16 text-gray-400">Employee not found</div>

  const Row = ({ label, value }: { label: string; value?: string | number | null }) => (
    <div className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800 text-right max-w-[60%]">{value ?? '—'}</span>
    </div>
  )

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/employees" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">{emp.user?.firstName} {emp.user?.lastName}</h1>
            <p className="page-subtitle">{emp.employeeId} • {emp.designation?.name} • {emp.department?.name}</p>
          </div>
        </div>
        {canManageEmployees && (
          <Link to={`/employees/${id}/edit`} className="btn-primary btn-sm">
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </Link>
        )}
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <Avatar src={emp.user?.avatar} name={`${emp.user?.firstName} ${emp.user?.lastName}`} size="xl" />
            <StatusBadge status={emp.employmentStatus} />
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Mail, label: 'Email', value: emp.user?.email },
              { icon: Phone, label: 'Phone', value: emp.phone },
              { icon: Building2, label: 'Department', value: emp.department?.name },
              { icon: Calendar, label: 'Joining Date', value: emp.joiningDate ? format(new Date(emp.joiningDate), 'MMM d, yyyy') : null },
              { icon: Briefcase, label: 'Designation', value: emp.designation?.name },
              { icon: Clock, label: 'Years of Service', value: emp.yearsOfService ? `${emp.yearsOfService} yrs` : null },
              { icon: User, label: 'Manager', value: emp.manager ? `${(emp.manager as any).user?.firstName} ${(emp.manager as any).user?.lastName}` : null },
              { icon: Clock, label: 'Shift', value: (emp.shift as any)?.name },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-2">
                <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-medium text-gray-800">{value ?? '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="card">
            <h3 className="section-title">Personal Information</h3>
            <Row label="Date of Birth" value={emp.dateOfBirth ? format(new Date(emp.dateOfBirth), 'MMM d, yyyy') : null} />
            <Row label="Age" value={emp.age ? `${emp.age} years` : null} />
            <Row label="Gender" value={emp.gender} />
            <Row label="Marital Status" value={emp.maritalStatus} />
            <Row label="Blood Group" value={emp.bloodGroup} />
            <Row label="Nationality" value={emp.nationality} />
          </div>
          <div className="card">
            <h3 className="section-title">Employment Details</h3>
            <Row label="Employee ID" value={emp.employeeId} />
            <Row label="Employment Type" value={emp.employmentType?.replace('_', ' ')} />
            <Row label="Status" value={emp.employmentStatus?.replace('_', ' ')} />
            <Row label="Notice Period" value={emp.noticePeriod ? `${emp.noticePeriod} days` : null} />
            <Row label="Confirmation Date" value={emp.confirmationDate ? format(new Date(emp.confirmationDate), 'MMM d, yyyy') : null} />
          </div>
          <div className="card">
            <h3 className="section-title">Salary Structure</h3>
            {emp.salary ? (
              <>
                <Row label="Basic" value={`₹${emp.salary.basic?.toLocaleString()}`} />
                <Row label="HRA" value={`₹${emp.salary.hra?.toLocaleString()}`} />
                <Row label="DA" value={`₹${emp.salary.da?.toLocaleString()}`} />
                <Row label="TA" value={`₹${emp.salary.ta?.toLocaleString()}`} />
                <Row label="Medical" value={`₹${emp.salary.medical?.toLocaleString()}`} />
                <Row label="Gross Salary" value={`₹${emp.salary.gross?.toLocaleString()}`} />
              </>
            ) : <p className="text-gray-400 text-sm">No salary info</p>}
          </div>
          <div className="card">
            <h3 className="section-title">Leave Balance</h3>
            {emp.leaveBalance ? (
              Object.entries(emp.leaveBalance).map(([type, days]) => (
                <div key={type} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500 capitalize">{type} Leave</span>
                  <span className="text-sm font-semibold text-primary-600">{String(days)} days</span>
                </div>
              ))
            ) : <p className="text-gray-400 text-sm">No data</p>}
          </div>
        </div>
      )}

      {tab === 'Attendance' && (
        <div className="card">
          <h3 className="section-title">Recent Attendance (Last 10 Records)</h3>
          <div className="table-container">
            <table className="table">
              <thead><tr>
                <th className="table-th">Date</th>
                <th className="table-th">Check In</th>
                <th className="table-th">Check Out</th>
                <th className="table-th">Hours</th>
                <th className="table-th">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {(attData?.data ?? []).length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-400">No records</td></tr>
                ) : (attData?.data ?? []).map((a: any) => (
                  <tr key={a._id} className="table-row">
                    <td className="table-td">{format(new Date(a.date), 'MMM d, yyyy')}</td>
                    <td className="table-td">{a.checkIn ? format(new Date(a.checkIn), 'HH:mm') : '—'}</td>
                    <td className="table-td">{a.checkOut ? format(new Date(a.checkOut), 'HH:mm') : '—'}</td>
                    <td className="table-td">{a.workHours?.toFixed(1) ?? '—'}h</td>
                    <td className="table-td"><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Leaves' && (
        <div className="card">
          <h3 className="section-title">Leave History</h3>
          <div className="table-container">
            <table className="table">
              <thead><tr>
                <th className="table-th">Type</th>
                <th className="table-th">From</th>
                <th className="table-th">To</th>
                <th className="table-th">Days</th>
                <th className="table-th">Reason</th>
                <th className="table-th">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {(leaveData?.data ?? []).length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-400">No records</td></tr>
                ) : (leaveData?.data ?? []).map((l: any) => (
                  <tr key={l._id} className="table-row">
                    <td className="table-td capitalize">{l.leaveType}</td>
                    <td className="table-td">{format(new Date(l.startDate), 'MMM d, yyyy')}</td>
                    <td className="table-td">{format(new Date(l.endDate), 'MMM d, yyyy')}</td>
                    <td className="table-td">{l.totalDays}</td>
                    <td className="table-td max-w-[200px] truncate">{l.reason}</td>
                    <td className="table-td"><StatusBadge status={l.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Payroll' && (
        <div className="card">
          <h3 className="section-title">Payroll History</h3>
          <div className="table-container">
            <table className="table">
              <thead><tr>
                <th className="table-th">Period</th>
                <th className="table-th">Gross</th>
                <th className="table-th">Deductions</th>
                <th className="table-th">Net Salary</th>
                <th className="table-th">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {(payData?.data ?? []).length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-400">No records</td></tr>
                ) : (payData?.data ?? []).map((p: any) => (
                  <tr key={p._id} className="table-row">
                    <td className="table-td">{new Date(0, p.month - 1).toLocaleString('default', { month: 'short' })} {p.year}</td>
                    <td className="table-td">₹{p.earnings?.grossEarnings?.toLocaleString()}</td>
                    <td className="table-td text-red-600">-₹{p.deductions?.totalDeductions?.toLocaleString()}</td>
                    <td className="table-td font-semibold text-emerald-600">₹{p.netSalary?.toLocaleString()}</td>
                    <td className="table-td"><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Documents' && (
        <div className="card">
          <h3 className="section-title">Documents</h3>
          {(emp.documents ?? []).length === 0 ? (
            <p className="text-gray-400 text-sm">No documents uploaded</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(emp.documents ?? []).map((doc: any) => (
                <a key={doc._id} href={doc.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 border border-gray-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-sm transition-all">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 font-bold text-xs uppercase flex-shrink-0">
                    {doc.mimeType?.includes('pdf') ? 'PDF' : 'IMG'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{doc.title}</p>
                    <p className="text-xs text-gray-400 capitalize">{doc.type}</p>
                  </div>
                  {doc.isVerified && <span className="ml-auto text-xs text-emerald-600 font-medium flex-shrink-0">✓</span>}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
