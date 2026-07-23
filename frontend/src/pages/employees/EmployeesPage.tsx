import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import { Table } from '../../components/ui/Table'
import { Employee } from '../../types'
import { getStatusBadge } from '../../components/ui/Badge'
import { Link } from 'react-router-dom'
import { Plus, Search, Eye, Edit2, Trash2 } from 'lucide-react'
import { usePermissions } from '../../hooks/usePermissions'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function EmployeesPage() {
  const qc = useQueryClient()
  const { canManageEmployees, isAdmin } = usePermissions()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [dept, setDept] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data: deptData } = useQuery({
    queryKey: ['departments-all'],
    queryFn: () => api.get('/departments?limit=100').then(r => r.data)
  })

  const { data, isLoading } = useQuery({
    queryKey: ['employees', page, limit, search, status, dept],
    queryFn: () => api.get('/employees', { params: { page, limit, search, status, department: dept } }).then(r => r.data)
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/employees/${id}`),
    onSuccess: () => { toast.success('Employee deactivated'); qc.invalidateQueries({ queryKey: ['employees'] }) },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e?.response?.data?.message || 'Failed')
    }
  })

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setSearch(searchInput); setPage(1) }

  const columns = [
    {
      header: 'Employee',
      cell: (row: Employee) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0 overflow-hidden">
            {row.user?.avatar
              ? <img src={row.user.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
              : `${row.user?.firstName?.[0]}${row.user?.lastName?.[0]}`}
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">{row.user?.firstName} {row.user?.lastName}</p>
            <p className="text-xs text-gray-400">{row.employeeId}</p>
          </div>
        </div>
      )
    },
    { header: 'Department', cell: (row: Employee) => <span className="text-sm text-gray-700">{row.department?.name || '-'}</span> },
    { header: 'Designation', cell: (row: Employee) => <span className="text-sm text-gray-700">{row.designation?.name || '-'}</span> },
    { header: 'Joining Date', cell: (row: Employee) => <span className="text-sm text-gray-600">{row.joiningDate ? format(new Date(row.joiningDate), 'MMM d, yyyy') : '-'}</span> },
    { header: 'Type', cell: (row: Employee) => getStatusBadge(row.employmentType) },
    { header: 'Status', cell: (row: Employee) => getStatusBadge(row.employmentStatus) },
    {
      header: 'Actions',
      cell: (row: Employee) => (
        <div className="flex items-center gap-1">
          <Link to={`/employees/${row._id}`} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-primary-600 transition-colors" title="View">
            <Eye className="w-4 h-4" />
          </Link>
          {canManageEmployees && (
            <Link to={`/employees/${row._id}/edit`} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-amber-600 transition-colors" title="Edit">
              <Edit2 className="w-4 h-4" />
            </Link>
          )}
          {isAdmin && (
            <button
              onClick={() => { if (confirm('Deactivate this employee?')) deleteMutation.mutate(row._id) }}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors"
              title="Deactivate"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ]

  const paginationData = data?.pagination

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">{data?.pagination?.total || 0} total employees</p>
        </div>
        {canManageEmployees && (
          <Link to="/employees/new" className="btn-primary">
            <Plus className="w-4 h-4" /> Add Employee
          </Link>
        )}
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search by name, ID, email..." className="input pl-9 w-full" />
            </div>
            <button type="submit" className="btn-primary">Search</button>
            {search && <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }} className="btn-secondary">Clear</button>}
          </form>
          <div className="flex gap-3">
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} className="input min-w-[140px]">
              <option value="">All Status</option>
              {['active', 'inactive', 'on_probation', 'terminated', 'resigned'].map(s => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
            <select value={dept} onChange={e => { setDept(e.target.value); setPage(1) }} className="input min-w-[140px]">
              <option value="">All Departments</option>
              {(deptData?.data || []).map((d: { _id: string; name: string }) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        data={data?.data || []}
        loading={isLoading}
        pagination={paginationData ? { ...paginationData, onPageChange: setPage, onLimitChange: (l: number) => { setLimit(l); setPage(1) } } : undefined}
        rowKey={r => r._id}
      />
    </div>
  )
}
