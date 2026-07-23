import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import { Table } from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import { getStatusBadge } from '../../components/ui/Badge'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { usePermissions } from '../../hooks/usePermissions'

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  code: z.string().min(1, 'Code required'),
  type: z.string().min(1, 'Type required'),
  startTime: z.string().min(1, 'Start time required'),
  endTime: z.string().min(1, 'End time required'),
  breakDuration: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface ShiftRecord { _id: string; name: string; code: string; type: string; startTime: string; endTime: string; breakDuration: number; workHours: number; weeklyOff: string[]; isActive: boolean }

export default function ShiftsPage() {
  const qc = useQueryClient()
  const { canManageEmployees } = usePermissions()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ShiftRecord | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => api.get('/shifts?limit=50').then(r => r.data)
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (d: FormData) => editing
      ? api.put(`/shifts/${editing._id}`, { ...d, breakDuration: d.breakDuration ? Number(d.breakDuration) : 30 })
      : api.post('/shifts', { ...d, breakDuration: d.breakDuration ? Number(d.breakDuration) : 30 }),
    onSuccess: () => { toast.success(editing ? 'Shift updated!' : 'Shift created!'); qc.invalidateQueries({ queryKey: ['shifts'] }); setModalOpen(false); setEditing(null); reset() },
    onError: (err: unknown) => { const e = err as { response?: { data?: { message?: string } } }; toast.error(e?.response?.data?.message || 'Failed') }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/shifts/${id}`),
    onSuccess: () => { toast.success('Shift deleted'); qc.invalidateQueries({ queryKey: ['shifts'] }) }
  })

  const columns = [
    { header: 'Name', cell: (r: ShiftRecord) => <span className="font-medium text-gray-900">{r.name}</span> },
    { header: 'Code', cell: (r: ShiftRecord) => <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{r.code}</span> },
    { header: 'Type', cell: (r: ShiftRecord) => <span className="capitalize text-sm">{r.type}</span> },
    { header: 'Start Time', cell: (r: ShiftRecord) => <span className="font-medium">{r.startTime}</span> },
    { header: 'End Time', cell: (r: ShiftRecord) => <span className="font-medium">{r.endTime}</span> },
    { header: 'Break', cell: (r: ShiftRecord) => `${r.breakDuration}m` },
    { header: 'Work Hours', cell: (r: ShiftRecord) => `${r.workHours}h` },
    { header: 'Weekly Off', cell: (r: ShiftRecord) => (r.weeklyOff || []).join(', ') || '-' },
    { header: 'Status', cell: (r: ShiftRecord) => getStatusBadge(r.isActive ? 'active' : 'inactive') },
    { header: 'Actions', cell: (r: ShiftRecord) => canManageEmployees ? (
      <div className="flex items-center gap-1">
        <button onClick={() => { setEditing(r); reset({ name: r.name, code: r.code, type: r.type, startTime: r.startTime, endTime: r.endTime, breakDuration: r.breakDuration.toString() }); setModalOpen(true) }} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-amber-600"><Edit2 className="w-4 h-4" /></button>
        <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(r._id) }} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
      </div>
    ) : null }
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Shifts</h1>
          <p className="page-subtitle">Manage work shift configurations</p>
        </div>
        {canManageEmployees && (
          <button onClick={() => { setEditing(null); reset(); setModalOpen(true) }} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Shift
          </button>
        )}
      </div>

      <Table columns={columns} data={data?.data || []} loading={isLoading} rowKey={r => r._id} />

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); reset() }} title={editing ? 'Edit Shift' : 'Add Shift'} footer={
        <>
          <button onClick={() => { setModalOpen(false); setEditing(null); reset() }} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit(d => mutation.mutate(d))} disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? 'Saving...' : (editing ? 'Update' : 'Create')}
          </button>
        </>
      }>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Name *</label>
              <input {...register('name')} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Morning Shift" />
            </div>
            <div className="form-group">
              <label className="label">Code *</label>
              <input {...register('code')} className={`input ${errors.code ? 'input-error' : ''}`} placeholder="MS" />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Type *</label>
            <select {...register('type')} className="input">
              <option value="">Select</option>
              {['fixed','flexible','rotational'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Start Time *</label>
              <input {...register('startTime')} className="input" placeholder="09:00" />
            </div>
            <div className="form-group">
              <label className="label">End Time *</label>
              <input {...register('endTime')} className="input" placeholder="18:00" />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Break Duration (minutes)</label>
            <input {...register('breakDuration')} type="number" className="input" placeholder="60" />
          </div>
        </div>
      </Modal>
    </div>
  )
}
