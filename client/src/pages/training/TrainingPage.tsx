import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import { Table } from '../../components/ui/Table'
import { Modal } from '../../components/ui/Modal'
import { StatusBadge } from '../../components/ui/Badge'
import { usePermissions } from '../../hooks/usePermissions'
import { Plus, UserPlus, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const EMPTY_FORM = { title: '', description: '', trainer: '', trainingType: 'internal', startDate: '', endDate: '', maxParticipants: '20', location: '', cost: '' }

export default function TrainingPage() {
  const qc = useQueryClient()
  const { canManageEmployees } = usePermissions()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<any>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const { data, isLoading } = useQuery({
    queryKey: ['training', page, limit],
    queryFn: () => api.get('/training', { params: { page, limit } }).then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (d: any) => editingProgram ? api.put(`/training/${editingProgram._id}`, d) : api.post('/training', d),
    onSuccess: () => { toast.success(editingProgram ? 'Updated!' : 'Program created!'); qc.invalidateQueries({ queryKey: ['training'] }); setModalOpen(false) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/training/${id}`),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['training'] }) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  })

  const enrollMutation = useMutation({
    mutationFn: (id: string) => api.post(`/training/${id}/enroll`),
    onSuccess: () => { toast.success('Enrolled successfully!'); qc.invalidateQueries({ queryKey: ['training'] }) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Already enrolled or failed'),
  })

  const openCreate = () => { setEditingProgram(null); setForm(EMPTY_FORM); setModalOpen(true) }
  const openEdit = (p: any) => {
    setEditingProgram(p)
    setForm({ title: p.title, description: p.description ?? '', trainer: p.trainer ?? '', trainingType: p.trainingType, startDate: p.startDate?.split('T')[0] ?? '', endDate: p.endDate?.split('T')[0] ?? '', maxParticipants: String(p.maxParticipants ?? 20), location: p.location ?? '', cost: String(p.cost ?? '') })
    setModalOpen(true)
  }
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const columns = [
    { header: 'Program', cell: (p: any) => (<div><p className="font-semibold text-gray-900">{p.title}</p><p className="text-xs text-gray-400 capitalize">{p.trainingType}</p></div>) },
    { header: 'Trainer', cell: (p: any) => p.trainer ?? '—' },
    { header: 'Duration', cell: (p: any) => p.startDate && p.endDate ? `${format(new Date(p.startDate), 'MMM d')} – ${format(new Date(p.endDate), 'MMM d, yyyy')}` : '—' },
    { header: 'Participants', cell: (p: any) => `${p.enrolledCount ?? 0} / ${p.maxParticipants ?? '∞'}` },
    { header: 'Cost', cell: (p: any) => p.cost ? `₹${p.cost.toLocaleString()}` : 'Free' },
    { header: 'Status', cell: (p: any) => <StatusBadge status={p.status} /> },
    { header: 'Actions', cell: (p: any) => (
      <div className="flex gap-1">
        <button onClick={() => enrollMutation.mutate(p._id)} className="p-1.5 rounded hover:bg-primary-50 text-gray-400 hover:text-primary-600" title="Enroll"><UserPlus className="w-4 h-4" /></button>
        {canManageEmployees && (
          <>
            <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-amber-50 text-gray-400 hover:text-amber-600"><Edit2 className="w-4 h-4" /></button>
            <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(p._id) }} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
          </>
        )}
      </div>
    )},
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div><h1 className="page-title">Training Programs</h1><p className="page-subtitle">Employee learning and development</p></div>
        {canManageEmployees && <button onClick={openCreate} className="btn-primary btn-sm"><Plus className="w-4 h-4" /> Add Program</button>}
      </div>

      <Table columns={columns} data={data?.data ?? []} loading={isLoading} rowKey={(p: any) => p._id}
        pagination={data?.pagination ? { ...data.pagination, onPageChange: setPage, onLimitChange: (l: number) => { setLimit(l); setPage(1) } } : undefined} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingProgram ? 'Edit Program' : 'Add Training Program'} size="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary btn-sm">Cancel</button>
            <button onClick={() => saveMutation.mutate({ title: form.title, description: form.description, trainer: form.trainer, trainingType: form.trainingType, startDate: form.startDate, endDate: form.endDate, maxParticipants: Number(form.maxParticipants), location: form.location, cost: Number(form.cost) || 0 })} disabled={saveMutation.isPending} className="btn-primary btn-sm">
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="form-group"><label className="label">Title *</label><input value={form.title} onChange={set('title')} className="input" placeholder="React Advanced Workshop" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="label">Type</label>
              <select value={form.trainingType} onChange={set('trainingType')} className="input">
                {['internal','external','online','certification'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="label">Trainer / Provider</label><input value={form.trainer} onChange={set('trainer')} className="input" /></div>
            <div className="form-group"><label className="label">Start Date</label><input type="date" value={form.startDate} onChange={set('startDate')} className="input" /></div>
            <div className="form-group"><label className="label">End Date</label><input type="date" value={form.endDate} onChange={set('endDate')} className="input" /></div>
            <div className="form-group"><label className="label">Max Participants</label><input type="number" value={form.maxParticipants} onChange={set('maxParticipants')} className="input" /></div>
            <div className="form-group"><label className="label">Cost (₹)</label><input type="number" value={form.cost} onChange={set('cost')} className="input" /></div>
            <div className="form-group col-span-2"><label className="label">Location / URL</label><input value={form.location} onChange={set('location')} className="input" placeholder="Conference Room A / https://zoom.us/..." /></div>
          </div>
          <div className="form-group"><label className="label">Description</label><textarea value={form.description} onChange={set('description')} className="input resize-none" rows={3} /></div>
        </div>
      </Modal>
    </div>
  )
}
