import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface Column<T> {
  header: string
  accessor?: keyof T
  cell?: (row: T, index: number) => ReactNode
  className?: string
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  pagination?: {
    page: number; limit: number; total: number; totalPages: number
    onPageChange: (page: number) => void
    onLimitChange: (limit: number) => void
  }
  rowKey?: (row: T, index: number) => string
  emptyMessage?: string
}

export function Table<T extends { _id?: string }>({
  columns, data, loading, pagination, rowKey, emptyMessage = 'No records found'
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="table-container">
        <table className="table">
          <thead><tr>{columns.map((c, i) => <th key={i} className="table-th">{c.header}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map((_, j) => (
                  <td key={j} className="table-td">
                    <div className="skeleton h-4 rounded w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} className={`table-th ${col.className || ''}`}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-gray-400 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : data.map((row, index) => (
              <tr key={rowKey ? rowKey(row, index) : (row._id ?? String(index))} className="table-row">
                {columns.map((col, j) => (
                  <td key={j} className={`table-td ${col.className || ''}`}>
                    {col.cell
                      ? col.cell(row, index)
                      : col.accessor != null
                        ? String(row[col.accessor] ?? '')
                        : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Rows:</span>
            <select
              value={pagination.limit}
              onChange={e => pagination.onLimitChange(Number(e.target.value))}
              className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none"
            >
              {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>
              {((pagination.page - 1) * pagination.limit) + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
              let pg = i + 1
              if (pagination.totalPages > 7 && pagination.page > 4) {
                pg = pagination.page - 3 + i
              }
              if (pg < 1 || pg > pagination.totalPages) return null
              return (
                <button
                  key={pg}
                  onClick={() => pagination.onPageChange(pg)}
                  className={`w-8 h-8 rounded text-sm transition-colors ${pagination.page === pg ? 'bg-primary-600 text-white font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
                >
                  {pg}
                </button>
              )
            })}
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
