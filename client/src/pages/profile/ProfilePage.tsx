import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import { useAuthStore } from '../../store/authStore'
import { Avatar } from '../../components/ui/Avatar'
import { Camera, Save, Loader2, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', phone: '' })
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  const { data: profile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => api.get('/users/me').then(r => r.data.data),
  })

  useEffect(() => {
    if (profile) {
      setForm({ firstName: profile.firstName ?? '', lastName: profile.lastName ?? '', phone: profile.phone ?? '' })
    }
  }, [profile])

  const updateMutation = useMutation({
    mutationFn: (d: any) => api.put('/users/me', d),
    onSuccess: () => {
      toast.success('Profile updated!')
      qc.invalidateQueries({ queryKey: ['my-profile'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  })

  const passwordMutation = useMutation({
    mutationFn: (d: any) => api.put('/users/me/password', d),
    onSuccess: () => { toast.success('Password changed!'); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }) },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  })

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      await api.post('/users/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Avatar updated!')
      qc.invalidateQueries({ queryKey: ['my-profile'] })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return }
    if (pwForm.newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return }
    passwordMutation.mutate({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))
  const setPw = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setPwForm(f => ({ ...f, [k]: e.target.value }))

  const displayName = `${profile?.firstName ?? user?.firstName ?? ''} ${profile?.lastName ?? user?.lastName ?? ''}`

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div><h1 className="page-title">My Profile</h1><p className="page-subtitle">Manage your personal information</p></div>

      <div className="card">
        <h3 className="section-title">Profile Picture</h3>
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar src={profile?.avatar ?? user?.avatar} name={displayName} size="xl" />
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-primary-700 transition-colors">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            <input ref={fileRef} type="file" className="hidden" onChange={handleAvatarUpload} accept="image/*" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{displayName}</p>
            <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Personal Information</h3>
        <form onSubmit={e => { e.preventDefault(); updateMutation.mutate(form) }} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group"><label className="label">First Name</label><input value={form.firstName} onChange={set('firstName')} className="input" /></div>
            <div className="form-group"><label className="label">Last Name</label><input value={form.lastName} onChange={set('lastName')} className="input" /></div>
            <div className="form-group"><label className="label">Email</label><input value={user?.email ?? ''} className="input" disabled /></div>
            <div className="form-group"><label className="label">Phone</label><input value={form.phone} onChange={set('phone')} className="input" placeholder="+91 9999999999" /></div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={updateMutation.isPending} className="btn-primary btn-sm">
              {updateMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3 className="section-title">Change Password</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="form-group"><label className="label">Current Password</label><input type="password" value={pwForm.currentPassword} onChange={setPw('currentPassword')} className="input" autoComplete="current-password" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group"><label className="label">New Password</label><input type="password" value={pwForm.newPassword} onChange={setPw('newPassword')} className="input" autoComplete="new-password" /></div>
            <div className="form-group"><label className="label">Confirm Password</label><input type="password" value={pwForm.confirmPassword} onChange={setPw('confirmPassword')} className="input" autoComplete="new-password" /></div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={passwordMutation.isPending} className="btn-primary btn-sm">
              {passwordMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : <><Lock className="w-4 h-4" /> Update Password</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
