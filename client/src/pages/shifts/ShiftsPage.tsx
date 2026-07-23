import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import { Table } from '../../components/ui/Table'
import { Modal } from '../../components/ui/Modal'
import { StatusBadge } from '../../components/ui/Badge'
import { usePermissions } from '../../hooks/usePermissions'
import { Plus, Edit2, Trash2, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY = { name: '', code: '', startTime: '09:00', endTime: '18:00', graceTime: '15', breakDuration: '60', workingDays: ['monday','tuesday','wednesday','thursday','friday'] }
const ALL_DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']

export default function ShiftsPage() {
  const qc = useQueryClient()
  const { canManageEmployees } = usePermissions()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(EMPTY)

  const { data, isLoading } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => api.get('/shifts').then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (d: any) => editing ? api.put(`/shifts/${editing._id}`, d) : api.post('/shifts', d),
    onSuccess: () => { toast.success(editing ? 'Updated!' : 'Shift created!'); qc.invalidateQueries({ queryKey: ['shifts'] }); setModalOpen(false) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/shifts/${id}`),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['shifts'] }) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  })

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModalOpen(true) }
  const openEdit = (s: any) => { setEditing(s); setForm({ name: s.name, code: s.code, startTime: s.startTime, endTime: s.endTime, graceTime: String(s.graceTime ?? 15), breakDuration: String(s.breakDuration ?? 60), workingDays: s.workingDays ?? ALL_DAYS.slice(0,5) }); setModalOpen(true) }
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))
  const toggleDay = (day: string) => setForm(f => ({ ...f, workingDays: f.workingDays.includes(day) ? f.workingDays.filter(d => d !== day) : [...f.workingDays, day] }))

  const columns = [
    { header: 'Shift', cell: (s: any) => (<div><p className="font-semibold text-gray-900">{s.name}</p><p className="text-xs text-gray-400">{s.code}</p></div>) },
    { header: 'Time', cell: (s: any) => (
      <div className="flex items-center gap-1.5 text-sm">
        <Clock className="w-3.5 h-3.5 text-gray-400" />
        <span>{s.startTime} – {s.endTime}</span>
      </div>
    )},
    { header: 'Grace (min)', cell: (s: any) => s.graceTime ?? '—' },
    { header: 'Break (min)', cell: (s: any) => s.breakDuration ?? '—' },
    { header: 'Working Days', cell: (s: any) => (
      <div className="flex gap-1">
        {ALL_DAYS.map(d => (
          <span key={d} className={`w-6 h-6 text-xs flex items-center justify-center rounded-full ${(s.workingDays ?? []).includes(d) ? 'bg-primary-100 text-primary-700 font-medium' : 'bg-gray-100 text-gray-400'}`}>
            {d[0].toUpperCase()}
          </span>
        ))}
      </div>
    )},
    { header: 'Status', cell: (s: any) => <StatusBadge status={s.isActive ? 'active' : 'inactive'} /> },
    { header: 'Actions', cell: (s: any) => canManageEmployees ? (
      <div className="flex gap-1">
        <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-amber-50 text-gray-400 hover:text-amber-600"><Edit2 className="w-4 h-4" /></button>
        <button onClick={() => { if (confirm('Delete shift?')) deleteMutation.mutate(s._id) }} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
      </div>
    ) : null },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div><h1 className="page-title">Shifts</h1><p className="page-subtitle">Manage work shifts and schedules</p></div>
        {canManageEmployees && <button onClick={openCreate} className="btn-primary btn-sm"><Plus className="w-4 h-4" /> Add Shift</button>}
      </div>

      <Table columns={columns} data={data?.data ?? []} loading={isLoading} rowKey={(s: any) => s._id} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Shift' : 'Add Shift'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary btn-sm">Cancel</button>
            <button onClick={() => saveMutation.mutate({ name: form.name, code: form.code.toUpperCase(), startTime: form.startTime, endTime: form.endTime, graceTime: Number(form.graceTime), breakDuration: Number(form.breakDuration), workingDays: form.workingDays })} disabled={saveMutation.isPending} className="btn-primary btn-sm">
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="label">Name *</label><input value={form.name} onChange={set('name')} className="input" placeholder="Morning Shift" /></div>
            <div className="form-group"><label className="label">Code *</label><input value={form.code} onChange={set('code')} className="input" placeholder="MRN" /></div>
            <div className="form-group"><label className="label">Start Time *</label><input type="time" value={form.startTime} onChange={set('startTime')} className="input" /></div>
            <div className="form-group"><label className="label">End Time *</label><input type="time" value={form.endTime} onChange={set('endTime')} className="input" /></div>
            <div className="form-group"><label className="label">Grace Period (min)</label><input type="number" value={form.graceTime} onChange={set('graceTime')} className="input" /></div>
            <div className="form-group"><label className="label">Break Duration (min)</label><input type="number" value={form.breakDuration} onChange={set('breakDuration')} className="input" /></div>
          </div>
          <div className="form-group">
            <label className="label">Working Days</label>
            <div className="flex gap-2 flex-wrap">
              {ALL_DAYS.map(day => (
                <button key={day} type="button" onClick={() => toggleDay(day)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${form.workingDays.includes(day) ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'}`}>
                  {day.slice(0,3)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
