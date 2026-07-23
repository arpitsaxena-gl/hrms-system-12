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
  description: z.string().optional(),
  budget: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface Dept { _id: string; name: string; code: string; description?: string; isActive: boolean; employeeCount?: number; head?: { user?: { firstName?: string; lastName?: string } }; budget?: number }

export default function DepartmentsPage() {
  const qc = useQueryClient()
  const { canManageEmployees } = usePermissions()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Dept | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const { data, isLoading } = useQuery({
    queryKey: ['departments', page, limit],
    queryFn: () => api.get('/departments', { params: { page, limit } }).then(r => r.data)
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (d: FormData) => editing
      ? api.put(`/departments/${editing._id}`, { ...d, budget: d.budget ? Number(d.budget) : undefined })
      : api.post('/departments', { ...d, budget: d.budget ? Number(d.budget) : undefined }),
    onSuccess: () => {
      toast.success(editing ? 'Department updated!' : 'Department created!')
      qc.invalidateQueries({ queryKey: ['departments'] })
      setModalOpen(false); setEditing(null); reset()
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e?.response?.data?.message || 'Failed')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/departments/${id}`),
    onSuccess: () => { toast.success('Department deleted'); qc.invalidateQueries({ queryKey: ['departments'] }) }
  })

  const openEdit = (dept: Dept) => {
    setEditing(dept)
    reset({ name: dept.name, code: dept.code, description: dept.description || '', budget: dept.budget?.toString() || '' })
    setModalOpen(true)
  }

  const columns = [
    { header: 'Name', cell: (r: Dept) => <span className="font-medium text-gray-900">{r.name}</span> },
    { header: 'Code', cell: (r: Dept) => <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{r.code}</span> },
    { header: 'Head', cell: (r: Dept) => r.head?.user ? `${r.head.user.firstName} ${r.head.user.lastName}` : '-' },
    { header: 'Employees', cell: (r: Dept) => <span className="font-medium">{r.employeeCount || 0}</span> },
    { header: 'Budget', cell: (r: Dept) => r.budget ? `Rs.${r.budget.toLocaleString()}` : '-' },
    { header: 'Status', cell: (r: Dept) => getStatusBadge(r.isActive ? 'active' : 'inactive') },
    { header: 'Actions', cell: (r: Dept) => (
      <div className="flex items-center gap-1">
        {canManageEmployees && <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-amber-600 transition-colors"><Edit2 className="w-4 h-4" /></button>}
        {canManageEmployees && <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(r._id) }} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>}
      </div>
    )}
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Departments</h1>
          <p className="page-subtitle">{data?.pagination?.total || 0} departments</p>
        </div>
        {canManageEmployees && (
          <button onClick={() => { setEditing(null); reset(); setModalOpen(true) }} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Department
          </button>
        )}
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
        title={editing ? 'Edit Department' : 'Add Department'}
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
            <input {...register('name')} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Engineering" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div className="form-group">
            <label className="label">Code *</label>
            <input {...register('code')} className={`input ${errors.code ? 'input-error' : ''}`} placeholder="ENG" />
            {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea {...register('description')} className="input resize-none" rows={2} placeholder="Department description..." />
          </div>
          <div className="form-group">
            <label className="label">Budget (Rs.)</label>
            <input {...register('budget')} type="number" className="input" placeholder="1000000" />
          </div>
        </div>
      </Modal>
    </div>
  )
}
