import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import { Table } from '../../components/ui/Table'
import { StatusBadge } from '../../components/ui/Badge'
import { StatCard } from '../../components/ui/StatCard'
import { usePermissions } from '../../hooks/usePermissions'
import { DollarSign, Play, Check } from 'lucide-react'
import type { Payroll } from '../../types'
import toast from 'react-hot-toast'

export default function PayrollPage() {
  const qc = useQueryClient()
  const { canManagePayroll } = usePermissions()
  const today = new Date()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [month, setMonth] = useState(String(today.getMonth() + 1))
  const [year, setYear] = useState(String(today.getFullYear()))
  const [status, setStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['payroll', page, limit, month, year, status],
    queryFn: () => api.get('/payroll', { params: { page, limit, month, year, status: status || undefined } }).then(r => r.data),
  })

  const { data: summary } = useQuery({
    queryKey: ['payroll-summary', month, year],
    queryFn: () => api.get('/payroll/summary', { params: { month, year } }).then(r => r.data.data),
    enabled: canManagePayroll,
  })

  const processMutation = useMutation({
    mutationFn: () => api.post('/payroll/process', { month: Number(month), year: Number(year) }),
    onSuccess: (res) => { toast.success(`Processed ${res.data?.data?.processed ?? 0} payrolls`); qc.invalidateQueries({ queryKey: ['payroll'] }); qc.invalidateQueries({ queryKey: ['payroll-summary'] }) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.put(`/payroll/${id}/approve`),
    onSuccess: () => { toast.success('Approved!'); qc.invalidateQueries({ queryKey: ['payroll'] }) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  })

  const paidMutation = useMutation({
    mutationFn: (id: string) => api.put(`/payroll/${id}/paid`, { paymentDate: new Date(), paymentMethod: 'bank_transfer' }),
    onSuccess: () => { toast.success('Marked as paid!'); qc.invalidateQueries({ queryKey: ['payroll'] }) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  })

  const summaryData = (summary?.summary ?? []).reduce((acc: any, s: any) => { acc[s._id] = s; return acc }, {})

  const columns = [
    { header: 'Employee', cell: (p: Payroll) => (
      <div>
        <p className="font-medium text-sm">{p.employee?.user?.firstName} {p.employee?.user?.lastName}</p>
        <p className="text-xs text-gray-400">{(p.employee as any)?.employeeId}</p>
      </div>
    )},
    { header: 'Period', cell: (p: Payroll) => `${new Date(0, p.month - 1).toLocaleString('default', { month: 'short' })} ${p.year}` },
    { header: 'Working Days', cell: (p: Payroll) => `${p.attendanceSummary?.presentDays ?? 0} / ${p.attendanceSummary?.workingDays ?? 0}` },
    { header: 'Gross Salary', cell: (p: Payroll) => <span className="font-medium">₹{p.earnings?.grossEarnings?.toLocaleString()}</span> },
    { header: 'Deductions', cell: (p: Payroll) => <span className="text-red-600">-₹{p.deductions?.totalDeductions?.toLocaleString()}</span> },
    { header: 'Net Salary', cell: (p: Payroll) => <span className="font-bold text-emerald-600">₹{p.netSalary?.toLocaleString()}</span> },
    { header: 'Status', cell: (p: Payroll) => <StatusBadge status={p.status} /> },
    { header: 'Actions', cell: (p: Payroll) => canManagePayroll ? (
      <div className="flex gap-1">
        {p.status === 'draft' && <button onClick={() => approveMutation.mutate(p._id)} className="btn-sm btn-primary !py-1" title="Approve"><Check className="w-3.5 h-3.5" /></button>}
        {p.status === 'processed' && <button onClick={() => paidMutation.mutate(p._id)} className="btn-sm btn-success !py-1">Mark Paid</button>}
      </div>
    ) : null },
  ]

  const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div><h1 className="page-title">Payroll</h1><p className="page-subtitle">Manage employee salaries</p></div>
        {canManagePayroll && (
          <button onClick={() => processMutation.mutate()} disabled={processMutation.isPending} className="btn-primary btn-sm">
            {processMutation.isPending ? 'Processing...' : <><Play className="w-4 h-4" /> Process Payroll</>}
          </button>
        )}
      </div>

      {canManagePayroll && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Paid" value={summaryData.paid?.count ?? 0} icon={DollarSign} iconBg="bg-green-50" iconColor="text-green-600" />
          <StatCard title="Total Amount" value={summaryData.paid ? `₹${((summaryData.paid.totalNet ?? 0) / 100000).toFixed(1)}L` : '₹0'} icon={DollarSign} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
          <StatCard title="Pending" value={summaryData.draft?.count ?? 0} icon={DollarSign} iconBg="bg-amber-50" iconColor="text-amber-600" />
          <StatCard title="Processed" value={summaryData.processed?.count ?? 0} icon={DollarSign} iconBg="bg-blue-50" iconColor="text-blue-600" />
        </div>
      )}

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
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} className="input w-36">
            <option value="">All Status</option>
            {['draft','processed','paid','cancelled'].map(st => <option key={st} value={st}>{st}</option>)}
          </select>
        </div>
      </div>

      <Table columns={columns} data={data?.data ?? []} loading={isLoading} rowKey={(p: Payroll) => p._id}
        pagination={data?.pagination ? { ...data.pagination, onPageChange: setPage, onLimitChange: (l: number) => { setLimit(l); setPage(1) } } : undefined} />
    </div>
  )
}
