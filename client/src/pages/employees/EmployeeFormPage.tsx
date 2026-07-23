import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import api from '../../lib/axios'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EmployeeFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isEdit = !!id

  const { data: depts } = useQuery({ queryKey: ['departments-list'], queryFn: () => api.get('/departments?limit=100').then(r => r.data.data) })
  const { data: desigs } = useQuery({ queryKey: ['designations-list'], queryFn: () => api.get('/designations?limit=100').then(r => r.data.data) })
  const { data: shifts } = useQuery({ queryKey: ['shifts-list'], queryFn: () => api.get('/shifts').then(r => r.data.data) })
  const { data: managers } = useQuery({ queryKey: ['managers-list'], queryFn: () => api.get('/employees?limit=100&status=active').then(r => r.data.data) })

  useQuery({
    queryKey: ['employee-edit', id],
    queryFn: () => api.get(`/employees/${id}`).then(r => r.data.data),
    enabled: isEdit,
  })

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', role: 'employee',
    department: '', designation: '', shift: '', manager: '',
    joiningDate: '', employmentType: 'full_time', gender: '', bloodGroup: '',
    maritalStatus: '', dateOfBirth: '', nationality: 'Indian',
    basicSalary: '', hra: '', da: '', ta: '', medical: '',
    street: '', city: '', state: '', country: 'India', zipCode: '',
    emergencyName: '', emergencyPhone: '', emergencyRelation: '',
    bankName: '', accountNumber: '', ifscCode: '',
    skills: '',
  })

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit ? api.put(`/employees/${id}`, data) : api.post('/employees', data),
    onSuccess: () => {
      toast.success(isEdit ? 'Employee updated!' : 'Employee created!')
      qc.invalidateQueries({ queryKey: ['employees'] })
      navigate('/employees')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data: any = {
      firstName: form.firstName, lastName: form.lastName, email: form.email,
      phone: form.phone, role: form.role,
      department: form.department, designation: form.designation,
      shift: form.shift || undefined, manager: form.manager || undefined,
      joiningDate: form.joiningDate, employmentType: form.employmentType,
      gender: form.gender, bloodGroup: form.bloodGroup,
      maritalStatus: form.maritalStatus, dateOfBirth: form.dateOfBirth || undefined,
      nationality: form.nationality,
      currentAddress: { street: form.street, city: form.city, state: form.state, country: form.country, zipCode: form.zipCode },
      emergencyContact: form.emergencyName ? { name: form.emergencyName, phone: form.emergencyPhone, relationship: form.emergencyRelation } : undefined,
      bankDetails: form.bankName ? { bankName: form.bankName, accountNumber: form.accountNumber, ifscCode: form.ifscCode } : undefined,
      skills: form.skills ? form.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
    }
    if (form.basicSalary) {
      data.salary = {
        basic: Number(form.basicSalary), hra: Number(form.hra) || 0,
        da: Number(form.da) || 0, ta: Number(form.ta) || 0, medical: Number(form.medical) || 0
      }
    }
    mutation.mutate(data)
  }

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [key]: e.target.value }))

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="card space-y-4">
      <h3 className="section-title border-b border-gray-100 pb-3 mb-0">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">{children}</div>
    </div>
  )

  const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div className="form-group">
      <label className="label">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      {children}
    </div>
  )

  return (
    <div className="space-y-5 animate-fade-in max-w-6xl">
      <div className="flex items-center gap-3">
        <Link to="/employees" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Employee' : 'Add New Employee'}</h1>
          <p className="page-subtitle">{isEdit ? 'Update employee information' : 'Create a new employee profile'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Section title="Personal Information">
          <Field label="First Name" required><input value={form.firstName} onChange={set('firstName')} className="input" placeholder="John" required /></Field>
          <Field label="Last Name" required><input value={form.lastName} onChange={set('lastName')} className="input" placeholder="Doe" required /></Field>
          <Field label="Email Address" required><input type="email" value={form.email} onChange={set('email')} className="input" placeholder="john@company.com" required={!isEdit} disabled={isEdit} /></Field>
          <Field label="Phone"><input value={form.phone} onChange={set('phone')} className="input" placeholder="+91 9999999999" /></Field>
          <Field label="Date of Birth"><input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} className="input" /></Field>
          <Field label="Gender">
            <select value={form.gender} onChange={set('gender')} className="input">
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Blood Group">
            <select value={form.bloodGroup} onChange={set('bloodGroup')} className="input">
              <option value="">Select</option>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="Marital Status">
            <select value={form.maritalStatus} onChange={set('maritalStatus')} className="input">
              <option value="">Select</option>
              {['single','married','divorced','widowed'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Nationality"><input value={form.nationality} onChange={set('nationality')} className="input" /></Field>
        </Section>

        <Section title="Employment Details">
          <Field label="Department" required>
            <select value={form.department} onChange={set('department')} className="input" required>
              <option value="">Select Department</option>
              {(depts ?? []).map((d: any) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Designation" required>
            <select value={form.designation} onChange={set('designation')} className="input" required>
              <option value="">Select Designation</option>
              {(desigs ?? []).map((d: any) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Shift">
            <select value={form.shift} onChange={set('shift')} className="input">
              <option value="">Select Shift</option>
              {(shifts ?? []).map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Manager">
            <select value={form.manager} onChange={set('manager')} className="input">
              <option value="">Select Manager</option>
              {(managers ?? []).map((e: any) => <option key={e._id} value={e._id}>{e.user?.firstName} {e.user?.lastName}</option>)}
            </select>
          </Field>
          <Field label="Joining Date" required><input type="date" value={form.joiningDate} onChange={set('joiningDate')} className="input" required /></Field>
          <Field label="Employment Type" required>
            <select value={form.employmentType} onChange={set('employmentType')} className="input" required>
              {['full_time','part_time','contract','intern','freelance'].map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
            </select>
          </Field>
          <Field label="Role">
            <select value={form.role} onChange={set('role')} className="input">
              {['employee','manager','hr','admin'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
        </Section>

        <Section title="Salary Structure">
          <Field label="Basic Salary"><input type="number" value={form.basicSalary} onChange={set('basicSalary')} className="input" placeholder="50000" /></Field>
          <Field label="HRA"><input type="number" value={form.hra} onChange={set('hra')} className="input" placeholder="15000" /></Field>
          <Field label="DA"><input type="number" value={form.da} onChange={set('da')} className="input" placeholder="5000" /></Field>
          <Field label="TA"><input type="number" value={form.ta} onChange={set('ta')} className="input" placeholder="3000" /></Field>
          <Field label="Medical Allowance"><input type="number" value={form.medical} onChange={set('medical')} className="input" placeholder="2000" /></Field>
        </Section>

        <Section title="Current Address">
          <Field label="Street"><input value={form.street} onChange={set('street')} className="input" placeholder="123 Main St" /></Field>
          <Field label="City"><input value={form.city} onChange={set('city')} className="input" placeholder="Mumbai" /></Field>
          <Field label="State"><input value={form.state} onChange={set('state')} className="input" placeholder="Maharashtra" /></Field>
          <Field label="Country"><input value={form.country} onChange={set('country')} className="input" placeholder="India" /></Field>
          <Field label="ZIP Code"><input value={form.zipCode} onChange={set('zipCode')} className="input" placeholder="400001" /></Field>
        </Section>

        <Section title="Emergency Contact">
          <Field label="Name"><input value={form.emergencyName} onChange={set('emergencyName')} className="input" placeholder="Jane Doe" /></Field>
          <Field label="Phone"><input value={form.emergencyPhone} onChange={set('emergencyPhone')} className="input" placeholder="+91 9999999999" /></Field>
          <Field label="Relationship"><input value={form.emergencyRelation} onChange={set('emergencyRelation')} className="input" placeholder="Spouse" /></Field>
        </Section>

        <Section title="Bank Details">
          <Field label="Bank Name"><input value={form.bankName} onChange={set('bankName')} className="input" placeholder="HDFC Bank" /></Field>
          <Field label="Account Number"><input value={form.accountNumber} onChange={set('accountNumber')} className="input" /></Field>
          <Field label="IFSC Code"><input value={form.ifscCode} onChange={set('ifscCode')} className="input" /></Field>
        </Section>

        <div className="card">
          <h3 className="section-title">Skills</h3>
          <div className="form-group">
            <label className="label">Skills (comma-separated)</label>
            <input value={form.skills} onChange={set('skills')} className="input" placeholder="React, Node.js, MongoDB" />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link to="/employees" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> {isEdit ? 'Update' : 'Create'} Employee</>}
          </button>
        </div>
      </form>
    </div>
  )
}
