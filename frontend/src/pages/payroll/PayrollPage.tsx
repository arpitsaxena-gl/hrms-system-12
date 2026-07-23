import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import { Table } from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import { getStatusBadge } from '../../components/ui/Badge'
import { DollarSign, Play } from 'lucide-react'
import toast from 'react-hot-toast'
import { usePermissions } from '../../hooks/usePermissions'

interface PayRecord { _id: string; employee: { user?: { firstName?: string; lastName?: string }; employeeId?: string }; month: number; year: number; earnings?: { grossEarnings?: number }; deductions?: { totalDeductions?: number }; netSalary?: number; status: string }

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function PayrollPage() {
  const qc = useQueryClient()
  const { canManagePayroll } = usePermissions()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [status, setStatus] = useState('')
  const [processModal, setProcessModal] = useState(false)
  const [selectedEmp, setSelectedEmp] = useState('')

  const { data: empData } = useQuery({ queryKey: ['employees-all'], queryFn: () => api.get('/employees?limit=200&status=active').then(r => r.data) })

  const { data, isLoading } = useQuery({
    queryKey: ['payroll', page, limit, month, year, status],
    queryFn: () => api.get('/payroll', { params: { page, limit, month, year, status: status || undefined } }).then(r => r.data)
  })

  const processMutation = useMutation({
    mutationFn: (d: { employee: string; month: number; year: number }) => api.post('/payroll/process', d),
    onSuccess: () => { toast.success('Payroll processed!'); qc.invalidateQueries({ queryKey: ['payroll'] }); setProcessModal(false) },
    onError: (err: unknown) => { const e = err as { response?: { data?: { message?: string } } }; toast.error(e?.response?.data?.message || 'Failed') }
  })

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => api.put(`/payroll/${id}/pay`),
    onSuccess: () => { toast.success('Marked as paid!'); qc.invalidateQueries({ queryKey: ['payroll'] }) }
  })

  const columns = [
    { header: 'Employee', cell: (r: PayRecord) => (
      <div>
        <p className="font-medium text-sm">{r.employee?.user?.firstName} {r.employee?.user?.lastName}</p>
        <p className="text-xs text-gray-400">{r.employee?.employeeId}</p>
      </div>
    )},
    { header: 'Period', cell: (r: PayRecord) => `${months[r.month - 1]} ${r.year}` },
    { header: 'Gross Earnings', cell: (r: PayRecord) => <span className="font-medium">Rs.{r.earnings?.grossEarnings?.toLocaleString() || 0}</span> },
    { header: 'Deductions', cell: (r: PayRecord) => <span className="text-red-600">Rs.{r.deductions?.totalDeductions?.toLocaleString() || 0}</span> },
    { header: 'Net Salary', cell: (r: PayRecord) => <span className="font-semibold text-emerald-600 text-base">Rs.{r.netSalary?.toLocaleString() || 0}</span> },
    { header: 'Status', cell: (r: PayRecord) => getStatusBadge(r.status) },
    { header: 'Actions', cell: (r: PayRecord) => canManagePayroll && r.status === 'processed' ? (
      <button onClick={() => markPaidMutation.mutate(r._id)} className="btn-success btn-sm">
        <DollarSign className="w-3 h-3" /> Mark Paid
      </button>
    ) : null }
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payroll</h1>
          <p className="page-subtitle">Manage employee salaries and payments</p>
        </div>
        {canManagePayroll && (
          <button onClick={() => setProcessModal(true)} className="btn-primary">
            <Play className="w-4 h-4" /> Process Payroll
          </button>
        )}
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-4">
          <select value={month} onChange={e => { setMonth(Number(e.target.value)); setPage(1) }} className="input w-36">
            {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => { setYear(Number(e.target.value)); setPage(1) }} className="input w-28">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} className="input w-36">
            <option value="">All Status</option>
            {['draft','processed','paid','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
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

      <Modal
        isOpen={processModal}
        onClose={() => setProcessModal(false)}
        title="Process Payroll"
        footer={
          <>
            <button onClick={() => setProcessModal(false)} className="btn-secondary">Cancel</button>
            <button
              onClick={() => selectedEmp && processMutation.mutate({ employee: selectedEmp, month, year })}
              disabled={!selectedEmp || processMutation.isPending}
              className="btn-primary"
            >
              {processMutation.isPending ? 'Processing...' : 'Process'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Employee</label>
            <select value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)} className="input">
              <option value="">Select Employee</option>
              {(empData?.data || []).map((e: { _id: string; user?: { firstName?: string; lastName?: string }; employeeId?: string }) => (
                <option key={e._id} value={e._id}>{e.user?.firstName} {e.user?.lastName} ({e.employeeId})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Month</label>
              <select value={month} onChange={e => setMonth(Number(e.target.value))} className="input">
                {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Year</label>
              <select value={year} onChange={e => setYear(Number(e.target.value))} className="input">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
