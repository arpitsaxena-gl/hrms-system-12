import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import { Table } from '../../components/ui/Table'
import { Modal } from '../../components/ui/Modal'
import { usePermissions } from '../../hooks/usePermissions'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const EMPTY = { name: '', date: '', type: 'public', description: '', isOptional: false }
const HOLIDAY_TYPES = ['public', 'restricted', 'company', 'religious']
const TYPE_COLORS: Record<string, string> = { public: 'bg-blue-100 text-blue-700', restricted: 'bg-amber-100 text-amber-700', company: 'bg-purple-100 text-purple-700', religious: 'bg-emerald-100 text-emerald-700' }

export default function HolidaysPage() {
  const qc = useQueryClient()
  const { canManageEmployees } = usePermissions()
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(EMPTY)

  const { data, isLoading } = useQuery({
    queryKey: ['holidays', year],
    queryFn: () => api.get('/holidays', { params: { year } }).then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (d: any) => editing ? api.put(`/holidays/${editing._id}`, d) : api.post('/holidays', d),
    onSuccess: () => { toast.success(editing ? 'Updated!' : 'Holiday added!'); qc.invalidateQueries({ queryKey: ['holidays'] }); setModalOpen(false) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/holidays/${id}`),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['holidays'] }) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  })

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModalOpen(true) }
  const openEdit = (h: any) => { setEditing(h); setForm({ name: h.name, date: h.date?.split('T')[0] ?? '', type: h.type, description: h.description ?? '', isOptional: h.isOptional ?? false }); setModalOpen(true) }
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const columns = [
    { header: 'Holiday', cell: (h: any) => (<div><p className="font-semibold text-gray-900">{h.name}</p><p className="text-xs text-gray-400">{h.description}</p></div>) },
    { header: 'Date', cell: (h: any) => h.date ? (<><p className="font-medium">{format(new Date(h.date), 'MMMM d, yyyy')}</p><p className="text-xs text-gray-400">{format(new Date(h.date), 'EEEE')}</p></>) : '—' },
    { header: 'Type', cell: (h: any) => <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${TYPE_COLORS[h.type] ?? 'bg-gray-100 text-gray-700'}`}>{h.type}</span> },
    { header: 'Optional', cell: (h: any) => h.isOptional ? <span className="text-amber-600 text-sm font-medium">Optional</span> : <span className="text-gray-400 text-sm">Mandatory</span> },
    { header: 'Actions', cell: (h: any) => canManageEmployees ? (
      <div className="flex gap-1">
        <button onClick={() => openEdit(h)} className="p-1.5 rounded hover:bg-amber-50 text-gray-400 hover:text-amber-600"><Edit2 className="w-4 h-4" /></button>
        <button onClick={() => { if (confirm('Delete holiday?')) deleteMutation.mutate(h._id) }} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
      </div>
    ) : null },
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div><h1 className="page-title">Holidays</h1><p className="page-subtitle">{data?.data?.length ?? 0} holidays in {year}</p></div>
        <div className="flex gap-2">
          <select value={year} onChange={e => setYear(e.target.value)} className="input w-24">
            {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
          {canManageEmployees && <button onClick={openCreate} className="btn-primary btn-sm"><Plus className="w-4 h-4" /> Add Holiday</button>}
        </div>
      </div>

      <Table columns={columns} data={data?.data ?? []} loading={isLoading} rowKey={(h: any) => h._id} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Holiday' : 'Add Holiday'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary btn-sm">Cancel</button>
            <button onClick={() => saveMutation.mutate({ name: form.name, date: form.date, type: form.type, description: form.description, isOptional: form.isOptional })} disabled={saveMutation.isPending} className="btn-primary btn-sm">
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="form-group"><label className="label">Holiday Name *</label><input value={form.name} onChange={set('name')} className="input" placeholder="Diwali" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="label">Date *</label><input type="date" value={form.date} onChange={set('date')} className="input" /></div>
            <div className="form-group"><label className="label">Type</label>
              <select value={form.type} onChange={set('type')} className="input">
                {HOLIDAY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group"><label className="label">Description</label><input value={form.description} onChange={set('description')} className="input" /></div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isOptional} onChange={e => setForm(f => ({ ...f, isOptional: e.target.checked }))} />
            <span className="text-sm text-gray-700">Optional Holiday</span>
          </label>
        </div>
      </Modal>
    </div>
  )
}
