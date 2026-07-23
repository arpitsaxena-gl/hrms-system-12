import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

const schema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  department: z.string().min(1, 'Department required'),
  designation: z.string().min(1, 'Designation required'),
  joiningDate: z.string().min(1, 'Joining date required'),
  employmentType: z.string().min(1, 'Employment type required'),
  employmentStatus: z.string().min(1, 'Status required'),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  bloodGroup: z.string().optional(),
  maritalStatus: z.string().optional(),
  manager: z.string().optional(),
  shift: z.string().optional(),
  basicSalary: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function EmployeeFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [activeSection, setActiveSection] = useState('personal')

  const { data: deptData } = useQuery({ queryKey: ['departments-all'], queryFn: () => api.get('/departments?limit=100').then(r => r.data) })
  const { data: desigData } = useQuery({ queryKey: ['designations-all'], queryFn: () => api.get('/designations?limit=100').then(r => r.data) })
  const { data: shiftData } = useQuery({ queryKey: ['shifts-all'], queryFn: () => api.get('/shifts?limit=100').then(r => r.data) })
  const { data: empData } = useQuery({ queryKey: ['employees-managers'], queryFn: () => api.get('/employees?limit=100').then(r => r.data) })

  const { data: existing } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => api.get(`/employees/${id}`).then(r => r.data.data),
    enabled: isEdit
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (existing) {
      reset({
        firstName: existing.user?.firstName || '',
        lastName: existing.user?.lastName || '',
        email: existing.user?.email || '',
        phone: existing.phone || '',
        department: existing.department?._id || '',
        designation: existing.designation?._id || '',
        joiningDate: existing.joiningDate?.split('T')[0] || '',
        employmentType: existing.employmentType || '',
        employmentStatus: existing.employmentStatus || '',
        gender: existing.gender || '',
        dateOfBirth: existing.dateOfBirth?.split('T')[0] || '',
        bloodGroup: existing.bloodGroup || '',
        maritalStatus: existing.maritalStatus || '',
        manager: existing.manager?._id || '',
        shift: existing.shift?._id || '',
        basicSalary: existing.salary?.basic?.toString() || '',
        street: existing.currentAddress?.street || '',
        city: existing.currentAddress?.city || '',
        state: existing.currentAddress?.state || '',
        country: existing.currentAddress?.country || '',
        emergencyName: existing.emergencyContact?.name || '',
        emergencyPhone: existing.emergencyContact?.phone || '',
        bankName: existing.bankDetails?.bankName || '',
        accountNumber: existing.bankDetails?.accountNumber || '',
        ifscCode: existing.bankDetails?.ifscCode || '',
      })
    }
  }, [existing, reset])

  const mutation = useMutation({
    mutationFn: (formData: FormData) => {
      const payload = {
        user: { firstName: formData.firstName, lastName: formData.lastName, email: formData.email },
        phone: formData.phone,
        department: formData.department,
        designation: formData.designation,
        joiningDate: formData.joiningDate,
        employmentType: formData.employmentType,
        employmentStatus: formData.employmentStatus,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        bloodGroup: formData.bloodGroup,
        maritalStatus: formData.maritalStatus,
        manager: formData.manager || undefined,
        shift: formData.shift || undefined,
        salary: formData.basicSalary ? { basic: Number(formData.basicSalary) } : undefined,
        currentAddress: { street: formData.street, city: formData.city, state: formData.state, country: formData.country },
        emergencyContact: { name: formData.emergencyName, phone: formData.emergencyPhone },
        bankDetails: { bankName: formData.bankName, accountNumber: formData.accountNumber, ifscCode: formData.ifscCode }
      }
      return isEdit ? api.put(`/employees/${id}`, payload) : api.post('/employees', payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Employee updated!' : 'Employee created!')
      qc.invalidateQueries({ queryKey: ['employees'] })
      navigate('/employees')
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e?.response?.data?.message || 'Failed to save employee')
    }
  })

  const sections = [
    { id: 'personal', label: 'Personal Info' },
    { id: 'employment', label: 'Employment' },
    { id: 'address', label: 'Address' },
    { id: 'emergency', label: 'Emergency Contact' },
    { id: 'bank', label: 'Bank Details' },
  ]

  const FG = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div className="form-group">
      <label className="label">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Link to="/employees" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="page-title">{isEdit ? 'Edit Employee' : 'Add Employee'}</h1>
            <p className="page-subtitle">{isEdit ? 'Update employee information' : 'Create a new employee record'}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === s.id ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {s.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-6">
        {activeSection === 'personal' && (
          <div className="card">
            <h3 className="section-title">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FG label="First Name *" error={errors.firstName?.message}><input {...register('firstName')} className={`input ${errors.firstName ? 'input-error' : ''}`} placeholder="John" /></FG>
              <FG label="Last Name *" error={errors.lastName?.message}><input {...register('lastName')} className={`input ${errors.lastName ? 'input-error' : ''}`} placeholder="Doe" /></FG>
              <FG label="Email *" error={errors.email?.message}><input {...register('email')} type="email" className={`input ${errors.email ? 'input-error' : ''}`} placeholder="john@company.com" /></FG>
              <FG label="Phone"><input {...register('phone')} className="input" placeholder="+91 9876543210" /></FG>
              <FG label="Date of Birth"><input {...register('dateOfBirth')} type="date" className="input" /></FG>
              <FG label="Gender">
                <select {...register('gender')} className="input">
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </FG>
              <FG label="Blood Group">
                <select {...register('bloodGroup')} className="input">
                  <option value="">Select</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </FG>
              <FG label="Marital Status">
                <select {...register('maritalStatus')} className="input">
                  <option value="">Select</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                </select>
              </FG>
            </div>
          </div>
        )}

        {activeSection === 'employment' && (
          <div className="card">
            <h3 className="section-title">Employment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FG label="Department *" error={errors.department?.message}>
                <select {...register('department')} className={`input ${errors.department ? 'input-error' : ''}`}>
                  <option value="">Select Department</option>
                  {(deptData?.data || []).map((d: { _id: string; name: string }) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </FG>
              <FG label="Designation *" error={errors.designation?.message}>
                <select {...register('designation')} className={`input ${errors.designation ? 'input-error' : ''}`}>
                  <option value="">Select Designation</option>
                  {(desigData?.data || []).map((d: { _id: string; name: string }) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </FG>
              <FG label="Manager">
                <select {...register('manager')} className="input">
                  <option value="">No Manager</option>
                  {(empData?.data || []).map((e: { _id: string; user?: { firstName?: string; lastName?: string } }) => (
                    <option key={e._id} value={e._id}>{e.user?.firstName} {e.user?.lastName}</option>
                  ))}
                </select>
              </FG>
              <FG label="Shift">
                <select {...register('shift')} className="input">
                  <option value="">Select Shift</option>
                  {(shiftData?.data || []).map((s: { _id: string; name: string }) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </FG>
              <FG label="Joining Date *" error={errors.joiningDate?.message}><input {...register('joiningDate')} type="date" className={`input ${errors.joiningDate ? 'input-error' : ''}`} /></FG>
              <FG label="Employment Type *" error={errors.employmentType?.message}>
                <select {...register('employmentType')} className={`input ${errors.employmentType ? 'input-error' : ''}`}>
                  <option value="">Select Type</option>
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="intern">Intern</option>
                </select>
              </FG>
              <FG label="Status *" error={errors.employmentStatus?.message}>
                <select {...register('employmentStatus')} className={`input ${errors.employmentStatus ? 'input-error' : ''}`}>
                  <option value="">Select Status</option>
                  <option value="active">Active</option>
                  <option value="on_probation">On Probation</option>
                  <option value="inactive">Inactive</option>
                  <option value="terminated">Terminated</option>
                </select>
              </FG>
              <FG label="Basic Salary"><input {...register('basicSalary')} type="number" className="input" placeholder="50000" /></FG>
            </div>
          </div>
        )}

        {activeSection === 'address' && (
          <div className="card">
            <h3 className="section-title">Current Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2"><FG label="Street"><input {...register('street')} className="input" placeholder="123 Main Street" /></FG></div>
              <FG label="City"><input {...register('city')} className="input" placeholder="Mumbai" /></FG>
              <FG label="State"><input {...register('state')} className="input" placeholder="Maharashtra" /></FG>
              <FG label="Country"><input {...register('country')} className="input" placeholder="India" /></FG>
            </div>
          </div>
        )}

        {activeSection === 'emergency' && (
          <div className="card">
            <h3 className="section-title">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FG label="Contact Name"><input {...register('emergencyName')} className="input" placeholder="Jane Doe" /></FG>
              <FG label="Contact Phone"><input {...register('emergencyPhone')} className="input" placeholder="+91 9876543210" /></FG>
            </div>
          </div>
        )}

        {activeSection === 'bank' && (
          <div className="card">
            <h3 className="section-title">Bank Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FG label="Bank Name"><input {...register('bankName')} className="input" placeholder="HDFC Bank" /></FG>
              <FG label="Account Number"><input {...register('accountNumber')} className="input" placeholder="1234567890" /></FG>
              <FG label="IFSC Code"><input {...register('ifscCode')} className="input" placeholder="HDFC0001234" /></FG>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <Link to="/employees" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : (isEdit ? 'Update Employee' : 'Create Employee')}
          </button>
        </div>
      </form>
    </div>
  )
}
