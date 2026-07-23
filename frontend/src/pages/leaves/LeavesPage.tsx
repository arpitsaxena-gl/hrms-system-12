import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import { Table } from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import { getStatusBadge } from '../../components/ui/Badge'
import { format } from 'date-fns'
import { Plus, Check, X, Calendar } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { usePermissions } from '../../hooks/usePermissions'

const schema = z.object({
  leaveType: z.string().min(1, 'Leave type required'),
  startDate: z.string().min(1, 'Start date required'),
  endDate: z.string().min(1, 'End date required'),
  reason: z.string().min(1, 'Reason required'),
  isHalfDay: z.boolean().optional(),
})
type FormData = z.infer<typeof schema>

interface LeaveRecord { _id: string; employee: { user?: { firstName?: string; lastName?: string }; employeeId?: string }; leaveType: string; startDate: string; endDate: string; totalDays: number; reason: string; status: string; approvedBy?: { firstName?: string; lastName?: string }; createdAt: string }

export default function LeavesPage() {
  const qc = useQueryClient()
  const { canApproveLeaves, isEmployee } = usePermissions()
  const [modalOpen, setModalOpen] = useState(false)
  const [rejectModal, setRejectModal] = useState<{ id: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [status, setStatus] = useState('')

  const { data: balData } = useQuery({
    queryKey: ['my-leave-balance'],
    queryFn: () => api.get('/leaves/balance').then(r => r.data.data),
    enabled: isEmployee
  })

  const { data, isLoading } = useQuery({
    queryKey: ['leaves', page, limit, status],
    queryFn: () => api.get('/leaves', { params: { page, limit, status: status || undefined } }).then(r => r.data)
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { isHalfDay: false } })

  const applyMutation = useMutation({
    mutationFn: (d: FormData) => api.post('/leaves', d),
    onSuccess: () => { toast.success('Leave applied!'); qc.invalidateQueries({ queryKey: ['leaves'] }); setModalOpen(false); reset() },
    onError: (err: unknown) => { const e = err as { response?: { data?: { message?: string } } }; toast.error(e?.response?.data?.message || 'Failed') }
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.put(`/leaves/${id}/approve`),
    onSuccess: () => { toast.success('Leave approved!'); qc.invalidateQueries({ queryKey: ['leaves'] }) }
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.put(`/leaves/${id}/reject`, { rejectionReason: reason }),
    onSuccess: () => { toast.success('Leave rejected'); qc.invalidateQueries({ queryKey: ['leaves'] }); setRejectModal(null); setRejectReason('') }
  })

  const columns = [
    { header: 'Employee', cell: (r: LeaveRecord) => (
      <div>
        <p className="font-medium text-sm">{r.employee?.user?.firstName} {r.employee?.user?.lastName}</p>
        <p className="text-xs text-gray-400">{r.employee?.employeeId}</p>
      </div>
    )},
    { header: 'Type', cell: (r: LeaveRecord) => <span className="capitalize text-sm">{r.leaveType}</span> },
    { header: 'From', cell: (r: LeaveRecord) => format(new Date(r.startDate), 'MMM d, yyyy') },
    { header: 'To', cell: (r: LeaveRecord) => format(new Date(r.endDate), 'MMM d, yyyy') },
    { header: 'Days', cell: (r: LeaveRecord) => <span className="font-medium">{r.totalDays}</span> },
    { header: 'Status', cell: (r: LeaveRecord) => getStatusBadge(r.status) },
    { header: 'Actions', cell: (r: LeaveRecord) => (
      <div className="flex items-center gap-1">
        {canApproveLeaves && r.status === 'pending' && (
          <>
            <button onClick={() => approveMutation.mutate(r._id)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-emerald-600 transition-colors" title="Approve">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => setRejectModal({ id: r._id })} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors" title="Reject">
              <X className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    )}
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Leaves</h1>
          <p className="page-subtitle">Manage leave requests and approvals</p>
        </div>
        {isEmployee && (
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Apply Leave
          </button>
        )}
      </div>

      {isEmployee && balData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(balData).map(([type, days]) => (
            <div key={type} className="card-sm text-center">
              <p className="text-2xl font-bold text-primary-600">{String(days)}</p>
              <p className="text-xs text-gray-500 capitalize mt-1">{type} Leave</p>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} className="input max-w-xs">
          <option value="">All Status</option>
          {['pending','approved','rejected','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <Table
        columns={columns}
        data={data?.data || []}
        loading={isLoading}
        pagination={data?.pagination ? { ...data.pagination, onPageChange: setPage, onLimitChange: (l: number) => { setLimit(l); setPage(1) } } : undefined}
        rowKey={r => r._id}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); reset() }}
        title="Apply for Leave"
        footer={
          <>
            <button onClick={() => { setModalOpen(false); reset() }} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit(d => applyMutation.mutate(d))} disabled={applyMutation.isPending} className="btn-primary">
              {applyMutation.isPending ? 'Applying...' : 'Apply'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Leave Type *</label>
            <select {...register('leaveType')} className={`input ${errors.leaveType ? 'input-error' : ''}`}>
              <option value="">Select</option>
              {['annual','sick','casual','compensatory','maternity','paternity'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {errors.leaveType && <p className="text-red-500 text-xs mt-1">{errors.leaveType.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">From *</label>
              <input {...register('startDate')} type="date" className={`input ${errors.startDate ? 'input-error' : ''}`} />
            </div>
            <div className="form-group">
              <label className="label">To *</label>
              <input {...register('endDate')} type="date" className={`input ${errors.endDate ? 'input-error' : ''}`} />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Reason *</label>
            <textarea {...register('reason')} className={`input resize-none ${errors.reason ? 'input-error' : ''}`} rows={3} placeholder="Reason for leave..." />
            {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason.message}</p>}
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input {...register('isHalfDay')} type="checkbox" className="rounded" />
            Half Day
          </label>
        </div>
      </Modal>

      {rejectModal && (
        <Modal isOpen={true} onClose={() => { setRejectModal(null); setRejectReason('') }} title="Reject Leave" footer={
          <>
            <button onClick={() => { setRejectModal(null); setRejectReason('') }} className="btn-secondary">Cancel</button>
            <button onClick={() => rejectMutation.mutate({ id: rejectModal.id, reason: rejectReason })} className="btn-danger">Reject</button>
          </>
        }>
          <div className="form-group">
            <label className="label">Rejection Reason</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="input resize-none" rows={3} placeholder="Reason for rejection..." />
          </div>
        </Modal>
      )}
    </div>
  )
}
