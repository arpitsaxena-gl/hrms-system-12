import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import Layout from './components/layout/Layout'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import EmployeesPage from './pages/employees/EmployeesPage'
import EmployeeDetailPage from './pages/employees/EmployeeDetailPage'
import EmployeeFormPage from './pages/employees/EmployeeFormPage'
import DepartmentsPage from './pages/departments/DepartmentsPage'
import DesignationsPage from './pages/designations/DesignationsPage'
import AttendancePage from './pages/attendance/AttendancePage'
import LeavesPage from './pages/leaves/LeavesPage'
import PayrollPage from './pages/payroll/PayrollPage'
import RecruitmentPage from './pages/recruitment/RecruitmentPage'
import PerformancePage from './pages/performance/PerformancePage'
import TrainingPage from './pages/training/TrainingPage'
import DocumentsPage from './pages/documents/DocumentsPage'
import HolidaysPage from './pages/holidays/HolidaysPage'
import ShiftsPage from './pages/shifts/ShiftsPage'
import NotificationsPage from './pages/notifications/NotificationsPage'
import ReportsPage from './pages/reports/ReportsPage'
import ProfilePage from './pages/profile/ProfilePage'
import SettingsPage from './pages/settings/SettingsPage'
import UsersPage from './pages/users/UsersPage'
import AuditPage from './pages/audit/AuditPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token } = useAuthStore()
  if (!isAuthenticated || !token) return <Navigate to="/login" replace />
  return <>{children}</>
}

// Client-side role guard for defense-in-depth. The server remains the
// authoritative access check on every endpoint (SEC-6).
function RoleRoute({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { user } = useAuthStore()
  if (user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

const PRIVILEGED = ['admin', 'hr']
const MANAGEMENT = ['admin', 'hr', 'manager']

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  const { fetchMe, isAuthenticated } = useAuthStore()
  useEffect(() => {
    if (isAuthenticated) fetchMe()
  }, [isAuthenticated])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="employees/new" element={<RoleRoute roles={PRIVILEGED}><EmployeeFormPage /></RoleRoute>} />
          <Route path="employees/:id" element={<EmployeeDetailPage />} />
          <Route path="employees/:id/edit" element={<RoleRoute roles={PRIVILEGED}><EmployeeFormPage /></RoleRoute>} />
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="designations" element={<DesignationsPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="leaves" element={<LeavesPage />} />
          <Route path="payroll" element={<RoleRoute roles={MANAGEMENT}><PayrollPage /></RoleRoute>} />
          <Route path="recruitment" element={<RecruitmentPage />} />
          <Route path="performance" element={<PerformancePage />} />
          <Route path="training" element={<TrainingPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="holidays" element={<HolidaysPage />} />
          <Route path="shifts" element={<ShiftsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="reports" element={<RoleRoute roles={MANAGEMENT}><ReportsPage /></RoleRoute>} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<RoleRoute roles={PRIVILEGED}><SettingsPage /></RoleRoute>} />
          <Route path="users" element={<RoleRoute roles={['admin']}><UsersPage /></RoleRoute>} />
          <Route path="audit" element={<RoleRoute roles={PRIVILEGED}><AuditPage /></RoleRoute>} />
          <Route
            path="*"
            element={
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
                <p className="text-gray-500 mb-6">Page not found</p>
                <a href="/dashboard" className="btn-primary">Go to Dashboard</a>
              </div>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
