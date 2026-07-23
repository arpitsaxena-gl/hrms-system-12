import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import { Table } from '../../components/ui/Table'
import { Modal } from '../../components/ui/Modal'
import { StatusBadge } from '../../components/ui/Badge'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import type { Designation } from '../../types'
import toast from 'react-hot-toast'

const EMPTY = { name: '', code: '', department: '', level: '3', description: '', salaryMin: '', salaryMax: '' }

export default function DesignationsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Designation | null>(null)
  const [form, setForm] = useState(EMPTY)

  const { data, isLoading } = useQuery({
    queryKey: ['designations', page, limit],
    queryFn: () => api.get('/designations', { params: { page, limit } }).then(r => r.data),
  })
  const { data: depts } = useQuery({ queryKey: ['depts-list'], queryFn: () => api.get('/departments?limit=100').then(r => r.data.data) })

  const saveMutation = useMutation({
    mutationFn: (d: any) => editing ? api.put(`/designations/${editing._id}`, d) : api.post('/designations', d),
    onSuccess: () => { toast.success(editing ? 'Updated!' : 'Created!'); qc.invalidateQueries({ queryKey: ['designations'] }); setModalOpen(false) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/designations/${id}`),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['designations'] }) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  })

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModalOpen(true) }
  const openEdit = (d: Designation) => { setEditing(d); setForm({ name: d.name, code: d.code, department: (d.department as any)?._id ?? '', level: String(d.level), description: d.description ?? '', salaryMin: String(d.salaryRange?.min ?? ''), salaryMax: String(d.salaryRange?.max ?? '') }); setModalOpen(true) }
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const columns = [
    { header: 'Designation', cell: (d: Designation) => (<div><p className="font-semibold text-gray-900">{d.name}</p><p className="text-xs text-gray-400">{d.code}</p></div>) },
    { header: 'Department', cell: (d: Designation) => <span>{d.department?.name ?? '—'}</span> },
    { header: 'Level', cell: (d: Designation) => <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">L{d.level}</span> },
    { header: 'Salary Range', cell: (d: Designation) => d.salaryRange ? <span>₹{(d.salaryRange.min/1000).toFixed(0)}K – ₹{(d.salaryRange.max/1000).toFixed(0)}K</span> : <span className="text-gray-400">—</span> },
    { header: 'Status', cell: (d: Designation) => <StatusBadge status={d.isActive ? 'active' : 'inactive'} /> },
    { header: 'Actions', cell: (d: Designation) => (
      <div className="flex gap-1">
        <button onClick={() => openEdit(d)} className="p-1.5 rounded hover:bg-amber-50 text-gray-400 hover:text-amber-600"><Edit2 className="w-4 h-4" /></button>
        <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(d._id) }} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
      </div>
    )},
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div><h1 className="page-title">Designations</h1><p className="page-subtitle">Manage job titles and levels</p></div>
        <button onClick={openCreate} className="btn-primary btn-sm"><Plus className="w-4 h-4" /> Add Designation</button>
      </div>

      <Table columns={columns} data={data?.data ?? []} loading={isLoading} rowKey={(d: Designation) => d._id}
        pagination={data?.pagination ? { ...data.pagination, onPageChange: setPage, onLimitChange: (l: number) => { setLimit(l); setPage(1) } } : undefined} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Designation' : 'Add Designation'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary btn-sm">Cancel</button>
            <button onClick={() => saveMutation.mutate({ name: form.name, code: form.code.toUpperCase(), department: form.department || undefined, level: Number(form.level), description: form.description, salaryRange: form.salaryMin ? { min: Number(form.salaryMin), max: Number(form.salaryMax), currency: 'INR' } : undefined })} disabled={saveMutation.isPending} className="btn-primary btn-sm">
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="label">Name *</label><input value={form.name} onChange={set('name')} className="input" placeholder="Software Engineer" /></div>
            <div className="form-group"><label className="label">Code *</label><input value={form.code} onChange={set('code')} className="input" placeholder="SE" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="label">Department</label>
              <select value={form.department} onChange={set('department')} className="input">
                <option value="">All Departments</option>
                {(depts ?? []).map((d: any) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="label">Level (1-10)</label><input type="number" min={1} max={10} value={form.level} onChange={set('level')} className="input" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="label">Min Salary (₹)</label><input type="number" value={form.salaryMin} onChange={set('salaryMin')} className="input" /></div>
            <div className="form-group"><label className="label">Max Salary (₹)</label><input type="number" value={form.salaryMax} onChange={set('salaryMax')} className="input" /></div>
          </div>
          <div className="form-group"><label className="label">Description</label><textarea value={form.description} onChange={set('description')} className="input resize-none" rows={2} /></div>
        </div>
      </Modal>
    </div>
  )
}
