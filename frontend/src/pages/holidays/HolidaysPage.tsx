import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import { Table } from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import { getStatusBadge } from '../../components/ui/Badge'
import { format } from 'date-fns'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { usePermissions } from '../../hooks/usePermissions'

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  date: z.string().min(1, 'Date required'),
  type: z.string().min(1, 'Type required'),
  description: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface HolidayRecord { _id: string; name: string; date: string; type: string; description?: string; year: number }

export default function HolidaysPage() {
  const qc = useQueryClient()
  const { canManageSettings } = usePermissions()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<HolidayRecord | null>(null)
  const [year, setYear] = useState(new Date().getFullYear())

  const { data, isLoading } = useQuery({
    queryKey: ['holidays', year],
    queryFn: () => api.get('/holidays', { params: { year, limit: 50 } }).then(r => r.data)
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (d: FormData) => editing ? api.put(`/holidays/${editing._id}`, d) : api.post('/holidays', d),
    onSuccess: () => { toast.success(editing ? 'Holiday updated!' : 'Holiday added!'); qc.invalidateQueries({ queryKey: ['holidays'] }); setModalOpen(false); setEditing(null); reset() },
    onError: (err: unknown) => { const e = err as { response?: { data?: { message?: string } } }; toast.error(e?.response?.data?.message || 'Failed') }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/holidays/${id}`),
    onSuccess: () => { toast.success('Holiday deleted'); qc.invalidateQueries({ queryKey: ['holidays'] }) }
  })

  const columns = [
    { header: 'Holiday', cell: (r: HolidayRecord) => <span className="font-medium text-gray-900">{r.name}</span> },
    { header: 'Date', cell: (r: HolidayRecord) => format(new Date(r.date), 'EEEE, MMMM d, yyyy') },
    { header: 'Type', cell: (r: HolidayRecord) => getStatusBadge(r.type) },
    { header: 'Description', cell: (r: HolidayRecord) => <span className="text-sm text-gray-500">{r.description || '-'}</span> },
    { header: 'Actions', cell: (r: HolidayRecord) => canManageSettings ? (
      <div className="flex items-center gap-1">
        <button onClick={() => { setEditing(r); reset({ name: r.name, date: r.date.split('T')[0], type: r.type, description: r.description || '' }); setModalOpen(true) }} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-amber-600"><Edit2 className="w-4 h-4" /></button>
        <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(r._id) }} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
      </div>
    ) : null }
  ]

  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - 1 + i)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Holidays</h1>
          <p className="page-subtitle">{data?.data?.length || 0} holidays in {year}</p>
        </div>
        {canManageSettings && (
          <button onClick={() => { setEditing(null); reset(); setModalOpen(true) }} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Holiday
          </button>
        )}
      </div>

      <div className="card">
        <div className="flex gap-2">
          {years.map(y => (
            <button key={y} onClick={() => setYear(y)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${year === y ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{y}</button>
          ))}
        </div>
      </div>

      <Table columns={columns} data={data?.data || []} loading={isLoading} rowKey={r => r._id} />

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); reset() }} title={editing ? 'Edit Holiday' : 'Add Holiday'} footer={
        <>
          <button onClick={() => { setModalOpen(false); setEditing(null); reset() }} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit(d => mutation.mutate(d))} disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? 'Saving...' : (editing ? 'Update' : 'Add')}
          </button>
        </>
      }>
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Holiday Name *</label>
            <input {...register('name')} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Diwali" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Date *</label>
              <input {...register('date')} type="date" className="input" />
            </div>
            <div className="form-group">
              <label className="label">Type *</label>
              <select {...register('type')} className="input">
                <option value="">Select</option>
                <option value="public">Public</option>
                <option value="optional">Optional</option>
                <option value="restricted">Restricted</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <input {...register('description')} className="input" placeholder="Optional description" />
          </div>
        </div>
      </Modal>
    </div>
  )
}
