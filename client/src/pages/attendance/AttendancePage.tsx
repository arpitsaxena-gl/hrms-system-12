import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import { Table } from '../../components/ui/Table'
import { StatusBadge } from '../../components/ui/Badge'
import { StatCard } from '../../components/ui/StatCard'
import { usePermissions } from '../../hooks/usePermissions'
import { Clock, LogIn, LogOut, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import type { Attendance } from '../../types'
import toast from 'react-hot-toast'

export default function AttendancePage() {
  const qc = useQueryClient()
  const { isEmployee } = usePermissions()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [status, setStatus] = useState('')
  const today = new Date()
  const [month, setMonth] = useState(String(today.getMonth() + 1))
  const [year, setYear] = useState(String(today.getFullYear()))

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', page, limit, status, month, year],
    queryFn: () => api.get('/attendance', { params: { page, limit, status: status || undefined, month, year } }).then(r => r.data),
  })

  const { data: summary } = useQuery({
    queryKey: ['attendance-summary', month, year],
    queryFn: () => api.get('/attendance/summary', { params: { month, year } }).then(r => r.data.data),
  })

  const checkInMutation = useMutation({
    mutationFn: () => api.post('/attendance/check-in', { isRemote: false }),
    onSuccess: () => { toast.success('Checked in successfully!'); qc.invalidateQueries({ queryKey: ['attendance'] }) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Check-in failed'),
  })

  const checkOutMutation = useMutation({
    mutationFn: () => api.post('/attendance/check-out', {}),
    onSuccess: () => { toast.success('Checked out successfully!'); qc.invalidateQueries({ queryKey: ['attendance'] }) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Check-out failed'),
  })

  const s = summary?.summary ?? {}

  const columns = [
    { header: 'Employee', cell: (a: Attendance) => (
      <div>
        <p className="font-medium text-gray-900 text-sm">{a.employee?.user?.firstName} {a.employee?.user?.lastName}</p>
        <p className="text-xs text-gray-400">{(a.employee as any)?.employeeId}</p>
      </div>
    )},
    { header: 'Date', cell: (a: Attendance) => format(new Date(a.date), 'MMM d, yyyy') },
    { header: 'Check In', cell: (a: Attendance) => a.checkIn ? format(new Date(a.checkIn), 'HH:mm') : '—' },
    { header: 'Check Out', cell: (a: Attendance) => a.checkOut ? format(new Date(a.checkOut), 'HH:mm') : '—' },
    { header: 'Hours', cell: (a: Attendance) => a.workHours ? `${a.workHours.toFixed(1)}h` : '—' },
    { header: 'Late (min)', cell: (a: Attendance) => a.lateMinutes ? <span className="text-amber-600">{a.lateMinutes}m</span> : '—' },
    { header: 'Status', cell: (a: Attendance) => <StatusBadge status={a.status} /> },
  ]

  const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div><h1 className="page-title">Attendance</h1><p className="page-subtitle">Track employee attendance</p></div>
        {isEmployee && (
          <div className="flex gap-2">
            <button onClick={() => checkInMutation.mutate()} disabled={checkInMutation.isPending} className="btn-success btn-sm">
              <LogIn className="w-4 h-4" /> Check In
            </button>
            <button onClick={() => checkOutMutation.mutate()} disabled={checkOutMutation.isPending} className="btn-secondary btn-sm">
              <LogOut className="w-4 h-4" /> Check Out
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Present" value={s.present?.count ?? 0} icon={CheckCircle} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard title="Absent" value={s.absent?.count ?? 0} icon={XCircle} iconBg="bg-red-50" iconColor="text-red-600" />
        <StatCard title="Late" value={s.late?.count ?? 0} icon={AlertCircle} iconBg="bg-amber-50" iconColor="text-amber-600" />
        <StatCard title="On Leave" value={s.on_leave?.count ?? 0} icon={Calendar} iconBg="bg-blue-50" iconColor="text-blue-600" />
      </div>

      <div className="card !p-4">
        <div className="flex flex-wrap gap-3">
          <select value={month} onChange={e => { setMonth(e.target.value); setPage(1) }} className="input w-36">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i+1} value={String(i+1)}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
          <select value={year} onChange={e => { setYear(e.target.value); setPage(1) }} className="input w-24">
            {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} className="input w-40">
            <option value="">All Status</option>
            {['present','absent','late','half_day','on_leave','holiday','work_from_home'].map(st => (
              <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>
            ))}
          </select>
          {status && <button onClick={() => { setStatus(''); setPage(1) }} className="btn-secondary btn-sm">Clear</button>}
        </div>
      </div>

      <Table columns={columns} data={data?.data ?? []} loading={isLoading} rowKey={(a: Attendance) => a._id}
        pagination={data?.pagination ? { ...data.pagination, onPageChange: setPage, onLimitChange: (l: number) => { setLimit(l); setPage(1) } } : undefined} />
    </div>
  )
}
