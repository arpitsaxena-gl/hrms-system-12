import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import { Save, Loader2, Building2, Mail, Bell, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

const SETTING_GROUPS = [
  { key: 'company', label: 'Company', icon: Building2 },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'security', label: 'Security', icon: Shield },
] as const

export default function SettingsPage() {
  const qc = useQueryClient()
  const [activeGroup, setActiveGroup] = useState<string>('company')
  const [localValues, setLocalValues] = useState<Record<string, any>>({})

  const { data, isLoading } = useQuery({
    queryKey: ['settings', activeGroup],
    queryFn: () => api.get('/settings', { params: { group: activeGroup } }).then(r => r.data.data),
  })

  const saveMutation = useMutation({
    mutationFn: (settings: any[]) => api.put('/settings', { settings }),
    onSuccess: () => { toast.success('Settings saved!'); qc.invalidateQueries({ queryKey: ['settings'] }); setLocalValues({}) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  })

  const getValue = (setting: any) => localValues[setting.key] !== undefined ? localValues[setting.key] : setting.value

  const handleSave = () => {
    const settings = Object.entries(localValues).map(([key, value]) => ({ key, value }))
    if (settings.length === 0) { toast('No changes to save'); return }
    saveMutation.mutate(settings)
  }

  const renderInput = (setting: any) => {
    const value = getValue(setting)
    const onChange = (val: any) => setLocalValues(v => ({ ...v, [setting.key]: val }))

    switch (setting.type) {
      case 'boolean':
        return (
          <div onClick={() => onChange(!value)} className={`w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 flex items-center ${value ? 'bg-primary-600' : 'bg-gray-300'}`}>
            <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform m-0.5 ${value ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
        )
      case 'number':
        return <input type="number" value={value ?? ''} onChange={e => onChange(Number(e.target.value))} className="input" />
      case 'select':
        return (
          <select value={value ?? ''} onChange={e => onChange(e.target.value)} className="input">
            {(setting.options ?? []).map((o: string) => <option key={o} value={o}>{o}</option>)}
          </select>
        )
      default:
        return <input type="text" value={value ?? ''} onChange={e => onChange(e.target.value)} className="input" />
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div><h1 className="page-title">Settings</h1><p className="page-subtitle">Configure system preferences</p></div>
        <button onClick={handleSave} disabled={saveMutation.isPending} className="btn-primary btn-sm">
          {saveMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <div className="space-y-1">
          {SETTING_GROUPS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => { setActiveGroup(key); setLocalValues({}) }} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeGroup === key ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        <div className="col-span-3 card">
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="loading-spinner w-6 h-6" /></div>
          ) : (data ?? []).length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No settings in this category</p>
          ) : (
            <div className="space-y-1">
              {(data ?? []).map((setting: any) => (
                <div key={setting.key} className="flex items-start justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{setting.label ?? setting.key}</p>
                    {setting.description && <p className="text-xs text-gray-400 mt-0.5">{setting.description}</p>}
                  </div>
                  <div className="w-56 flex-shrink-0 flex items-center">{renderInput(setting)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
