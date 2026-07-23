import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import { Table } from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import { getStatusBadge } from '../../components/ui/Badge'
import { format } from 'date-fns'
import { Plus, Star } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { usePermissions } from '../../hooks/usePermissions'

const schema = z.object({
  employee: z.string().min(1, 'Employee required'),
  periodFrom: z.string().min(1, 'From date required'),
  periodTo: z.string().min(1, 'To date required'),
  periodType: z.string().min(1, 'Period type required'),
})
type FormData = z.infer<typeof schema>

interface PerfRecord { _id: string; employee: { user?: { firstName?: string; lastName?: string } }; reviewer: { user?: { firstName?: string; lastName?: string } }; reviewPeriod: { from: string; to: string; type: string }; finalRating?: number; grade?: string; status: string; createdAt: string }

export default function PerformancePage() {
  const qc = useQueryClient()
  const { canManageEmployees } = usePermissions()
  const [modalOpen, setModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  const { data: empData } = useQuery({ queryKey: ['employees-all'], queryFn: () => api.get('/employees?limit=200&status=active').then(r => r.data) })
  const { data, isLoading } = useQuery({
    queryKey: ['performance', page, limit],
    queryFn: () => api.get('/performance', { params: { page, limit } }).then(r => r.data)
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (d: FormData) => api.post('/performance', { employee: d.employee, reviewPeriod: { from: d.periodFrom, to: d.periodTo, type: d.periodType } }),
    onSuccess: () => { toast.success('Review created!'); qc.invalidateQueries({ queryKey: ['performance'] }); setModalOpen(false); reset() },
    onError: (err: unknown) => { const e = err as { response?: { data?: { message?: string } } }; toast.error(e?.response?.data?.message || 'Failed') }
  })

  const RatingStars = ({ rating }: { rating?: number }) => (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`w-4 h-4 ${(rating || 0) >= s ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
      ))}
      {rating && <span className="ml-1 text-sm font-medium text-gray-600">{rating}</span>}
    </div>
  )

  const columns = [
    { header: 'Employee', cell: (r: PerfRecord) => <span className="font-medium">{r.employee?.user?.firstName} {r.employee?.user?.lastName}</span> },
    { header: 'Reviewer', cell: (r: PerfRecord) => `${r.reviewer?.user?.firstName || ''} ${r.reviewer?.user?.lastName || ''}`.trim() || '-' },
    { header: 'Period', cell: (r: PerfRecord) => `${format(new Date(r.reviewPeriod.from), 'MMM d')} - ${format(new Date(r.reviewPeriod.to), 'MMM d, yyyy')}` },
    { header: 'Type', cell: (r: PerfRecord) => <span className="capitalize text-sm">{r.reviewPeriod.type}</span> },
    { header: 'Rating', cell: (r: PerfRecord) => <RatingStars rating={r.finalRating} /> },
    { header: 'Grade', cell: (r: PerfRecord) => r.grade ? <span className="font-bold text-lg text-primary-600">{r.grade}</span> : '-' },
    { header: 'Status', cell: (r: PerfRecord) => getStatusBadge(r.status) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Performance</h1>
          <p className="page-subtitle">Employee performance reviews and ratings</p>
        </div>
        {canManageEmployees && (
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Create Review
          </button>
        )}
      </div>

      <Table columns={columns} data={data?.data || []} loading={isLoading}
        pagination={data?.pagination ? { ...data.pagination, onPageChange: setPage, onLimitChange: () => {} } : undefined}
        rowKey={r => r._id}
      />

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); reset() }} title="Create Performance Review" footer={
        <>
          <button onClick={() => { setModalOpen(false); reset() }} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit(d => mutation.mutate(d))} disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? 'Creating...' : 'Create Review'}
          </button>
        </>
      }>
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Employee *</label>
            <select {...register('employee')} className={`input ${errors.employee ? 'input-error' : ''}`}>
              <option value="">Select Employee</option>
              {(empData?.data || []).map((e: { _id: string; user?: { firstName?: string; lastName?: string } }) => (
                <option key={e._id} value={e._id}>{e.user?.firstName} {e.user?.lastName}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Review Period Type *</label>
            <select {...register('periodType')} className="input">
              <option value="">Select</option>
              {['monthly','quarterly','half_yearly','annual'].map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">From *</label>
              <input {...register('periodFrom')} type="date" className="input" />
            </div>
            <div className="form-group">
              <label className="label">To *</label>
              <input {...register('periodTo')} type="date" className="input" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
