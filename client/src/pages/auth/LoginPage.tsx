import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import { Building, Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Please enter email and password'); return }
    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error?.response?.data?.message || 'Login failed')
    }
  }

  const fillDemo = (role: string) => {
    const c: Record<string, [string, string]> = {
      admin: ['admin@hrms.com', 'Admin@123'],
      hr: ['hr@hrms.com', 'Hr@12345'],
      manager: ['manager@hrms.com', 'Manager@123'],
      employee: ['alice@hrms.com', 'Employee@123'],
    }
    setEmail(c[role][0]); setPassword(c[role][1])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl shadow-2xl mb-4">
            <Building className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">HRMS Portal</h1>
          <p className="text-slate-400 mt-2 text-sm">Enterprise Human Resource Management</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Sign in to continue</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@hrms.com" className="input pl-10" />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input pl-10 pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full py-2.5 !text-sm">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>
          <div className="mt-6">
            <p className="text-xs text-gray-400 text-center mb-3 font-medium">Quick Demo Access</p>
            <div className="grid grid-cols-2 gap-2">
              {(['admin', 'hr', 'manager', 'employee'] as const).map(role => (
                <button key={role} type="button" onClick={() => fillDemo(role)}
                  className="py-2 text-xs rounded-lg border border-gray-200 hover:border-primary-400 hover:bg-primary-50 text-gray-600 hover:text-primary-700 transition-all capitalize font-medium">
                  {role === 'admin' ? 'Admin' : role === 'hr' ? 'HR' : role === 'manager' ? 'Manager' : 'Employee'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="text-center text-slate-500 text-xs mt-6">© {new Date().getFullYear()} HRMS Enterprise v1.0</p>
      </div>
    </div>
  )
}
