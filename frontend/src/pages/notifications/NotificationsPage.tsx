import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import { format } from 'date-fns'
import { Bell, Check, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface NotifRecord { _id: string; title: string; message: string; type: string; category: string; isRead: boolean; link?: string; createdAt: string }

const typeIcon = (type: string) => {
  const props = { className: 'w-5 h-5' }
  switch (type) {
    case 'success': return <CheckCircle {...props} className="w-5 h-5 text-emerald-500" />
    case 'warning': return <AlertTriangle {...props} className="w-5 h-5 text-amber-500" />
    case 'error': return <XCircle {...props} className="w-5 h-5 text-red-500" />
    default: return <Info {...props} className="w-5 h-5 text-blue-500" />
  }
}

export default function NotificationsPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', page, filter],
    queryFn: () => api.get('/notifications', { params: { page, limit: 20, isRead: filter === 'unread' ? false : undefined } }).then(r => r.data)
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.put(`/notifications/${id}/read`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); qc.invalidateQueries({ queryKey: ['unread-notifications'] }) }
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => { toast.success('All marked as read'); qc.invalidateQueries({ queryKey: ['notifications'] }); qc.invalidateQueries({ queryKey: ['unread-notifications'] }) }
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{data?.data?.unreadCount || 0} unread notifications</p>
        </div>
        <button onClick={() => markAllReadMutation.mutate()} disabled={markAllReadMutation.isPending} className="btn-secondary">
          <CheckCheck className="w-4 h-4" /> Mark All Read
        </button>
      </div>

      <div className="flex gap-2">
        {(['all', 'unread'] as const).map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1) }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${filter === f ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{f}</button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-16 w-full rounded-lg" />)}
          </div>
        ) : (data?.data || []).length === 0 ? (
          <div className="empty-state">
            <Bell className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-400 font-medium">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {(data?.data || []).map((n: NotifRecord) => (
              <div key={n._id} className={`flex items-start gap-4 p-5 hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-blue-50/50' : ''}`}>
                <div className="mt-0.5 flex-shrink-0">{typeIcon(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className={`text-sm font-medium ${!n.isRead ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{format(new Date(n.createdAt), 'MMM d, yyyy h:mm a')}</p>
                    </div>
                    {!n.isRead && (
                      <button onClick={() => markReadMutation.mutate(n._id)} className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-primary-600 flex-shrink-0" title="Mark as read">
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                {!n.isRead && <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline btn-sm">Previous</button>
          <span className="px-4 py-2 text-sm text-gray-600">Page {page} of {data.pagination.totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page === data.pagination.totalPages} className="btn-outline btn-sm">Next</button>
        </div>
      )}
    </div>
  )
}
