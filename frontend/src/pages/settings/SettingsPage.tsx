import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import { Save, Building, Users, DollarSign, Calendar, Clock } from 'lucide-react'

interface Setting { _id: string; key: string; value: unknown; category: string; description?: string; isEditable: boolean }

const categories = [
  { id: 'company', label: 'Company', icon: Building },
  { id: 'hr', label: 'HR Policies', icon: Users },
  { id: 'payroll', label: 'Payroll', icon: DollarSign },
  { id: 'leave', label: 'Leave', icon: Calendar },
  { id: 'attendance', label: 'Attendance', icon: Clock },
]

export default function SettingsPage() {
  const qc = useQueryClient()
  const [activeCategory, setActiveCategory] = useState('company')
  const [edits, setEdits] = useState<Record<string, string>>({})

  const { data, isLoading } = useQuery({
    queryKey: ['settings', activeCategory],
    queryFn: () => api.get(`/settings?category=${activeCategory}`).then(r => r.data.data)
  })

  const mutation = useMutation({
    mutationFn: (updates: Array<{ key: string; value: unknown }>) => api.put('/settings/bulk', { settings: updates }),
    onSuccess: () => { toast.success('Settings saved!'); qc.invalidateQueries({ queryKey: ['settings'] }); setEdits({}) },
    onError: (err: unknown) => { const e = err as { response?: { data?: { message?: string } } }; toast.error(e?.response?.data?.message || 'Failed') }
  })

  const handleSave = () => {
    const updates = Object.entries(edits).map(([key, value]) => ({ key, value }))
    if (updates.length === 0) return toast('No changes to save', { icon: 'ℹ️' })
    mutation.mutate(updates)
  }

  const getValue = (s: Setting) => edits[s.key] !== undefined ? edits[s.key] : String(s.value ?? '')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure system-wide settings and policies</p>
        </div>
        <button onClick={handleSave} disabled={mutation.isPending} className="btn-primary">
          <Save className="w-4 h-4" /> {mutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setEdits({}) }} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeCategory === cat.id ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <cat.icon className="w-4 h-4" /> {cat.label}
          </button>
        ))}
      </div>

      <div className="card">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-16 w-full rounded-lg" />)}
          </div>
        ) : (data || []).length === 0 ? (
          <p className="text-gray-400 text-center py-8">No settings in this category</p>
        ) : (
          <div className="space-y-5">
            {(data || []).map((s: Setting) => (
              <div key={s.key} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center pb-5 border-b border-gray-100 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-gray-800 capitalize">{s.key.replace(/_/g, ' ')}</p>
                  {s.description && <p className="text-xs text-gray-400 mt-0.5">{s.description}</p>}
                </div>
                <div className="md:col-span-2">
                  {s.isEditable ? (
                    typeof s.value === 'boolean' ? (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={edits[s.key] !== undefined ? edits[s.key] === 'true' : Boolean(s.value)}
                          onChange={e => setEdits(prev => ({ ...prev, [s.key]: String(e.target.checked) }))}
                          className="w-4 h-4 rounded text-primary-600"
                        />
                        <span className="text-sm text-gray-600">{edits[s.key] !== undefined ? edits[s.key] === 'true' ? 'Enabled' : 'Disabled' : Boolean(s.value) ? 'Enabled' : 'Disabled'}</span>
                      </label>
                    ) : (
                      <input
                        value={getValue(s)}
                        onChange={e => setEdits(prev => ({ ...prev, [s.key]: e.target.value }))}
                        className="input"
                      />
                    )
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600 border border-gray-200">{String(s.value)}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
