import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import { Table } from '../../components/ui/Table'
import { getStatusBadge } from '../../components/ui/Badge'
import { format } from 'date-fns'
import { Clock, LogIn, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import { usePermissions } from '../../hooks/usePermissions'
import { useAuthStore } from '../../store/authStore'

interface AttRecord { _id: string; employee: { _id: string; user?: { firstName?: string; lastName?: string }; employeeId?: string }; date: string; checkIn?: string; checkOut?: string; workHours?: number; lateMinutes?: number; status: string; isRemote?: boolean }

export default function AttendancePage() {
  const qc = useQueryClient()
  const { isEmployee } = usePermissions()
  const { user } = useAuthStore()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [dateFrom, setDateFrom] = useState(format(new Date(new Date().setDate(1)), 'yyyy-MM-dd'))
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [status, setStatus] = useState('')

  const { data: myAtt } = useQuery({
    queryKey: ['my-today-attendance'],
    queryFn: () => api.get(`/attendance/today`).then(r => r.data.data),
    enabled: isEmployee
  })

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', page, limit, dateFrom, dateTo, status],
    queryFn: () => api.get('/attendance', { params: { page, limit, dateFrom, dateTo, status: status || undefined } }).then(r => r.data)
  })

  const checkInMutation = useMutation({
    mutationFn: () => api.post('/attendance/checkin', { isRemote: false }),
    onSuccess: () => { toast.success('Checked in!'); qc.invalidateQueries({ queryKey: ['attendance'] }); qc.invalidateQueries({ queryKey: ['my-today-attendance'] }) },
    onError: (err: unknown) => { const e = err as { response?: { data?: { message?: string } } }; toast.error(e?.response?.data?.message || 'Failed') }
  })

  const checkOutMutation = useMutation({
    mutationFn: () => api.post('/attendance/checkout'),
    onSuccess: () => { toast.success('Checked out!'); qc.invalidateQueries({ queryKey: ['attendance'] }); qc.invalidateQueries({ queryKey: ['my-today-attendance'] }) },
    onError: (err: unknown) => { const e = err as { response?: { data?: { message?: string } } }; toast.error(e?.response?.data?.message || 'Failed') }
  })

  const columns = [
    { header: 'Employee', cell: (r: AttRecord) => (
      <div>
        <p className="font-medium text-sm">{r.employee?.user?.firstName} {r.employee?.user?.lastName}</p>
        <p className="text-xs text-gray-400">{r.employee?.employeeId}</p>
      </div>
    )},
    { header: 'Date', cell: (r: AttRecord) => format(new Date(r.date), 'MMM d, yyyy') },
    { header: 'Check In', cell: (r: AttRecord) => r.checkIn ? format(new Date(r.checkIn), 'HH:mm') : '-' },
    { header: 'Check Out', cell: (r: AttRecord) => r.checkOut ? format(new Date(r.checkOut), 'HH:mm') : '-' },
    { header: 'Hours', cell: (r: AttRecord) => r.workHours ? `${r.workHours.toFixed(1)}h` : '-' },
    { header: 'Late', cell: (r: AttRecord) => r.lateMinutes ? `${r.lateMinutes}m` : '-' },
    { header: 'Mode', cell: (r: AttRecord) => r.isRemote ? <span className="text-xs text-blue-600 font-medium">Remote</span> : <span className="text-xs text-gray-500">Office</span> },
    { header: 'Status', cell: (r: AttRecord) => getStatusBadge(r.status) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Track employee attendance and work hours</p>
        </div>
      </div>

      {isEmployee && (
        <div className="card">
          <h3 className="section-title">Today - {format(new Date(), 'MMMM d, yyyy')}</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              {myAtt ? (
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">In: {myAtt.checkIn ? format(new Date(myAtt.checkIn), 'HH:mm') : 'Not yet'}</span>
                  </div>
                  {myAtt.checkOut && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">Out: {format(new Date(myAtt.checkOut), 'HH:mm')}</span>
                    </div>
                  )}
                  {myAtt.workHours && <span className="text-sm text-gray-600">Total: {myAtt.workHours.toFixed(1)}h</span>}
                  <div>{getStatusBadge(myAtt.status)}</div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No attendance record for today</p>
              )}
            </div>
            <div className="flex gap-3">
              {!myAtt?.checkIn && (
                <button onClick={() => checkInMutation.mutate()} disabled={checkInMutation.isPending} className="btn-success">
                  <LogIn className="w-4 h-4" /> Check In
                </button>
              )}
              {myAtt?.checkIn && !myAtt?.checkOut && (
                <button onClick={() => checkOutMutation.mutate()} disabled={checkOutMutation.isPending} className="btn-danger">
                  <LogOut className="w-4 h-4" /> Check Out
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 font-medium">From:</label>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }} className="input w-40" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 font-medium">To:</label>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }} className="input w-40" />
          </div>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} className="input w-40">
            <option value="">All Status</option>
            {['present','absent','late','half_day','on_leave','holiday','work_from_home'].map(s => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      <Table
        columns={columns}
        data={data?.data || []}
        loading={isLoading}
        pagination={data?.pagination ? { ...data.pagination, onPageChange: setPage, onLimitChange: (l: number) => { setLimit(l); setPage(1) } } : undefined}
        rowKey={r => r._id}
      />
    </div>
  )
}
