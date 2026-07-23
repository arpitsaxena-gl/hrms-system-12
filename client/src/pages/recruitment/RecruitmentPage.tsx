import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import { Table } from '../../components/ui/Table'
import { Modal } from '../../components/ui/Modal'
import { StatusBadge } from '../../components/ui/Badge'
import { usePermissions } from '../../hooks/usePermissions'
import { Plus, Edit2, Trash2, Users, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const EMPTY_JOB = { title: '', department: '', location: '', jobType: 'full_time', experienceMin: '', experienceMax: '', salaryMin: '', salaryMax: '', description: '', requirements: '', deadline: '' }
const JOB_TYPES = ['full_time', 'part_time', 'contract', 'intern', 'freelance']

export default function RecruitmentPage() {
  const qc = useQueryClient()
  const { canManageEmployees } = usePermissions()
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications'>('jobs')
  const [jobPage, setJobPage] = useState(1)
  const [appPage, setAppPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<any>(null)
  const [form, setForm] = useState(EMPTY_JOB)
  const [statusFilter, setStatusFilter] = useState('')

  const { data: depts } = useQuery({ queryKey: ['depts-list'], queryFn: () => api.get('/departments?limit=100').then(r => r.data.data) })

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs', jobPage, limit],
    queryFn: () => api.get('/recruitment/jobs', { params: { page: jobPage, limit } }).then(r => r.data),
    enabled: activeTab === 'jobs',
  })

  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ['applications', appPage, limit, statusFilter],
    queryFn: () => api.get('/recruitment/applications', { params: { page: appPage, limit, status: statusFilter || undefined } }).then(r => r.data),
    enabled: activeTab === 'applications',
  })

  const jobMutation = useMutation({
    mutationFn: (d: any) => editingJob ? api.put(`/recruitment/jobs/${editingJob._id}`, d) : api.post('/recruitment/jobs', d),
    onSuccess: () => { toast.success(editingJob ? 'Updated!' : 'Job posted!'); qc.invalidateQueries({ queryKey: ['jobs'] }); setModalOpen(false) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  })

  const deleteJobMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/recruitment/jobs/${id}`),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['jobs'] }) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  })

  const updateAppStatus = useMutation({
    mutationFn: ({ id, status }: any) => api.put(`/recruitment/applications/${id}/status`, { status }),
    onSuccess: () => { toast.success('Status updated!'); qc.invalidateQueries({ queryKey: ['applications'] }) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const openCreate = () => { setEditingJob(null); setForm(EMPTY_JOB); setModalOpen(true) }
  const openEdit = (job: any) => {
    setEditingJob(job)
    setForm({ title: job.title, department: job.department?._id ?? '', location: job.location ?? '', jobType: job.jobType, experienceMin: String(job.experience?.min ?? ''), experienceMax: String(job.experience?.max ?? ''), salaryMin: String(job.salaryRange?.min ?? ''), salaryMax: String(job.salaryRange?.max ?? ''), description: job.description ?? '', requirements: (job.requirements ?? []).join('\n'), deadline: job.applicationDeadline ? job.applicationDeadline.split('T')[0] : '' })
    setModalOpen(true)
  }

  const jobColumns = [
    { header: 'Job Title', cell: (j: any) => (<div><p className="font-semibold text-gray-900">{j.title}</p><p className="text-xs text-gray-400">{j.jobType?.replace('_', ' ')}</p></div>) },
    { header: 'Department', cell: (j: any) => j.department?.name ?? '—' },
    { header: 'Location', cell: (j: any) => j.location ?? '—' },
    { header: 'Applications', cell: (j: any) => <span className="font-semibold text-primary-600">{j.applicationCount ?? 0}</span> },
    { header: 'Deadline', cell: (j: any) => j.applicationDeadline ? format(new Date(j.applicationDeadline), 'MMM d, yyyy') : '—' },
    { header: 'Status', cell: (j: any) => <StatusBadge status={j.status} /> },
    { header: 'Actions', cell: (j: any) => canManageEmployees ? (
      <div className="flex gap-1">
        <button onClick={() => openEdit(j)} className="p-1.5 rounded hover:bg-amber-50 text-gray-400 hover:text-amber-600"><Edit2 className="w-4 h-4" /></button>
        <button onClick={() => { if (confirm('Delete job?')) deleteJobMutation.mutate(j._id) }} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
      </div>
    ) : null },
  ]

  const appColumns = [
    { header: 'Applicant', cell: (a: any) => (<div><p className="font-semibold text-gray-900">{a.applicant?.firstName} {a.applicant?.lastName}</p><p className="text-xs text-gray-400">{a.applicant?.email}</p></div>) },
    { header: 'Job', cell: (a: any) => a.job?.title ?? '—' },
    { header: 'Applied', cell: (a: any) => a.appliedDate ? format(new Date(a.appliedDate), 'MMM d, yyyy') : '—' },
    { header: 'Stage', cell: (a: any) => <span className="capitalize text-sm text-gray-700">{a.currentStage?.replace(/_/g, ' ')}</span> },
    { header: 'Status', cell: (a: any) => <StatusBadge status={a.status} /> },
    { header: 'Actions', cell: (a: any) => canManageEmployees ? (
      <select value={a.status} onChange={e => updateAppStatus.mutate({ id: a._id, status: e.target.value })} className="input !py-1 !text-xs w-28">
        {['applied','shortlisted','interview_scheduled','offer_extended','hired','rejected'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
      </select>
    ) : null },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div><h1 className="page-title">Recruitment</h1><p className="page-subtitle">Manage jobs and applications</p></div>
        {canManageEmployees && activeTab === 'jobs' && (
          <button onClick={openCreate} className="btn-primary btn-sm"><Plus className="w-4 h-4" /> Post Job</button>
        )}
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {[{ key: 'jobs', label: 'Job Postings', icon: Briefcase }, { key: 'applications', label: 'Applications', icon: Users }].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key as 'jobs' | 'applications')} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {activeTab === 'applications' && (
        <div className="card !p-4">
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setAppPage(1) }} className="input w-44">
            <option value="">All Status</option>
            {['applied','shortlisted','interview_scheduled','offer_extended','hired','rejected'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      )}

      {activeTab === 'jobs' ? (
        <Table columns={jobColumns} data={jobsData?.data ?? []} loading={jobsLoading} rowKey={(j: any) => j._id}
          pagination={jobsData?.pagination ? { ...jobsData.pagination, onPageChange: setJobPage, onLimitChange: (l: number) => { setLimit(l); setJobPage(1) } } : undefined} />
      ) : (
        <Table columns={appColumns} data={appsData?.data ?? []} loading={appsLoading} rowKey={(a: any) => a._id}
          pagination={appsData?.pagination ? { ...appsData.pagination, onPageChange: setAppPage, onLimitChange: (l: number) => { setLimit(l); setAppPage(1) } } : undefined} />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingJob ? 'Edit Job' : 'Post New Job'} size="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary btn-sm">Cancel</button>
            <button onClick={() => jobMutation.mutate({ title: form.title, department: form.department || undefined, location: form.location, jobType: form.jobType, experience: { min: Number(form.experienceMin) || 0, max: Number(form.experienceMax) || 0 }, salaryRange: form.salaryMin ? { min: Number(form.salaryMin), max: Number(form.salaryMax) } : undefined, description: form.description, requirements: form.requirements.split('\n').filter(Boolean), applicationDeadline: form.deadline || undefined })} disabled={jobMutation.isPending} className="btn-primary btn-sm">
              {jobMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group col-span-2"><label className="label">Job Title *</label><input value={form.title} onChange={set('title')} className="input" placeholder="Software Engineer" /></div>
            <div className="form-group"><label className="label">Department</label>
              <select value={form.department} onChange={set('department')} className="input">
                <option value="">Select</option>
                {(depts ?? []).map((d: any) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="label">Job Type</label>
              <select value={form.jobType} onChange={set('jobType')} className="input">
                {JOB_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="label">Location</label><input value={form.location} onChange={set('location')} className="input" placeholder="Remote / Mumbai" /></div>
            <div className="form-group"><label className="label">Deadline</label><input type="date" value={form.deadline} onChange={set('deadline')} className="input" /></div>
            <div className="form-group"><label className="label">Min Experience (yrs)</label><input type="number" value={form.experienceMin} onChange={set('experienceMin')} className="input" /></div>
            <div className="form-group"><label className="label">Max Experience (yrs)</label><input type="number" value={form.experienceMax} onChange={set('experienceMax')} className="input" /></div>
            <div className="form-group"><label className="label">Min Salary</label><input type="number" value={form.salaryMin} onChange={set('salaryMin')} className="input" /></div>
            <div className="form-group"><label className="label">Max Salary</label><input type="number" value={form.salaryMax} onChange={set('salaryMax')} className="input" /></div>
          </div>
          <div className="form-group"><label className="label">Description</label><textarea value={form.description} onChange={set('description')} className="input resize-none" rows={3} /></div>
          <div className="form-group"><label className="label">Requirements (one per line)</label><textarea value={form.requirements} onChange={set('requirements')} className="input resize-none" rows={3} placeholder="5+ years experience" /></div>
        </div>
      </Modal>
    </div>
  )
}
