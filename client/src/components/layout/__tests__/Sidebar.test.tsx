import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { Sidebar } from '../Sidebar'

const logoutMock = vi.fn()

vi.mock('../../../hooks/usePermissions', () => ({
  usePermissions: () => ({ role: 'admin' }),
}))

vi.mock('../../../store/authStore', () => ({
  useAuthStore: () => ({ logout: logoutMock }),
}))

describe('Sidebar (SCRUM-11)', () => {
  it('renders enterprise branding and ordered navigation with Dashboard first and active', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar collapsed={false} />
      </MemoryRouter>
    )

    expect(screen.getByText('HRMS Enterprise')).toBeInTheDocument()

    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveTextContent('Dashboard')
    expect(links[0].className).toContain('bg-primary-600')

    const expectedOrder = [
      'Dashboard',
      'Employees',
      'Departments',
      'Designations',
      'Attendance',
      'Leaves',
      'Payroll',
      'Recruitment',
      'Performance',
      'Training',
      'Documents',
      'Holidays',
      'Shifts',
      'Reports',
      'Users',
      'Notifications',
      'Settings',
      'Audit Logs',
    ]

    expect(links.map((link) => link.textContent?.trim())).toEqual(expectedOrder)
  })

  it('renders admin identity and triggers logout from footer action', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar collapsed={false} />
      </MemoryRouter>
    )

    expect(screen.getByText('SA')).toBeInTheDocument()
    expect(screen.getByText('Super Admin')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }))
    expect(logoutMock).toHaveBeenCalledTimes(1)
  })
})
