import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import { Table } from '../../components/ui/Table'
import { StatusBadge } from '../../components/ui/Badge'
import { Avatar } from '../../components/ui/Avatar'
import { usePermissions } from '../../hooks/usePermissions'
import { UserCheck, UserX, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const ROLES = ['employee', 'manager', 'hr', 'admin']
const ROLE_COLORS: Record<string, string> = { admin: 'bg-red-100 text-red-700', hr: 'bg-purple-100 text-purple-700', manager: 'bg-blue-100 text-blue-700', employee: 'bg-gray-100 text-gray-700' }

export default function UsersPage() {
  const qc = useQueryClient()
  const { canManageEmployees } = usePermissions()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [role, setRole] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [status, setStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, limit, role, search, status],
    queryFn: () => api.get('/users', { params: { page, limit, role: role || undefined, search: search || undefined, isActive: status === 'active' ? true : status === 'inactive' ? false : undefined } }).then(r => r.data),
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.put(`/users/${id}`, { isActive }),
    onSuccess: (_, vars) => {
      toast.success(vars.isActive ? 'User activated!' : 'User deactivated!')
      qc.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role: r }: { id: string; role: string }) => api.put(`/users/${id}`, { role: r }),
    onSuccess: () => { toast.success('Role updated!'); qc.invalidateQueries({ queryKey: ['users'] }) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  })

  const columns = [
    { header: 'User', cell: (u: any) => (
      <div className="flex items-center gap-3">
        <Avatar src={u.avatar} name={`${u.firstName} ${u.lastName}`} size="sm" />
        <div>
          <p className="font-semibold text-sm text-gray-900">{u.firstName} {u.lastName}</p>
          <p className="text-xs text-gray-400">{u.email}</p>
        </div>
      </div>
    )},
    { header: 'Role', cell: (u: any) => canManageEmployees ? (
      <select value={u.role} onChange={e => updateRoleMutation.mutate({ id: u._id, role: e.target.value })} className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer capitalize ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-700'}`}>
        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
    ) : <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-700'}`}>{u.role}</span> },
    { header: 'Last Login', cell: (u: any) => u.lastLogin ? format(new Date(u.lastLogin), 'MMM d, yyyy HH:mm') : 'Never' },
    { header: 'Joined', cell: (u: any) => u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : '—' },
    { header: 'Status', cell: (u: any) => <StatusBadge status={u.isActive ? 'active' : 'inactive'} /> },
    { header: 'Actions', cell: (u: any) => canManageEmployees ? (
      <button onClick={() => toggleStatusMutation.mutate({ id: u._id, isActive: !u.isActive })} className={`p-1.5 rounded transition-colors ${u.isActive ? 'hover:bg-red-50 text-gray-400 hover:text-red-600' : 'hover:bg-emerald-50 text-gray-400 hover:text-emerald-600'}`} title={u.isActive ? 'Deactivate' : 'Activate'}>
        {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
      </button>
    ) : null },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div><h1 className="page-title">Users</h1><p className="page-subtitle">{data?.pagination?.total ?? 0} users</p></div>
      </div>

      <div className="card !p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1) } }} className="input pl-9" placeholder="Search name or email..." />
          </div>
          <select value={role} onChange={e => { setRole(e.target.value); setPage(1) }} className="input w-36">
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} className="input w-36">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {(role || search || status) && <button onClick={() => { setRole(''); setSearch(''); setSearchInput(''); setStatus(''); setPage(1) }} className="btn-secondary btn-sm">Clear</button>}
        </div>
      </div>

      <Table columns={columns} data={data?.data ?? []} loading={isLoading} rowKey={(u: any) => u._id}
        pagination={data?.pagination ? { ...data.pagination, onPageChange: setPage, onLimitChange: (l: number) => { setLimit(l); setPage(1) } } : undefined} />
    </div>
  )
}
