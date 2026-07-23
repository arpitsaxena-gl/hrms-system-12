import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import { Table } from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import { getStatusBadge } from '../../components/ui/Badge'
import { format } from 'date-fns'
import { Plus, Briefcase, Users } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { usePermissions } from '../../hooks/usePermissions'

const jobSchema = z.object({
  title: z.string().min(1, 'Title required'),
  department: z.string().min(1, 'Department required'),
  vacancies: z.string().min(1, 'Vacancies required'),
  description: z.string().min(1, 'Description required'),
  jobType: z.string().min(1, 'Job type required'),
  deadline: z.string().optional(),
})
type JobForm = z.infer<typeof jobSchema>

interface Job { _id: string; title: string; department: { name: string }; vacancies: number; status: string; jobType: string; deadline?: string; applicationCount?: number; createdAt: string }
interface App { _id: string; job: { title: string }; applicantName: string; email: string; phone?: string; status: string; experience?: number; source: string; createdAt: string }

export default function RecruitmentPage() {
  const qc = useQueryClient()
  const { canManageEmployees } = usePermissions()
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications'>('jobs')
  const [jobModal, setJobModal] = useState(false)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  const { data: deptData } = useQuery({ queryKey: ['departments-all'], queryFn: () => api.get('/departments?limit=100').then(r => r.data) })
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs', page, limit],
    queryFn: () => api.get('/recruitment/jobs', { params: { page, limit } }).then(r => r.data)
  })
  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ['applications', page, limit],
    queryFn: () => api.get('/recruitment/applications', { params: { page, limit } }).then(r => r.data),
    enabled: activeTab === 'applications'
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<JobForm>({ resolver: zodResolver(jobSchema) })

  const jobMutation = useMutation({
    mutationFn: (d: JobForm) => api.post('/recruitment/jobs', { ...d, vacancies: Number(d.vacancies) }),
    onSuccess: () => { toast.success('Job posted!'); qc.invalidateQueries({ queryKey: ['jobs'] }); setJobModal(false); reset() },
    onError: (err: unknown) => { const e = err as { response?: { data?: { message?: string } } }; toast.error(e?.response?.data?.message || 'Failed') }
  })

  const jobColumns = [
    { header: 'Job Title', cell: (r: Job) => <span className="font-medium text-gray-900">{r.title}</span> },
    { header: 'Department', cell: (r: Job) => r.department?.name },
    { header: 'Type', cell: (r: Job) => <span className="capitalize text-sm">{r.jobType?.replace('_', ' ')}</span> },
    { header: 'Vacancies', cell: (r: Job) => <span className="font-medium">{r.vacancies}</span> },
    { header: 'Applications', cell: (r: Job) => <span className="font-medium text-primary-600">{r.applicationCount || 0}</span> },
    { header: 'Deadline', cell: (r: Job) => r.deadline ? format(new Date(r.deadline), 'MMM d, yyyy') : '-' },
    { header: 'Status', cell: (r: Job) => getStatusBadge(r.status) },
  ]

  const appColumns = [
    { header: 'Applicant', cell: (r: App) => <span className="font-medium text-gray-900">{r.applicantName}</span> },
    { header: 'Job', cell: (r: App) => r.job?.title },
    { header: 'Email', cell: (r: App) => <span className="text-sm text-gray-500">{r.email}</span> },
    { header: 'Experience', cell: (r: App) => r.experience ? `${r.experience} yrs` : '-' },
    { header: 'Source', cell: (r: App) => <span className="capitalize text-sm">{r.source}</span> },
    { header: 'Status', cell: (r: App) => getStatusBadge(r.status) },
    { header: 'Applied', cell: (r: App) => format(new Date(r.createdAt), 'MMM d, yyyy') },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Recruitment</h1>
          <p className="page-subtitle">Manage job postings and applications</p>
        </div>
        {canManageEmployees && activeTab === 'jobs' && (
          <button onClick={() => setJobModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Post Job
          </button>
        )}
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button onClick={() => setActiveTab('jobs')} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === 'jobs' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <Briefcase className="w-4 h-4" /> Job Postings
        </button>
        <button onClick={() => setActiveTab('applications')} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === 'applications' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <Users className="w-4 h-4" /> Applications
        </button>
      </div>

      {activeTab === 'jobs' && (
        <Table columns={jobColumns} data={jobsData?.data || []} loading={jobsLoading}
          pagination={jobsData?.pagination ? { ...jobsData.pagination, onPageChange: setPage, onLimitChange: () => {} } : undefined}
          rowKey={r => r._id}
        />
      )}

      {activeTab === 'applications' && (
        <Table columns={appColumns} data={appsData?.data || []} loading={appsLoading}
          pagination={appsData?.pagination ? { ...appsData.pagination, onPageChange: setPage, onLimitChange: () => {} } : undefined}
          rowKey={r => r._id}
        />
      )}

      <Modal isOpen={jobModal} onClose={() => { setJobModal(false); reset() }} title="Post New Job" footer={
        <>
          <button onClick={() => { setJobModal(false); reset() }} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit(d => jobMutation.mutate(d))} disabled={jobMutation.isPending} className="btn-primary">
            {jobMutation.isPending ? 'Posting...' : 'Post Job'}
          </button>
        </>
      }>
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Job Title *</label>
            <input {...register('title')} className={`input ${errors.title ? 'input-error' : ''}`} placeholder="Senior Developer" />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Department *</label>
              <select {...register('department')} className={`input ${errors.department ? 'input-error' : ''}`}>
                <option value="">Select</option>
                {(deptData?.data || []).map((d: { _id: string; name: string }) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Vacancies *</label>
              <input {...register('vacancies')} type="number" className="input" placeholder="2" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Job Type *</label>
              <select {...register('jobType')} className="input">
                <option value="">Select</option>
                {['full_time','part_time','contract','intern'].map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Application Deadline</label>
              <input {...register('deadline')} type="date" className="input" />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Job Description *</label>
            <textarea {...register('description')} className={`input resize-none ${errors.description ? 'input-error' : ''}`} rows={4} placeholder="Describe the role..." />
          </div>
        </div>
      </Modal>
    </div>
  )
}
