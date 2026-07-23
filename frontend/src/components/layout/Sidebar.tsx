import { NavLink } from 'react-router-dom'
import { usePermissions } from '../../hooks/usePermissions'
import {
  LayoutDashboard, Users, UserCircle, Building2, Briefcase, Clock, Calendar, DollarSign,
  UserPlus, Star, GraduationCap, FileText, Gift, Timer, Bell, BarChart3,
  Settings, Shield, LogOut, Building, X
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

interface NavItem {
  label: string
  icon: React.ComponentType<{ className?: string }>
  to: string
  roles?: string[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Employees', icon: Users, to: '/employees' },
  { label: 'Departments', icon: Building2, to: '/departments', roles: ['admin', 'hr'] },
  { label: 'Designations', icon: Briefcase, to: '/designations', roles: ['admin', 'hr'] },
  { label: 'Attendance', icon: Clock, to: '/attendance' },
  { label: 'Leaves', icon: Calendar, to: '/leaves' },
  { label: 'Payroll', icon: DollarSign, to: '/payroll', roles: ['admin', 'hr', 'employee'] },
  { label: 'Recruitment', icon: UserPlus, to: '/recruitment', roles: ['admin', 'hr'] },
  { label: 'Performance', icon: Star, to: '/performance' },
  { label: 'Training', icon: GraduationCap, to: '/training' },
  { label: 'Documents', icon: FileText, to: '/documents' },
  { label: 'Holidays', icon: Gift, to: '/holidays' },
  { label: 'Shifts', icon: Timer, to: '/shifts', roles: ['admin', 'hr'] },
  { label: 'Reports', icon: BarChart3, to: '/reports', roles: ['admin', 'hr'] },
  { label: 'Users', icon: UserCircle, to: '/users', roles: ['admin', 'hr'] },
  { label: 'Notifications', icon: Bell, to: '/notifications' },
  { label: 'Settings', icon: Settings, to: '/settings', roles: ['admin'] },
  { label: 'Audit Logs', icon: Shield, to: '/audit', roles: ['admin'] },
]

interface SidebarProps { collapsed: boolean; onClose?: () => void }

export default function Sidebar({ collapsed, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const { role } = usePermissions()

  const filteredItems = navItems.filter(item => !item.roles || item.roles.includes(role || ''))

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700 flex-shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg">HRMS</span>
          </div>
        ) : (
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center mx-auto">
            <Building className="w-5 h-5 text-white" />
          </div>
        )}
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {filteredItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-150 text-sm font-medium ${isActive ? 'bg-primary-600 text-white hover:bg-primary-700' : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-700 p-4 flex-shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-slate-400 text-xs capitalize truncate">{user?.role}</p>
            </div>
            <button onClick={logout} className="text-slate-400 hover:text-red-400 transition-colors p-1" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button onClick={logout} className="text-slate-400 hover:text-red-400 transition-colors p-1 mx-auto flex" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
