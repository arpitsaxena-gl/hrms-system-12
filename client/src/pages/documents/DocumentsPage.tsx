import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import { Table } from '../../components/ui/Table'
import { usePermissions } from '../../hooks/usePermissions'
import { Upload, Download, Trash2, FileText, Image, File } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const getFileIcon = (mimeType?: string) => {
  if (!mimeType) return File
  if (mimeType.includes('image')) return Image
  if (mimeType.includes('pdf') || mimeType.includes('text')) return FileText
  return File
}

const DOC_TYPES = ['general','contract','id_proof','educational','experience','salary_slip','offer_letter','nda','policy']

export default function DocumentsPage() {
  const qc = useQueryClient()
  const { canManageEmployees } = usePermissions()
  const fileRef = useRef<HTMLInputElement>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [docType, setDocType] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState({ title: '', type: 'general', employeeId: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['documents', page, limit, docType],
    queryFn: () => api.get('/documents', { params: { page, limit, type: docType || undefined } }).then(r => r.data),
  })

  const { data: employees } = useQuery({
    queryKey: ['employees-list-docs'],
    queryFn: () => api.get('/employees?limit=200').then(r => r.data.data),
    enabled: canManageEmployees,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}`),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['documents'] }) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  })

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', uploadForm.title || file.name)
      fd.append('type', uploadForm.type)
      if (uploadForm.employeeId) fd.append('employeeId', uploadForm.employeeId)
      await api.post('/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Document uploaded!')
      qc.invalidateQueries({ queryKey: ['documents'] })
      setUploadForm({ title: '', type: 'general', employeeId: '' })
      if (fileRef.current) fileRef.current.value = ''
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const columns = [
    { header: 'Document', cell: (d: any) => {
      const Icon = getFileIcon(d.mimeType)
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600"><Icon className="w-4 h-4" /></div>
          <div><p className="font-medium text-sm text-gray-900">{d.title}</p><p className="text-xs text-gray-400">{d.fileName}</p></div>
        </div>
      )
    }},
    { header: 'Type', cell: (d: any) => <span className="capitalize text-gray-600">{d.type?.replace(/_/g, ' ')}</span> },
    { header: 'Employee', cell: (d: any) => d.employee ? `${d.employee.user?.firstName} ${d.employee.user?.lastName}` : '—' },
    { header: 'Size', cell: (d: any) => d.fileSize ? `${(d.fileSize / 1024).toFixed(1)} KB` : '—' },
    { header: 'Uploaded', cell: (d: any) => d.createdAt ? format(new Date(d.createdAt), 'MMM d, yyyy') : '—' },
    { header: 'Verified', cell: (d: any) => d.isVerified ? <span className="text-emerald-600 font-medium text-sm">✓ Verified</span> : <span className="text-gray-400 text-sm">Pending</span> },
    { header: 'Actions', cell: (d: any) => (
      <div className="flex gap-1">
        <a href={d.url} target="_blank" rel="noreferrer" className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600"><Download className="w-4 h-4" /></a>
        {canManageEmployees && (
          <button onClick={() => { if (confirm('Delete document?')) deleteMutation.mutate(d._id) }} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
        )}
      </div>
    )},
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div><h1 className="page-title">Documents</h1><p className="page-subtitle">Manage employee documents</p></div>
      </div>

      <div className="card">
        <h3 className="section-title">Upload Document</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="form-group"><label className="label">Title</label><input value={uploadForm.title} onChange={e => setUploadForm(f => ({ ...f, title: e.target.value }))} className="input" placeholder="Document title" /></div>
          <div className="form-group"><label className="label">Type</label>
            <select value={uploadForm.type} onChange={e => setUploadForm(f => ({ ...f, type: e.target.value }))} className="input">
              {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          {canManageEmployees && (
            <div className="form-group"><label className="label">Employee</label>
              <select value={uploadForm.employeeId} onChange={e => setUploadForm(f => ({ ...f, employeeId: e.target.value }))} className="input">
                <option value="">My Documents</option>
                {(employees ?? []).map((e: any) => <option key={e._id} value={e._id}>{e.user?.firstName} {e.user?.lastName}</option>)}
              </select>
            </div>
          )}
          <div className="form-group flex items-end">
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-primary w-full">
              {uploading ? 'Uploading...' : <><Upload className="w-4 h-4" /> Choose File</>}
            </button>
            <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" />
          </div>
        </div>
      </div>

      <div className="card !p-4">
        <select value={docType} onChange={e => { setDocType(e.target.value); setPage(1) }} className="input w-40">
          <option value="">All Types</option>
          {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <Table columns={columns} data={data?.data ?? []} loading={isLoading} rowKey={(d: any) => d._id}
        pagination={data?.pagination ? { ...data.pagination, onPageChange: setPage, onLimitChange: (l: number) => { setLimit(l); setPage(1) } } : undefined} />
    </div>
  )
}
