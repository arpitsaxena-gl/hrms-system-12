import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import { useAuthStore } from '../../store/authStore'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { User, Mail, Phone, Calendar, Edit2, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { getStatusBadge } from '../../components/ui/Badge'

interface ProfileForm { firstName: string; lastName: string; phone?: string }

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [editing, setEditing] = useState(false)

  const { data: empData } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => api.get('/auth/me').then(r => r.data.data)
  })

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<ProfileForm>({
    defaultValues: { firstName: user?.firstName || '', lastName: user?.lastName || '', phone: user?.phone || '' }
  })

  const mutation = useMutation({
    mutationFn: (data: ProfileForm) => api.put('/auth/profile', data),
    onSuccess: (res) => {
      toast.success('Profile updated!')
      updateUser(res.data.data)
      setEditing(false)
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e?.response?.data?.message || 'Failed to update')
    }
  })

  const emp = empData?.employee

  const InfoItem = ({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value?: string }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value || '-'}</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">View and manage your profile information</p>
        </div>
        <button onClick={() => setEditing(!editing)} className="btn-primary">
          <Edit2 className="w-4 h-4" /> {editing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="w-24 h-24 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 text-3xl font-bold mx-auto overflow-hidden">
            {user?.avatar
              ? <img src={user.avatar} alt="avatar" className="w-24 h-24 rounded-2xl object-cover" />
              : `${user?.firstName?.[0]}${user?.lastName?.[0]}`}
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</h2>
          <p className="text-gray-500 text-sm capitalize">{user?.role}</p>
          {emp && <div className="mt-3">{getStatusBadge(emp.employmentStatus)}</div>}
        </div>

        <div className="card md:col-span-2">
          {editing ? (
            <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
              <h3 className="section-title">Edit Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">First Name</label>
                  <input {...register('firstName')} className="input" />
                </div>
                <div className="form-group">
                  <label className="label">Last Name</label>
                  <input {...register('lastName')} className="input" />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Phone</label>
                <input {...register('phone')} className="input" placeholder="+91 9876543210" />
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={isSubmitting || mutation.isPending} className="btn-primary">
                  {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <>
              <h3 className="section-title">Account Information</h3>
              <InfoItem icon={User} label="Full Name" value={`${user?.firstName} ${user?.lastName}`} />
              <InfoItem icon={Mail} label="Email" value={user?.email} />
              <InfoItem icon={Phone} label="Phone" value={user?.phone} />
              <InfoItem icon={Calendar} label="Member Since" value={user?.createdAt ? format(new Date(user.createdAt), 'MMMM d, yyyy') : undefined} />
            </>
          )}
        </div>
      </div>

      {emp && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="section-title">Employment Details</h3>
            <div className="space-y-0">
              {[
                { label: 'Employee ID', value: emp.employeeId },
                { label: 'Department', value: emp.department?.name },
                { label: 'Designation', value: emp.designation?.name },
                { label: 'Joining Date', value: emp.joiningDate ? format(new Date(emp.joiningDate), 'MMMM d, yyyy') : undefined },
                { label: 'Employment Type', value: emp.employmentType?.replace('_', ' ') },
              ].map(item => (
                <div key={item.label} className="flex justify-between py-2.5 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-500">{item.label}</span>
                  <span className="text-sm font-medium text-gray-800 capitalize">{item.value || '-'}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 className="section-title">Leave Balance</h3>
            {emp.leaveBalance ? Object.entries(emp.leaveBalance).map(([type, days]) => (
              <div key={type} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-500 capitalize">{type} Leave</span>
                <span className="font-bold text-primary-600 text-lg">{String(days)}</span>
              </div>
            )) : <p className="text-gray-400 text-sm">No leave balance data</p>}
          </div>
        </div>
      )}
    </div>
  )
}
