import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import { Table } from '../../components/ui/Table'
import { format } from 'date-fns'
import { Shield } from 'lucide-react'

interface AuditRecord { _id: string; user?: { firstName?: string; lastName?: string; email?: string }; action: string; module: string; description: string; ipAddress?: string; createdAt: string }

const actionColor = (action: string) => {
  switch (action) {
    case 'create': return 'bg-emerald-100 text-emerald-700'
    case 'update': return 'bg-blue-100 text-blue-700'
    case 'delete': return 'bg-red-100 text-red-700'
    case 'login': return 'bg-purple-100 text-purple-700'
    case 'logout': return 'bg-gray-100 text-gray-600'
    default: return 'bg-amber-100 text-amber-700'
  }
}

export default function AuditPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [module, setModule] = useState('')
  const [action, setAction] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['audit', page, limit, module, action, dateFrom, dateTo],
    queryFn: () => api.get('/audit', { params: { page, limit, module: module || undefined, action: action || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined } }).then(r => r.data)
  })

  const modules = ['auth','employee','department','designation','attendance','leave','payroll','recruitment','performance','training','document','holiday','shift','user','settings']
  const actions = ['create','update','delete','login','logout','approve','reject','view']

  const columns = [
    { header: 'User', cell: (r: AuditRecord) => (
      <div>
        <p className="text-sm font-medium">{r.user?.firstName} {r.user?.lastName}</p>
        <p className="text-xs text-gray-400">{r.user?.email}</p>
      </div>
    )},
    { header: 'Action', cell: (r: AuditRecord) => (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${actionColor(r.action)}`}>
        {r.action}
      </span>
    )},
    { header: 'Module', cell: (r: AuditRecord) => <span className="text-sm capitalize font-medium text-gray-700">{r.module}</span> },
    { header: 'Description', cell: (r: AuditRecord) => <span className="text-sm text-gray-600 max-w-xs truncate block">{r.description}</span> },
    { header: 'IP Address', cell: (r: AuditRecord) => <span className="text-xs text-gray-400 font-mono">{r.ipAddress || '-'}</span> },
    { header: 'Timestamp', cell: (r: AuditRecord) => <span className="text-xs text-gray-500">{format(new Date(r.createdAt), 'MMM d, yyyy HH:mm:ss')}</span> },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="page-title">Audit Logs</h1>
            <p className="page-subtitle">System activity and security logs</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-4">
          <select value={module} onChange={e => { setModule(e.target.value); setPage(1) }} className="input w-40">
            <option value="">All Modules</option>
            {modules.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={action} onChange={e => { setAction(e.target.value); setPage(1) }} className="input w-36">
            <option value="">All Actions</option>
            {actions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 font-medium">From:</label>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }} className="input w-40" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 font-medium">To:</label>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }} className="input w-40" />
          </div>
          {(module || action || dateFrom || dateTo) && (
            <button onClick={() => { setModule(''); setAction(''); setDateFrom(''); setDateTo(''); setPage(1) }} className="btn-secondary btn-sm">Clear Filters</button>
          )}
        </div>
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
