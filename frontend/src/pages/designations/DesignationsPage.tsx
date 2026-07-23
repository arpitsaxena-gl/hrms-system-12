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
  department: z.string().optional(),
  level: z.string().optional(),
  description: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface Desig { _id: string; name: string; code: string; department?: { name: string }; level: number; isActive: boolean }

export default function DesignationsPage() {
  const qc = useQueryClient()
  const { canManageEmployees } = usePermissions()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Desig | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [deptFilter, setDeptFilter] = useState('')

  const { data: deptData } = useQuery({ queryKey: ['departments-all'], queryFn: () => api.get('/departments?limit=100').then(r => r.data) })
  const { data, isLoading } = useQuery({
    queryKey: ['designations', page, limit, deptFilter],
    queryFn: () => api.get('/designations', { params: { page, limit, department: deptFilter || undefined } }).then(r => r.data)
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (d: FormData) => editing
      ? api.put(`/designations/${editing._id}`, { ...d, level: d.level ? Number(d.level) : 1 })
      : api.post('/designations', { ...d, level: d.level ? Number(d.level) : 1 }),
    onSuccess: () => {
      toast.success(editing ? 'Designation updated!' : 'Designation created!')
      qc.invalidateQueries({ queryKey: ['designations'] })
      setModalOpen(false); setEditing(null); reset()
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e?.response?.data?.message || 'Failed')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/designations/${id}`),
    onSuccess: () => { toast.success('Designation deleted'); qc.invalidateQueries({ queryKey: ['designations'] }) }
  })

  const columns = [
    { header: 'Name', cell: (r: Desig) => <span className="font-medium text-gray-900">{r.name}</span> },
    { header: 'Code', cell: (r: Desig) => <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{r.code}</span> },
    { header: 'Department', cell: (r: Desig) => r.department?.name || '-' },
    { header: 'Level', cell: (r: Desig) => <span className="font-medium">L{r.level}</span> },
    { header: 'Status', cell: (r: Desig) => getStatusBadge(r.isActive ? 'active' : 'inactive') },
    { header: 'Actions', cell: (r: Desig) => (
      <div className="flex items-center gap-1">
        {canManageEmployees && <button onClick={() => { setEditing(r); reset({ name: r.name, code: r.code, level: r.level.toString() }); setModalOpen(true) }} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-amber-600 transition-colors"><Edit2 className="w-4 h-4" /></button>}
        {canManageEmployees && <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(r._id) }} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>}
      </div>
    )}
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Designations</h1>
          <p className="page-subtitle">{data?.pagination?.total || 0} designations</p>
        </div>
        {canManageEmployees && (
          <button onClick={() => { setEditing(null); reset(); setModalOpen(true) }} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Designation
          </button>
        )}
      </div>

      <div className="card">
        <select value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1) }} className="input max-w-xs">
          <option value="">All Departments</option>
          {(deptData?.data || []).map((d: { _id: string; name: string }) => <option key={d._id} value={d._id}>{d.name}</option>)}
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
        onClose={() => { setModalOpen(false); setEditing(null); reset() }}
        title={editing ? 'Edit Designation' : 'Add Designation'}
        footer={
          <>
            <button onClick={() => { setModalOpen(false); setEditing(null); reset() }} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit(d => mutation.mutate(d))} disabled={mutation.isPending} className="btn-primary">
              {mutation.isPending ? 'Saving...' : (editing ? 'Update' : 'Create')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Name *</label>
            <input {...register('name')} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Software Engineer" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div className="form-group">
            <label className="label">Code *</label>
            <input {...register('code')} className={`input ${errors.code ? 'input-error' : ''}`} placeholder="SE" />
            {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
          </div>
          <div className="form-group">
            <label className="label">Department</label>
            <select {...register('department')} className="input">
              <option value="">Select Department</option>
              {(deptData?.data || []).map((d: { _id: string; name: string }) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Level</label>
            <input {...register('level')} type="number" className="input" placeholder="1" />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea {...register('description')} className="input resize-none" rows={2} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
