import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import { Table } from '../../components/ui/Table'
import { StatusBadge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { usePermissions } from '../../hooks/usePermissions'
import type { Performance } from '../../types'
import { format } from 'date-fns'
import { Plus, Star, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PerformancePage() {
  const qc = useQueryClient()
  const { canManageEmployees } = usePermissions()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [viewReview, setViewReview] = useState<Performance | null>(null)
  const [form, setForm] = useState({ employee: '', reviewer: '', periodFrom: '', periodTo: '', periodType: 'annual' })
  const [selfForm, setSelfForm] = useState({ achievements: '', areasForImprovement: '', overallRating: 3 })

  const { data: employees } = useQuery({ queryKey: ['employees-list'], queryFn: () => api.get('/employees?limit=200').then(r => r.data.data) })
  const { data, isLoading } = useQuery({
    queryKey: ['performance', page, statusFilter],
    queryFn: () => api.get('/performance', { params: { page, limit: 15, status: statusFilter } }).then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) => api.post('/performance', { employee: payload.employee, reviewer: payload.reviewer, reviewPeriod: { from: payload.periodFrom, to: payload.periodTo, type: payload.periodType } }),
    onSuccess: () => { toast.success('Review created'); qc.invalidateQueries({ queryKey: ['performance'] }); setCreateOpen(false) },
    onError: (err: unknown) => { const e = err as { response?: { data?: { message?: string } } }; toast.error(e?.response?.data?.message || 'Failed') },
  })

  const submitSelfMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { achievements?: string; areasForImprovement?: string; overallRating?: number } }) => api.put('/performance/' + id + '/self-assessment', data),
    onSuccess: () => { toast.success('Self assessment submitted'); qc.invalidateQueries({ queryKey: ['performance'] }); setViewReview(null) },
  })

  const PERIOD_TYPES = ['annual', 'semi_annual', 'quarterly', 'probation']
  const STATUSES = ['draft', 'submitted', 'reviewed', 'acknowledged']

  return (
    <div className='space-y-5 animate-fade-in'>
      <div className='flex items-start justify-between'>
        <div><h1 className='page-title'>Performance</h1><p className='page-subtitle'>Manage performance reviews</p></div>
        {canManageEmployees && <button onClick={() => setCreateOpen(true)} className='btn-primary btn-sm'><Plus className='w-4 h-4' /> Create Review</button>}
      </div>
      <div className='card !p-4'>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className='input text-sm'>
          <option value=''>All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <Table
        columns={[
          { header: 'Employee', cell: (r: Performance) => <div><p className='font-semibold text-sm'>{r.employee?.user?.firstName} {r.employee?.user?.lastName}</p><p className='text-xs text-gray-400'>{r.employee?.employeeId}</p></div> },
          { header: 'Reviewer', cell: (r: Performance) => <span>{r.reviewer?.user?.firstName} {r.reviewer?.user?.lastName}</span> },
          { header: 'Period', cell: (r: Performance) => <span>{r.reviewPeriod?.type} {r.reviewPeriod?.from ? format(new Date(r.reviewPeriod.from), 'MMM yyyy') : '-'}</span> },
          { header: 'Rating', cell: (r: Performance) => r.finalRating ? (<div className='flex items-center gap-1'><Star className='w-4 h-4 fill-amber-400 text-amber-400' /><span className='font-semibold'>{r.finalRating}/5</span></div>) : <span className='text-gray-400'>Pending</span> },
          { header: 'Status', cell: (r: Performance) => <StatusBadge status={r.status} /> },
          { header: 'Created', cell: (r: Performance) => <span>{format(new Date(r.createdAt), 'MMM d, yyyy')}</span> },
          { header: 'Actions', cell: (r: Performance) => <button onClick={() => { setViewReview(r); setSelfForm({ achievements: r.selfAssessment?.achievements || '', areasForImprovement: r.selfAssessment?.areasForImprovement || '', overallRating: r.selfAssessment?.overallRating || 3 }) }} className='p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-primary-600'><Eye className='w-4 h-4' /></button> },
        ]}
        data={data?.data ?? []}
        loading={isLoading}
        pagination={data?.pagination ? { ...data.pagination, onPageChange: setPage, onLimitChange: () => {} } : undefined}
        rowKey={r => r._id}
      />
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title='Create Review' size='md'
        footer={<><button onClick={() => setCreateOpen(false)} className='btn-secondary btn-sm'>Cancel</button><button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className='btn-primary btn-sm'>Create</button></>}>
        <div className='grid grid-cols-2 gap-4'>
          <div className='form-group col-span-2'><label className='label'>Employee</label><select value={form.employee} onChange={e => setForm(p => ({ ...p, employee: e.target.value }))} className='input'><option value=''>Select</option>{(employees ?? []).map((e: { _id: string; user?: { firstName?: string; lastName?: string } }) => <option key={e._id} value={e._id}>{e.user?.firstName} {e.user?.lastName}</option>)}</select></div>
          <div className='form-group col-span-2'><label className='label'>Reviewer</label><select value={form.reviewer} onChange={e => setForm(p => ({ ...p, reviewer: e.target.value }))} className='input'><option value=''>Select</option>{(employees ?? []).map((e: { _id: string; user?: { firstName?: string; lastName?: string } }) => <option key={e._id} value={e._id}>{e.user?.firstName} {e.user?.lastName}</option>)}</select></div>
          <div className='form-group'><label className='label'>Period Type</label><select value={form.periodType} onChange={e => setForm(p => ({ ...p, periodType: e.target.value }))} className='input'>{PERIOD_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}</select></div>
          <div className='form-group'><label className='label'>From</label><input type='date' value={form.periodFrom} onChange={e => setForm(p => ({ ...p, periodFrom: e.target.value }))} className='input' /></div>
          <div className='form-group'><label className='label'>To</label><input type='date' value={form.periodTo} onChange={e => setForm(p => ({ ...p, periodTo: e.target.value }))} className='input' /></div>
        </div>
      </Modal>
      {viewReview && (
        <Modal isOpen={!!viewReview} onClose={() => setViewReview(null)} title='Review Details' size='lg'
          footer={<><button onClick={() => setViewReview(null)} className='btn-secondary btn-sm'>Close</button>{viewReview.status === 'draft' && <button onClick={() => submitSelfMutation.mutate({ id: viewReview._id, data: selfForm })} disabled={submitSelfMutation.isPending} className='btn-primary btn-sm'>Submit Self Assessment</button>}</>}>
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl'>
              <div><p className='text-xs text-gray-500'>Employee</p><p className='font-semibold'>{viewReview.employee?.user?.firstName} {viewReview.employee?.user?.lastName}</p></div>
              <div><p className='text-xs text-gray-500'>Reviewer</p><p className='font-semibold'>{viewReview.reviewer?.user?.firstName} {viewReview.reviewer?.user?.lastName}</p></div>
            </div>
            {viewReview.status === 'draft' ? (
              <div className='space-y-3'>
                <div className='form-group'><label className='label'>Achievements</label><textarea value={selfForm.achievements} onChange={e => setSelfForm(p => ({ ...p, achievements: e.target.value }))} className='input' rows={3} /></div>
                <div className='form-group'><label className='label'>Areas for Improvement</label><textarea value={selfForm.areasForImprovement} onChange={e => setSelfForm(p => ({ ...p, areasForImprovement: e.target.value }))} className='input' rows={3} /></div>
              </div>
            ) : (
              <div className='space-y-2 text-sm'>
                <p><strong>Achievements:</strong> {viewReview.selfAssessment?.achievements || '-'}</p>
                <p><strong>Self Rating:</strong> {viewReview.selfAssessment?.overallRating ?? '-'}/5</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}