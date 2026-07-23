import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search, Eye, Edit2, Trash2 } from 'lucide-react'
import api from '../../lib/axios'
import { Table } from '../../components/ui/Table'
import { StatusBadge } from '../../components/ui/Badge'
import { Avatar } from '../../components/ui/Avatar'
import { usePermissions } from '../../hooks/usePermissions'
import type { Employee } from '../../types'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function EmployeesPage() {
  const qc = useQueryClient()
  const { canManageEmployees, isAdmin } = usePermissions()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [status, setStatus] = useState('')
  const [dept, setDept] = useState('')

  const { data: depts } = useQuery({
    queryKey: ['departments-list'],
    queryFn: () => api.get('/departments?limit=100').then(r => r.data.data),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['employees', page, limit, search, status, dept],
    queryFn: () => api.get('/employees', { params: { page, limit, search, status, department: dept } }).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/employees/${id}`),
    onSuccess: () => { toast.success('Employee deactivated'); qc.invalidateQueries({ queryKey: ['employees'] }) },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error?.response?.data?.message || 'Failed')
    },
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const columns = [
    {
      header: 'Employee',
      cell: (row: Employee) => (
        <div className="flex items-center gap-3">
          <Avatar src={row.user?.avatar} name={`${row.user?.firstName} ${row.user?.lastName}`} size="sm" />
          <div>
            <p className="font-semibold text-gray-900 text-sm">{row.user?.firstName} {row.user?.lastName}</p>
            <p className="text-xs text-gray-400">{row.employeeId}</p>
          </div>
        </div>
      ),
    },
    { header: 'Department', cell: (row: Employee) => <span>{row.department?.name ?? '-'}</span> },
    { header: 'Designation', cell: (row: Employee) => <span>{row.designation?.name ?? '-'}</span> },
    {
      header: 'Joining',
      cell: (row: Employee) => <span>{row.joiningDate ? format(new Date(row.joiningDate), 'MMM d, yyyy') : '-'}</span>,
    },
    { header: 'Type', cell: (row: Employee) => <StatusBadge status={row.employmentType} /> },
    { header: 'Status', cell: (row: Employee) => <StatusBadge status={row.employmentStatus} /> },
    {
      header: 'Actions',
      cell: (row: Employee) => (
        <div className="flex items-center gap-1">
          <Link to={`/employees/${row._id}`} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-primary-600 transition-colors" title="View">
            <Eye className="w-4 h-4" />
          </Link>
          {canManageEmployees && (
            <Link to={`/employees/${row._id}/edit`} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-amber-500 transition-colors" title="Edit">
              <Edit2 className="w-4 h-4" />
            </Link>
          )}
          {isAdmin && (
            <button
              onClick={() => { if (confirm('Deactivate this employee?')) deleteMutation.mutate(row._id) }}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
              title="Deactivate"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  const pagination = data?.pagination

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">{pagination?.total ?? 0} total employees</p>
        </div>
        {canManageEmployees && (
          <Link to="/employees/new" className="btn-primary btn-sm">
            <Plus className="w-4 h-4" /> Add Employee
          </Link>
        )}
      </div>
      <div className="card !p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search by name, ID..." className="input pl-9" />
            </div>
            <button type="submit" className="btn-primary btn-sm">Search</button>
            {(search || status || dept) && (
              <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setStatus(''); setDept(''); setPage(1) }} className="btn-secondary btn-sm">Clear</button>
            )}
          </form>
          <div className="flex gap-2">
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} className="input text-sm min-w-[130px]">
              <option value="">All Status</option>
              {['active', 'inactive', 'on_probation', 'terminated', 'resigned'].map(s => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
            <select value={dept} onChange={e => { setDept(e.target.value); setPage(1) }} className="input text-sm min-w-[150px]">
              <option value="">All Departments</option>
              {(depts ?? []).map((d: { _id: string; name: string }) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
        </div>
      </div>
      <Table
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        pagination={pagination ? { ...pagination, onPageChange: setPage, onLimitChange: (l) => { setLimit(l); setPage(1) } } : undefined}
        rowKey={r => r._id}
      />
    </div>
  )
}
