import { NavLink } from 'react-router-dom'
import { usePermissions } from '../../hooks/usePermissions'
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Building2,
  Briefcase,
  Clock,
  CalendarDays,
  DollarSign,
  UserPlus,
  Star,
  GraduationCap,
  FileText,
  Gift,
  Timer,
  Bell,
  BarChart3,
  Settings,
  Shield,
  LogOut,
  Building,
  X,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Employees', icon: Users, to: '/employees' },
  { label: 'Departments', icon: Building2, to: '/departments', roles: ['admin', 'hr'] },
  { label: 'Designations', icon: Briefcase, to: '/designations', roles: ['admin', 'hr'] },
  { label: 'Attendance', icon: Clock, to: '/attendance' },
  { label: 'Leaves', icon: CalendarDays, to: '/leaves' },
  { label: 'Payroll', icon: DollarSign, to: '/payroll' },
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

interface SidebarProps {
  collapsed: boolean
  onClose?: () => void
}

export function Sidebar({ collapsed, onClose }: SidebarProps) {
  const { role } = usePermissions()
  const items = NAV_ITEMS.filter(item => !item.roles || item.roles.includes(role))

  return (
    <div className="flex h-full flex-col">
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700 flex-shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-sm leading-none">HRMS Enterprise</span>
          </div>
        )}

        {collapsed && (
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center mx-auto">
            <Building className="w-5 h-5 text-white" />
          </div>
        )}

        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 transition-colors" aria-label="Close sidebar">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition-all text-sm font-medium ${
                isActive ? 'bg-primary-600 !text-white hover:bg-primary-600 shadow-sm' : ''
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-700 p-3 flex-shrink-0">
        {collapsed ? (
          <button className="text-slate-400 hover:text-red-400 transition-colors p-2 mx-auto flex" title="Logout" aria-label="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              SA
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">Super Admin</p>
              <p className="text-slate-400 text-xs">Admin</p>
            </div>
            <button className="text-slate-400 hover:text-red-400 transition-colors p-1 flex-shrink-0" aria-label="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
