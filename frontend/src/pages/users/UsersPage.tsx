import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import { Table } from '../../components/ui/Table'
import { getStatusBadge } from '../../components/ui/Badge'
import { format } from 'date-fns'
import { UserX, Key } from 'lucide-react'
import toast from 'react-hot-toast'
import { usePermissions } from '../../hooks/usePermissions'

interface UserRecord { _id: string; firstName: string; lastName: string; email: string; role: string; isActive: boolean; lastLogin?: string; createdAt: string }

export default function UsersPage() {
  const qc = useQueryClient()
  const { isAdmin } = usePermissions()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [role, setRole] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, limit, role],
    queryFn: () => api.get('/users', { params: { page, limit, role: role || undefined } }).then(r => r.data)
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.put(`/users/${id}/toggle-status`),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['users'] }) }
  })

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => api.post(`/users/${id}/reset-password`),
    onSuccess: () => toast.success('Password reset email sent'),
    onError: (err: unknown) => { const e = err as { response?: { data?: { message?: string } } }; toast.error(e?.response?.data?.message || 'Failed') }
  })

  const columns = [
    { header: 'User', cell: (r: UserRecord) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0">
          {r.firstName[0]}{r.lastName[0]}
        </div>
        <div>
          <p className="font-medium text-sm text-gray-900">{r.firstName} {r.lastName}</p>
          <p className="text-xs text-gray-400">{r.email}</p>
        </div>
      </div>
    )},
    { header: 'Role', cell: (r: UserRecord) => (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${r.role === 'admin' ? 'bg-purple-100 text-purple-700' : r.role === 'hr' ? 'bg-blue-100 text-blue-700' : r.role === 'manager' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
        {r.role}
      </span>
    )},
    { header: 'Status', cell: (r: UserRecord) => getStatusBadge(r.isActive ? 'active' : 'inactive') },
    { header: 'Last Login', cell: (r: UserRecord) => r.lastLogin ? format(new Date(r.lastLogin), 'MMM d, yyyy h:mm a') : 'Never' },
    { header: 'Created', cell: (r: UserRecord) => format(new Date(r.createdAt), 'MMM d, yyyy') },
    { header: 'Actions', cell: (r: UserRecord) => isAdmin ? (
      <div className="flex items-center gap-1">
        <button onClick={() => deactivateMutation.mutate(r._id)} className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${r.isActive ? 'text-gray-400 hover:text-red-600' : 'text-gray-400 hover:text-emerald-600'}`} title={r.isActive ? 'Deactivate' : 'Activate'}>
          <UserX className="w-4 h-4" />
        </button>
        <button onClick={() => resetPasswordMutation.mutate(r._id)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-primary-600 transition-colors" title="Reset Password">
          <Key className="w-4 h-4" />
        </button>
      </div>
    ) : null }
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">{data?.pagination?.total || 0} system users</p>
        </div>
      </div>

      <div className="card">
        <select value={role} onChange={e => { setRole(e.target.value); setPage(1) }} className="input max-w-xs">
          <option value="">All Roles</option>
          {['admin','hr','manager','employee'].map(r => <option key={r} value={r}>{r}</option>)}
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
