import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import { Table } from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import { getStatusBadge } from '../../components/ui/Badge'
import { format } from 'date-fns'
import { Plus, Users } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { usePermissions } from '../../hooks/usePermissions'

const schema = z.object({
  title: z.string().min(1, 'Title required'),
  category: z.string().min(1, 'Category required'),
  type: z.string().min(1, 'Type required'),
  startDate: z.string().min(1, 'Start date required'),
  endDate: z.string().min(1, 'End date required'),
  venue: z.string().optional(),
  maxParticipants: z.string().min(1, 'Max participants required'),
  description: z.string().optional(),
  isMandatory: z.boolean().optional(),
})
type FormData = z.infer<typeof schema>

interface TrainingRecord { _id: string; title: string; category: string; type: string; startDate: string; endDate: string; venue?: string; maxParticipants: number; status: string; isMandatory: boolean; participants: unknown[]; createdAt: string }

export default function TrainingPage() {
  const qc = useQueryClient()
  const { canManageEmployees } = usePermissions()
  const [modalOpen, setModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [status, setStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['training', page, limit, status],
    queryFn: () => api.get('/training', { params: { page, limit, status: status || undefined } }).then(r => r.data)
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { isMandatory: false } })

  const mutation = useMutation({
    mutationFn: (d: FormData) => api.post('/training', { ...d, maxParticipants: Number(d.maxParticipants) }),
    onSuccess: () => { toast.success('Training created!'); qc.invalidateQueries({ queryKey: ['training'] }); setModalOpen(false); reset() },
    onError: (err: unknown) => { const e = err as { response?: { data?: { message?: string } } }; toast.error(e?.response?.data?.message || 'Failed') }
  })

  const columns = [
    { header: 'Title', cell: (r: TrainingRecord) => (
      <div>
        <p className="font-medium text-gray-900">{r.title}</p>
        {r.isMandatory && <span className="text-xs text-red-500 font-medium">Mandatory</span>}
      </div>
    )},
    { header: 'Category', cell: (r: TrainingRecord) => <span className="capitalize text-sm">{r.category}</span> },
    { header: 'Type', cell: (r: TrainingRecord) => <span className="capitalize text-sm">{r.type}</span> },
    { header: 'Start Date', cell: (r: TrainingRecord) => format(new Date(r.startDate), 'MMM d, yyyy') },
    { header: 'End Date', cell: (r: TrainingRecord) => format(new Date(r.endDate), 'MMM d, yyyy') },
    { header: 'Venue', cell: (r: TrainingRecord) => r.venue || 'Online' },
    { header: 'Participants', cell: (r: TrainingRecord) => <div className="flex items-center gap-1"><Users className="w-3 h-3 text-gray-400" /><span>{r.participants?.length || 0}/{r.maxParticipants}</span></div> },
    { header: 'Status', cell: (r: TrainingRecord) => getStatusBadge(r.status) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Training</h1>
          <p className="page-subtitle">Manage employee training programs</p>
        </div>
        {canManageEmployees && (
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Create Training
          </button>
        )}
      </div>

      <div className="card">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} className="input max-w-xs">
          <option value="">All Status</option>
          {['upcoming','ongoing','completed','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <Table columns={columns} data={data?.data || []} loading={isLoading}
        pagination={data?.pagination ? { ...data.pagination, onPageChange: setPage, onLimitChange: () => {} } : undefined}
        rowKey={r => r._id}
      />

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); reset() }} title="Create Training Program" size="lg" footer={
        <>
          <button onClick={() => { setModalOpen(false); reset() }} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit(d => mutation.mutate(d))} disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? 'Creating...' : 'Create Training'}
          </button>
        </>
      }>
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Title *</label>
            <input {...register('title')} className={`input ${errors.title ? 'input-error' : ''}`} placeholder="React Advanced Training" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Category *</label>
              <select {...register('category')} className="input">
                <option value="">Select</option>
                {['technical','soft_skills','leadership','compliance','safety'].map(c => <option key={c} value={c}>{c.replace('_',' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Type *</label>
              <select {...register('type')} className="input">
                <option value="">Select</option>
                {['online','offline','hybrid'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Start Date *</label>
              <input {...register('startDate')} type="date" className="input" />
            </div>
            <div className="form-group">
              <label className="label">End Date *</label>
              <input {...register('endDate')} type="date" className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Venue</label>
              <input {...register('venue')} className="input" placeholder="Conference Room A" />
            </div>
            <div className="form-group">
              <label className="label">Max Participants *</label>
              <input {...register('maxParticipants')} type="number" className="input" placeholder="20" />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea {...register('description')} className="input resize-none" rows={2} />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input {...register('isMandatory')} type="checkbox" className="rounded" /> Mark as Mandatory
          </label>
        </div>
      </Modal>
    </div>
  )
}
