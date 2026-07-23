import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import { Table } from '../../components/ui/Table'
import { Modal } from '../../components/ui/Modal'
import { StatusBadge } from '../../components/ui/Badge'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import type { Department } from '../../types'
import toast from 'react-hot-toast'

const EMPTY = { name: '', code: '', description: '', color: '#3B82F6', budget: '', location: '' }

export default function DepartmentsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [form, setForm] = useState(EMPTY)

  const { data, isLoading } = useQuery({
    queryKey: ['departments', page, limit],
    queryFn: () => api.get('/departments', { params: { page, limit } }).then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (d: any) => editing ? api.put(`/departments/${editing._id}`, d) : api.post('/departments', d),
    onSuccess: () => { toast.success(editing ? 'Updated!' : 'Created!'); qc.invalidateQueries({ queryKey: ['departments'] }); setModalOpen(false) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/departments/${id}`),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['departments'] }) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  })

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModalOpen(true) }
  const openEdit = (d: Department) => { setEditing(d); setForm({ name: d.name, code: d.code, description: d.description ?? '', color: d.color ?? '#3B82F6', budget: String(d.budget ?? ''), location: '' }); setModalOpen(true) }
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const columns = [
    { header: 'Department', cell: (d: Department) => (
      <div className="flex items-center gap-3">
        <div className="w-3 h-8 rounded-full" style={{ backgroundColor: d.color }} />
        <div>
          <p className="font-semibold text-gray-900">{d.name}</p>
          <p className="text-xs text-gray-400">{d.code}</p>
        </div>
      </div>
    )},
    { header: 'Description', cell: (d: Department) => <span className="text-gray-600 max-w-xs truncate block">{d.description ?? '—'}</span> },
    { header: 'Head', cell: (d: Department) => d.head ? <span>{(d.head as any).user?.firstName} {(d.head as any).user?.lastName}</span> : <span className="text-gray-400">—</span> },
    { header: 'Status', cell: (d: Department) => <StatusBadge status={d.isActive ? 'active' : 'inactive'} /> },
    { header: 'Actions', cell: (d: Department) => (
      <div className="flex gap-1">
        <button onClick={() => openEdit(d)} className="p-1.5 rounded hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
        <button onClick={() => { if (confirm('Delete department?')) deleteMutation.mutate(d._id) }} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
      </div>
    )},
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div><h1 className="page-title">Departments</h1><p className="page-subtitle">Manage organizational departments</p></div>
        <button onClick={openCreate} className="btn-primary btn-sm"><Plus className="w-4 h-4" /> Add Department</button>
      </div>

      <Table columns={columns} data={data?.data ?? []} loading={isLoading} rowKey={(d: Department) => d._id}
        pagination={data?.pagination ? { ...data.pagination, onPageChange: setPage, onLimitChange: (l: number) => { setLimit(l); setPage(1) } } : undefined} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Department' : 'Add Department'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary btn-sm">Cancel</button>
            <button onClick={() => saveMutation.mutate({ name: form.name, code: form.code.toUpperCase(), description: form.description, color: form.color, budget: Number(form.budget) || 0 })} disabled={saveMutation.isPending} className="btn-primary btn-sm">
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="label">Name *</label><input value={form.name} onChange={set('name')} className="input" placeholder="Engineering" /></div>
            <div className="form-group"><label className="label">Code *</label><input value={form.code} onChange={set('code')} className="input" placeholder="ENG" /></div>
          </div>
          <div className="form-group"><label className="label">Description</label><textarea value={form.description} onChange={set('description')} className="input resize-none" rows={2} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="label">Color</label><input type="color" value={form.color} onChange={set('color')} className="input h-10" /></div>
            <div className="form-group"><label className="label">Budget (₹)</label><input type="number" value={form.budget} onChange={set('budget')} className="input" placeholder="1000000" /></div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
