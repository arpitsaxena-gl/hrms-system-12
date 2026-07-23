import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import api from '../../lib/axios'
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const TYPE_ICONS: Record<string, string> = { leave: '🏖', payroll: '💰', attendance: '🕐', performance: '⭐', document: '📄', system: '🔔', announcement: '📢' }
const TYPE_COLORS: Record<string, string> = { leave: 'bg-blue-50 border-blue-100', payroll: 'bg-green-50 border-green-100', attendance: 'bg-amber-50 border-amber-100', performance: 'bg-purple-50 border-purple-100', document: 'bg-gray-50 border-gray-100', system: 'bg-red-50 border-red-100', announcement: 'bg-pink-50 border-pink-100' }

export default function NotificationsPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', filter, page],
    queryFn: () => api.get('/notifications', { params: { page, limit: 20, isRead: filter === 'unread' ? false : undefined } }).then(r => r.data),
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.put(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => { toast.success('All marked as read'); qc.invalidateQueries({ queryKey: ['notifications'] }) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unreadCount = (data?.data ?? []).filter((n: any) => !n.isRead).length

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{data?.pagination?.total ?? 0} total • {unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={() => markAllReadMutation.mutate()} disabled={markAllReadMutation.isPending} className="btn-secondary btn-sm">
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {(['all', 'unread'] as const).map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1) }} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${filter === f ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{f}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="loading-spinner w-8 h-8" /></div>
      ) : (data?.data ?? []).length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(data?.data ?? []).map((n: any) => (
            <div key={n._id} className={`flex items-start gap-4 p-4 rounded-xl border transition-all hover:shadow-sm ${!n.isRead ? 'bg-primary-50 border-primary-100' : 'bg-white border-gray-100'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 border ${TYPE_COLORS[n.type] ?? 'bg-gray-50 border-gray-100'}`}>
                {TYPE_ICONS[n.type] ?? '🔔'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{n.title}</p>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{n.createdAt ? format(new Date(n.createdAt), 'MMM d, HH:mm') : ''}</span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {!n.isRead && (
                  <button onClick={() => markReadMutation.mutate(n._id)} className="p-1.5 rounded hover:bg-primary-100 text-gray-400 hover:text-primary-600" title="Mark as read"><Check className="w-4 h-4" /></button>
                )}
                <button onClick={() => deleteMutation.mutate(n._id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary btn-sm">Previous</button>
          <span className="text-sm text-gray-500 self-center">Page {page} of {data.pagination.totalPages}</span>
          <button disabled={page >= data.pagination.totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary btn-sm">Next</button>
        </div>
      )}
    </div>
  )
}
