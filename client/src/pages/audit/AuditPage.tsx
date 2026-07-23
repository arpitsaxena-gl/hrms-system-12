import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import { Table } from '../../components/ui/Table'
import { Search, Shield } from 'lucide-react'
import { format } from 'date-fns'

const MODULES = ['employee','attendance','leave','payroll','department','designation','user','settings','recruitment','performance','training','document']
const ACTIONS = ['create','update','delete','login','logout','approve','reject','process']
const ACTION_COLORS: Record<string, string> = { create: 'text-emerald-600 bg-emerald-50', update: 'text-blue-600 bg-blue-50', delete: 'text-red-600 bg-red-50', login: 'text-purple-600 bg-purple-50', logout: 'text-gray-600 bg-gray-50', approve: 'text-teal-600 bg-teal-50', reject: 'text-orange-600 bg-orange-50', process: 'text-indigo-600 bg-indigo-50' }

export default function AuditPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [module, setModule] = useState('')
  const [action, setAction] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['audit', page, limit, module, action, search, startDate, endDate],
    queryFn: () => api.get('/audit', { params: { page, limit, module: module || undefined, action: action || undefined, search: search || undefined, startDate: startDate || undefined, endDate: endDate || undefined } }).then(r => r.data),
  })

  const columns = [
    { header: 'User', cell: (a: any) => (
      <div>
        <p className="font-medium text-sm text-gray-900">{a.user?.firstName} {a.user?.lastName}</p>
        <p className="text-xs text-gray-400">{a.user?.email}</p>
      </div>
    )},
    { header: 'Action', cell: (a: any) => (
      <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${ACTION_COLORS[a.action] ?? 'text-gray-600 bg-gray-50'}`}>{a.action}</span>
    )},
    { header: 'Module', cell: (a: any) => <span className="capitalize text-sm text-gray-700">{a.module}</span> },
    { header: 'Description', cell: (a: any) => <span className="text-sm text-gray-600 max-w-xs truncate block">{a.description}</span> },
    { header: 'IP Address', cell: (a: any) => <span className="font-mono text-xs text-gray-500">{a.ipAddress ?? '—'}</span> },
    { header: 'Timestamp', cell: (a: any) => a.createdAt ? (
      <div>
        <p className="text-sm text-gray-700">{format(new Date(a.createdAt), 'MMM d, yyyy')}</p>
        <p className="text-xs text-gray-400">{format(new Date(a.createdAt), 'HH:mm:ss')}</p>
      </div>
    ) : '—' },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-600" />
            <h1 className="page-title">Audit Logs</h1>
          </div>
          <p className="page-subtitle">{data?.pagination?.total ?? 0} total events</p>
        </div>
      </div>

      <div className="card !p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1) } }} className="input pl-9 w-48" placeholder="Search user..." />
          </div>
          <select value={module} onChange={e => { setModule(e.target.value); setPage(1) }} className="input w-36">
            <option value="">All Modules</option>
            {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={action} onChange={e => { setAction(e.target.value); setPage(1) }} className="input w-32">
            <option value="">All Actions</option>
            {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1) }} className="input w-36" title="Start Date" />
          <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1) }} className="input w-36" title="End Date" />
          {(module || action || search || startDate || endDate) && (
            <button onClick={() => { setModule(''); setAction(''); setSearch(''); setSearchInput(''); setStartDate(''); setEndDate(''); setPage(1) }} className="btn-secondary btn-sm">Clear</button>
          )}
        </div>
      </div>

      <Table columns={columns} data={data?.data ?? []} loading={isLoading} rowKey={(a: any) => a._id}
        pagination={data?.pagination ? { ...data.pagination, onPageChange: setPage, onLimitChange: (l: number) => { setLimit(l); setPage(1) } } : undefined} />
    </div>
  )
}
