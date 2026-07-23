import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import { format } from 'date-fns'
import { ArrowLeft, Edit2, Mail, Phone, Calendar, Building2, Briefcase, Clock, User } from 'lucide-react'
import { getStatusBadge } from '../../components/ui/Badge'
import { useState } from 'react'
import { usePermissions } from '../../hooks/usePermissions'

const tabs = ['Overview', 'Attendance', 'Leaves', 'Payroll', 'Documents']

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState('Overview')
  const { canManageEmployees } = usePermissions()

  const { data, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => api.get(`/employees/${id}`).then(r => r.data.data)
  })

  const { data: attData } = useQuery({
    queryKey: ['employee-attendance', id],
    queryFn: () => api.get('/attendance', { params: { employeeId: id, limit: 10 } }).then(r => r.data),
    enabled: activeTab === 'Attendance'
  })

  const { data: leaveData } = useQuery({
    queryKey: ['employee-leaves', id],
    queryFn: () => api.get('/leaves', { params: { employeeId: id, limit: 10 } }).then(r => r.data),
    enabled: activeTab === 'Leaves'
  })

  const { data: payData } = useQuery({
    queryKey: ['employee-payroll', id],
    queryFn: () => api.get('/payroll', { params: { employeeId: id, limit: 12 } }).then(r => r.data),
    enabled: activeTab === 'Payroll'
  })

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="loading-spinner w-10 h-10" /></div>
  if (!data) return <div className="text-center py-16 text-gray-400">Employee not found</div>

  const emp = data
  const user = emp.user

  const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value || '-'}</span>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Link to="/employees" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">{user?.firstName} {user?.lastName}</h1>
            <p className="page-subtitle">{emp.employeeId} • {emp.designation?.name}</p>
          </div>
        </div>
        {canManageEmployees && (
          <Link to={`/employees/${id}/edit`} className="btn-primary">
            <Edit2 className="w-4 h-4" /> Edit
          </Link>
        )}
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 text-3xl font-bold overflow-hidden">
              {user?.avatar
                ? <img src={user.avatar} alt="" className="w-24 h-24 rounded-2xl object-cover" />
                : `${user?.firstName?.[0]}${user?.lastName?.[0]}`}
            </div>
            {getStatusBadge(emp.employmentStatus)}
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400 flex-shrink-0" /><div><p className="text-xs text-gray-400">Email</p><p className="text-sm font-medium">{user?.email}</p></div></div>
            <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400 flex-shrink-0" /><div><p className="text-xs text-gray-400">Phone</p><p className="text-sm font-medium">{emp.phone || '-'}</p></div></div>
            <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" /><div><p className="text-xs text-gray-400">Department</p><p className="text-sm font-medium">{emp.department?.name}</p></div></div>
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" /><div><p className="text-xs text-gray-400">Joining Date</p><p className="text-sm font-medium">{emp.joiningDate ? format(new Date(emp.joiningDate), 'MMM d, yyyy') : '-'}</p></div></div>
            <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" /><div><p className="text-xs text-gray-400">Type</p><p className="text-sm font-medium capitalize">{emp.employmentType?.replace('_', ' ')}</p></div></div>
            <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400 flex-shrink-0" /><div><p className="text-xs text-gray-400">Years of Service</p><p className="text-sm font-medium">{emp.yearsOfService || 0} years</p></div></div>
            <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400 flex-shrink-0" /><div><p className="text-xs text-gray-400">Manager</p><p className="text-sm font-medium">{emp.manager?.user?.firstName ? `${emp.manager.user.firstName} ${emp.manager.user.lastName}` : '-'}</p></div></div>
            <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400 flex-shrink-0" /><div><p className="text-xs text-gray-400">Shift</p><p className="text-sm font-medium">{emp.shift?.name || '-'}</p></div></div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="section-title">Personal Information</h3>
            <InfoRow label="Date of Birth" value={emp.dateOfBirth ? format(new Date(emp.dateOfBirth), 'MMM d, yyyy') : null} />
            <InfoRow label="Gender" value={emp.gender} />
            <InfoRow label="Marital Status" value={emp.maritalStatus} />
            <InfoRow label="Blood Group" value={emp.bloodGroup} />
            <InfoRow label="Nationality" value={emp.nationality} />
          </div>
          <div className="card">
            <h3 className="section-title">Salary Details</h3>
            <InfoRow label="Basic" value={emp.salary?.basic ? `Rs.${emp.salary.basic.toLocaleString()}` : null} />
            <InfoRow label="HRA" value={emp.salary?.hra ? `Rs.${emp.salary.hra.toLocaleString()}` : null} />
            <InfoRow label="DA" value={emp.salary?.da ? `Rs.${emp.salary.da.toLocaleString()}` : null} />
            <InfoRow label="Gross Salary" value={emp.salary?.gross ? `Rs.${emp.salary.gross.toLocaleString()}` : null} />
          </div>
          <div className="card">
            <h3 className="section-title">Leave Balance</h3>
            {emp.leaveBalance && Object.entries(emp.leaveBalance).map(([type, days]) => (
              <div key={type} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-500 capitalize">{type} Leave</span>
                <span className="font-semibold text-primary-600">{String(days)} days</span>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="section-title">Current Address</h3>
            {emp.currentAddress ? (
              <>
                <InfoRow label="Street" value={emp.currentAddress.street} />
                <InfoRow label="City" value={emp.currentAddress.city} />
                <InfoRow label="State" value={emp.currentAddress.state} />
                <InfoRow label="Country" value={emp.currentAddress.country} />
              </>
            ) : <p className="text-sm text-gray-400">No address on file</p>}
          </div>
        </div>
      )}

      {activeTab === 'Attendance' && (
        <div className="card">
          <h3 className="section-title">Recent Attendance</h3>
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr><th className="table-th">Date</th><th className="table-th">Check In</th><th className="table-th">Check Out</th><th className="table-th">Hours</th><th className="table-th">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {(attData?.data || []).map((a: { _id: string; date: string; checkIn?: string; checkOut?: string; workHours?: number; status: string }) => (
                  <tr key={a._id} className="table-row">
                    <td className="table-td">{format(new Date(a.date), 'MMM d, yyyy')}</td>
                    <td className="table-td">{a.checkIn ? format(new Date(a.checkIn), 'HH:mm') : '-'}</td>
                    <td className="table-td">{a.checkOut ? format(new Date(a.checkOut), 'HH:mm') : '-'}</td>
                    <td className="table-td">{a.workHours?.toFixed(1) || '-'}h</td>
                    <td className="table-td">{getStatusBadge(a.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Leaves' && (
        <div className="card">
          <h3 className="section-title">Leave History</h3>
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr><th className="table-th">Type</th><th className="table-th">From</th><th className="table-th">To</th><th className="table-th">Days</th><th className="table-th">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {(leaveData?.data || []).map((l: { _id: string; leaveType: string; startDate: string; endDate: string; totalDays: number; status: string }) => (
                  <tr key={l._id} className="table-row">
                    <td className="table-td capitalize">{l.leaveType}</td>
                    <td className="table-td">{format(new Date(l.startDate), 'MMM d, yyyy')}</td>
                    <td className="table-td">{format(new Date(l.endDate), 'MMM d, yyyy')}</td>
                    <td className="table-td">{l.totalDays}</td>
                    <td className="table-td">{getStatusBadge(l.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Payroll' && (
        <div className="card">
          <h3 className="section-title">Payroll History</h3>
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr><th className="table-th">Period</th><th className="table-th">Gross</th><th className="table-th">Deductions</th><th className="table-th">Net Salary</th><th className="table-th">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {(payData?.data || []).map((p: { _id: string; month: number; year: number; earnings?: { grossEarnings?: number }; deductions?: { totalDeductions?: number }; netSalary?: number; status: string }) => (
                  <tr key={p._id} className="table-row">
                    <td className="table-td">{new Date(0, p.month - 1).toLocaleString('default', { month: 'short' })} {p.year}</td>
                    <td className="table-td">Rs.{p.earnings?.grossEarnings?.toLocaleString()}</td>
                    <td className="table-td">Rs.{p.deductions?.totalDeductions?.toLocaleString()}</td>
                    <td className="table-td font-semibold text-emerald-600">Rs.{p.netSalary?.toLocaleString()}</td>
                    <td className="table-td">{getStatusBadge(p.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Documents' && (
        <div className="card">
          <h3 className="section-title">Documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(emp.documents || []).length === 0
              ? <p className="text-gray-400 text-sm">No documents uploaded</p>
              : (emp.documents || []).map((doc: { _id: string; title: string; type: string }) => (
                <div key={doc._id} className="border border-gray-200 rounded-xl p-4 flex items-center gap-3 hover:border-primary-300 transition-colors">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs uppercase">DOC</div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{doc.title}</p>
                    <p className="text-xs text-gray-400 capitalize">{doc.type}</p>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  )
}
