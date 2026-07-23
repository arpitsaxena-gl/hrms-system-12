import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import { Table } from '../../components/ui/Table'
import { Modal } from '../../components/ui/Modal'
import { StatusBadge } from '../../components/ui/Badge'
import { usePermissions } from '../../hooks/usePermissions'
import { Plus, Check, X } from 'lucide-react'
import type { Leave } from '../../types'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const LEAVE_TYPES = ['annual', 'sick', 'casual', 'maternity', 'paternity', 'unpaid', 'compensatory']
const EMPTY_FORM = { leaveType: 'casual', startDate: '', endDate: '', reason: '', isHalfDay: false }

export default function LeavesPage() {
  const qc = useQueryClient()
  const { canApproveLeaves, isEmployee } = usePermissions()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [status, setStatus] = useState('')
  const [applyOpen, setApplyOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [rejectModal, setRejectModal] = useState<{ id: string; reason: string } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['leaves', page, limit, status],
    queryFn: () => api.get('/leaves', { params: { page, limit, status: status || undefined } }).then(r => r.data),
  })

  const { data: balanceData } = useQuery({
    queryKey: ['leave-balance'],
    queryFn: () => api.get('/leaves/balance').then(r => r.data.data),
    enabled: isEmployee,
  })

  const applyMutation = useMutation({
    mutationFn: (d: any) => api.post('/leaves', d),
    onSuccess: () => { toast.success('Leave applied!'); qc.invalidateQueries({ queryKey: ['leaves'] }); qc.invalidateQueries({ queryKey: ['leave-balance'] }); setApplyOpen(false); setForm(EMPTY_FORM) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status: st, rejectionReason }: any) => api.put(`/leaves/${id}/status`, { status: st, rejectionReason }),
    onSuccess: () => { toast.success('Leave updated!'); qc.invalidateQueries({ queryKey: ['leaves'] }); setRejectModal(null) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  })

  const set = (k: string) => (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const columns = [
    { header: 'Employee', cell: (l: Leave) => (
      <div><p className="font-medium text-sm">{l.employee?.user?.firstName} {l.employee?.user?.lastName}</p><p className="text-xs text-gray-400">{(l.employee as any)?.employeeId}</p></div>
    )},
    { header: 'Leave Type', cell: (l: Leave) => <span className="capitalize font-medium text-gray-700">{l.leaveType}</span> },
    { header: 'From', cell: (l: Leave) => format(new Date(l.startDate), 'MMM d, yyyy') },
    { header: 'To', cell: (l: Leave) => format(new Date(l.endDate), 'MMM d, yyyy') },
    { header: 'Days', cell: (l: Leave) => <span className="font-semibold text-primary-600">{l.totalDays}</span> },
    { header: 'Reason', cell: (l: Leave) => <span className="max-w-[150px] truncate block text-gray-600">{l.reason}</span> },
    { header: 'Status', cell: (l: Leave) => <StatusBadge status={l.status} /> },
    { header: 'Actions', cell: (l: Leave) => canApproveLeaves && l.status === 'pending' ? (
      <div className="flex gap-1">
        <button onClick={() => statusMutation.mutate({ id: l._id, status: 'approved' })} className="p-1.5 rounded hover:bg-emerald-50 text-gray-400 hover:text-emerald-600" title="Approve"><Check className="w-4 h-4" /></button>
        <button onClick={() => setRejectModal({ id: l._id, reason: '' })} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600" title="Reject"><X className="w-4 h-4" /></button>
      </div>
    ) : null },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div><h1 className="page-title">Leave Management</h1><p className="page-subtitle">{data?.pagination?.total ?? 0} total requests</p></div>
        <button onClick={() => setApplyOpen(true)} className="btn-primary btn-sm"><Plus className="w-4 h-4" /> Apply Leave</button>
      </div>

      {balanceData && (
        <div className="card !p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Leave Balance</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(balanceData).map(([type, days]) => (
              <div key={type} className="text-center">
                <p className="text-2xl font-bold text-primary-600">{String(days)}</p>
                <p className="text-xs text-gray-500 capitalize">{type}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card !p-4">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} className="input w-40">
          <option value="">All Status</option>
          {['pending','approved','rejected','cancelled'].map(st => <option key={st} value={st}>{st}</option>)}
        </select>
      </div>

      <Table columns={columns} data={data?.data ?? []} loading={isLoading} rowKey={(l: Leave) => l._id}
        pagination={data?.pagination ? { ...data.pagination, onPageChange: setPage, onLimitChange: (l: number) => { setLimit(l); setPage(1) } } : undefined} />

      <Modal isOpen={applyOpen} onClose={() => setApplyOpen(false)} title="Apply for Leave"
        footer={
          <>
            <button onClick={() => setApplyOpen(false)} className="btn-secondary btn-sm">Cancel</button>
            <button onClick={() => applyMutation.mutate({ leaveType: form.leaveType, startDate: form.startDate, endDate: form.endDate, reason: form.reason, isHalfDay: form.isHalfDay })} disabled={applyMutation.isPending} className="btn-primary btn-sm">
              {applyMutation.isPending ? 'Submitting...' : 'Submit'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="form-group"><label className="label">Leave Type</label>
            <select value={form.leaveType} onChange={set('leaveType')} className="input">
              {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="label">Start Date</label><input type="date" value={form.startDate} onChange={set('startDate')} className="input" /></div>
            <div className="form-group"><label className="label">End Date</label><input type="date" value={form.endDate} onChange={set('endDate')} className="input" /></div>
          </div>
          <div className="form-group"><label className="label">Reason *</label><textarea value={form.reason} onChange={set('reason')} className="input resize-none" rows={3} placeholder="Please provide reason for leave..." /></div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isHalfDay} onChange={e => setForm(f => ({ ...f, isHalfDay: e.target.checked }))} />
            <span className="text-sm text-gray-700">Half Day</span>
          </label>
        </div>
      </Modal>

      {rejectModal && (
        <Modal isOpen={true} onClose={() => setRejectModal(null)} title="Reject Leave" size="sm"
          footer={
            <>
              <button onClick={() => setRejectModal(null)} className="btn-secondary btn-sm">Cancel</button>
              <button onClick={() => statusMutation.mutate({ id: rejectModal.id, status: 'rejected', rejectionReason: rejectModal.reason })} disabled={statusMutation.isPending} className="btn-danger btn-sm">Reject</button>
            </>
          }
        >
          <div className="form-group">
            <label className="label">Rejection Reason</label>
            <textarea value={rejectModal.reason} onChange={e => setRejectModal(r => r ? { ...r, reason: e.target.value } : null)} className="input resize-none" rows={3} placeholder="Optional reason..." />
          </div>
        </Modal>
      )}
    </div>
  )
}
