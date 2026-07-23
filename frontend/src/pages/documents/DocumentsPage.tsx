import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import { Table } from '../../components/ui/Table'
import { getStatusBadge } from '../../components/ui/Badge'
import { format } from 'date-fns'
import { FileText, Download, CheckCircle, XCircle } from 'lucide-react'

interface DocRecord { _id: string; employee: { user?: { firstName?: string; lastName?: string }; employeeId?: string }; title: string; type: string; filename: string; url: string; size?: number; isVerified: boolean; expiryDate?: string; createdAt: string }

export default function DocumentsPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [type, setType] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['documents', page, limit, type],
    queryFn: () => api.get('/documents', { params: { page, limit, type: type || undefined } }).then(r => r.data)
  })

  const columns = [
    { header: 'Document', cell: (r: DocRecord) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <p className="font-medium text-sm text-gray-900">{r.title}</p>
          <p className="text-xs text-gray-400">{r.filename}</p>
        </div>
      </div>
    )},
    { header: 'Employee', cell: (r: DocRecord) => (
      <div>
        <p className="text-sm font-medium">{r.employee?.user?.firstName} {r.employee?.user?.lastName}</p>
        <p className="text-xs text-gray-400">{r.employee?.employeeId}</p>
      </div>
    )},
    { header: 'Type', cell: (r: DocRecord) => <span className="capitalize text-sm">{r.type?.replace('_', ' ')}</span> },
    { header: 'Size', cell: (r: DocRecord) => r.size ? `${(r.size / 1024).toFixed(0)} KB` : '-' },
    { header: 'Verified', cell: (r: DocRecord) => r.isVerified
      ? <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium"><CheckCircle className="w-4 h-4" /> Verified</span>
      : <span className="flex items-center gap-1 text-gray-400 text-xs font-medium"><XCircle className="w-4 h-4" /> Pending</span>
    },
    { header: 'Expiry', cell: (r: DocRecord) => r.expiryDate ? format(new Date(r.expiryDate), 'MMM d, yyyy') : '-' },
    { header: 'Uploaded', cell: (r: DocRecord) => format(new Date(r.createdAt), 'MMM d, yyyy') },
    { header: 'Actions', cell: (r: DocRecord) => (
      <a href={r.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-primary-600 transition-colors inline-flex">
        <Download className="w-4 h-4" />
      </a>
    )}
  ]

  const docTypes = ['resume','id_proof','address_proof','experience_letter','education','certificate','contract','other']

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="page-subtitle">Employee documents and certificates</p>
        </div>
      </div>

      <div className="card">
        <select value={type} onChange={e => { setType(e.target.value); setPage(1) }} className="input max-w-xs">
          <option value="">All Types</option>
          {docTypes.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
        </select>
      </div>

      <Table
        columns={columns}
        data={data?.data || []}
        loading={isLoading}
        pagination={data?.pagination ? { ...data.pagination, onPageChange: setPage, onLimitChange: (l: number) => { setLimit(l); setPage(1) } } : undefined}
        rowKey={r => r._id}
      />
    </div>
  )
}
