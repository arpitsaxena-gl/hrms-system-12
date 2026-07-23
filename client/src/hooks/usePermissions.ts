import { useAuthStore } from '../store/authStore'

export function usePermissions() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'employee'

  return {
    role,
    isAdmin: role === 'admin',
    isHR: role === 'hr',
    isManager: role === 'manager',
    isEmployee: role === 'employee',
    canManageUsers: ['admin', 'hr'].includes(role),
    canManageEmployees: ['admin', 'hr'].includes(role),
    canApproveLeaves: ['admin', 'hr', 'manager'].includes(role),
    canManagePayroll: ['admin', 'hr'].includes(role),
    canViewReports: ['admin', 'hr'].includes(role),
    canManageSettings: role === 'admin',
    canViewAuditLogs: role === 'admin',
    hasRole: (roles: string[]) => roles.includes(role),
  }
}
