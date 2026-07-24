import { render, screen } from '@testing-library/react'
import DashboardPage from '../DashboardPage'

describe('DashboardPage (SCRUM-11)', () => {
  it('renders dashboard heading, greeting, and chart section titles', () => {
    render(<DashboardPage />)

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('Welcome back, Super! Friday, July 24th 2026')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Attendance Trend' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'By Department' })).toBeInTheDocument()
  })

  it('renders all KPI cards with expected values and legends', () => {
    render(<DashboardPage />)

    const expectedStats = [
      ['Total Employees', '11'],
      ['Present Today', '0 / 10'],
      ['Pending Leaves', '0'],
      ['Monthly Payroll', 'Rs.2.2L'],
      ['New Joiners (Month)', '0'],
      ['Attendance Rate', '0%'],
      ['Open Positions', '0'],
      ['Active Employees', '10'],
    ]

    expectedStats.forEach(([label, value]) => {
      expect(screen.getByText(label)).toBeInTheDocument()
      expect(screen.getByText(value)).toBeInTheDocument()
    })

    expect(screen.getByText('↗ 5% vs last month')).toBeInTheDocument()

    expect(screen.getByText('Absent')).toBeInTheDocument()
    expect(screen.getByText('On Leave')).toBeInTheDocument()
    expect(screen.getByText('Present')).toBeInTheDocument()

    ;['Design', 'Engineering', 'Finance', 'Human Resources', 'Marketing'].forEach((department) => {
      expect(screen.getByText(department)).toBeInTheDocument()
    })
  })
})
