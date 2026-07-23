import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface Column<T> {
  header: string
  accessor?: keyof T
  cell?: (row: T, index: number) => React.ReactNode
  className?: string
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    onPageChange: (page: number) => void
    onLimitChange: (limit: number) => void
  }
  rowKey?: (row: T) => string
  emptyMessage?: string
}

export function Table<T extends { _id?: string }>({
  columns, data, loading, pagination, rowKey, emptyMessage = 'No data found'
}: TableProps<T>) {
  if (loading) return (
    <div className="table-container">
      <table className="table">
        <thead className="table-header">
          <tr>{columns.map((c, i) => <th key={i} className="table-th">{c.header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i}>{columns.map((_, j) => (
              <td key={j} className="table-td"><div className="skeleton h-4 w-full" /></td>
            ))}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>{columns.map((col, i) => (
              <th key={i} className={`table-th ${col.className || ''}`}>{col.header}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.length === 0 ? (
              <tr><td colSpan={columns.length} className="text-center py-12 text-gray-400">{emptyMessage}</td></tr>
            ) : data.map((row, index) => (
              <tr key={rowKey ? rowKey(row) : row._id || String(index)} className="table-row">
                {columns.map((col, j) => (
                  <td key={j} className={`table-td ${col.className || ''}`}>
                    {col.cell ? col.cell(row, index) : col.accessor ? String(row[col.accessor] ?? '') : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Rows per page:</span>
            <select
              value={pagination.limit}
              onChange={e => pagination.onLimitChange(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>
              {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => pagination.onPageChange(1)} disabled={pagination.page === 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button onClick={() => pagination.onPageChange(pagination.page - 1)} disabled={pagination.page === 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                let page = i + 1
                if (pagination.totalPages > 5 && pagination.page > 3) page = pagination.page - 2 + i
                if (page > pagination.totalPages) return null
                return (
                  <button
                    key={page}
                    onClick={() => pagination.onPageChange(page)}
                    className={`w-8 h-8 rounded text-sm font-medium transition-colors ${pagination.page === page ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    {page}
                  </button>
                )
              })}
            </div>
            <button onClick={() => pagination.onPageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => pagination.onPageChange(pagination.totalPages)} disabled={pagination.page === pagination.totalPages} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
