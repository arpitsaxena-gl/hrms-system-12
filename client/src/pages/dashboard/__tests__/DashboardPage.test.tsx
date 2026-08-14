// SCRUM-83 — DashboardPage integration tests
// Verifies: AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-8

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import DashboardPage from '../DashboardPage'

// Recharts uses SVG APIs not available in jsdom — stub out with divs
vi.mock('recharts', () => ({
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => null,
  Cell: () => null,
}))

// Fix date to produce a deterministic subtitle
vi.mock('date-fns', () => ({
  format: vi.fn(() => 'Friday, July 24th 2026'),
}))

vi.mock('../../../hooks/useDashboardStats')
vi.mock('../../../hooks/useAttendanceTrend')
vi.mock('../../../hooks/useDeptDistribution')

import { useDashboardStats } from '../../../hooks/useDashboardStats'
import { useAttendanceTrend } from '../../../hooks/useAttendanceTrend'
import { useDeptDistribution } from '../../../hooks/useDeptDistribution'

// ---- Fixtures ----

const mockStats = {
  totalEmployees: 11,
  presentToday: 0,
  presentCapacity: 10,
  pendingLeaves: 0,
  monthlyPayrollRs: 220000,
  newJoinersThisMonth: 0,
  attendanceRatePercent: 0,
  openPositions: 0,
  activeEmployees: 10,
}

const mockTrend = [
  { day: 'Mon', present: 5, absent: 2, onLeave: 1 },
  { day: 'Tue', present: 6, absent: 1, onLeave: 0 },
]

const mockDept = [
  { name: 'Engineering', value: 5, color: '#3B82F6' },
  { name: 'Design', value: 3, color: '#8B5CF6' },
]

// ---- State helpers ----

function setupLoading() {
  const noopRefetch = vi.fn()
  vi.mocked(useDashboardStats).mockReturnValue({
    isLoading: true, isError: false, data: undefined, refetch: noopRefetch,
  } as ReturnType<typeof useDashboardStats>)
  vi.mocked(useAttendanceTrend).mockReturnValue({
    isLoading: true, isError: false, data: undefined, refetch: noopRefetch,
  } as ReturnType<typeof useAttendanceTrend>)
  vi.mocked(useDeptDistribution).mockReturnValue({
    isLoading: true, isError: false, data: undefined, refetch: noopRefetch,
  } as ReturnType<typeof useDeptDistribution>)
}

function setupSuccess(statsOverride?: Partial<typeof mockStats>) {
  const noopRefetch = vi.fn()
  vi.mocked(useDashboardStats).mockReturnValue({
    isLoading: false, isError: false,
    data: { ...mockStats, ...statsOverride },
    refetch: noopRefetch,
  } as ReturnType<typeof useDashboardStats>)
  vi.mocked(useAttendanceTrend).mockReturnValue({
    isLoading: false, isError: false, data: mockTrend, refetch: noopRefetch,
  } as ReturnType<typeof useAttendanceTrend>)
  vi.mocked(useDeptDistribution).mockReturnValue({
    isLoading: false, isError: false, data: mockDept, refetch: noopRefetch,
  } as ReturnType<typeof useDeptDistribution>)
}

function setupStatsError() {
  const refetch = vi.fn()
  vi.mocked(useDashboardStats).mockReturnValue({
    isLoading: false, isError: true, data: undefined, refetch,
  } as ReturnType<typeof useDashboardStats>)
  vi.mocked(useAttendanceTrend).mockReturnValue({
    isLoading: false, isError: false, data: mockTrend, refetch: vi.fn(),
  } as ReturnType<typeof useAttendanceTrend>)
  vi.mocked(useDeptDistribution).mockReturnValue({
    isLoading: false, isError: false, data: mockDept, refetch: vi.fn(),
  } as ReturnType<typeof useDeptDistribution>)
  return refetch
}

function setupTrendError() {
  const refetch = vi.fn()
  vi.mocked(useDashboardStats).mockReturnValue({
    isLoading: false, isError: false, data: mockStats, refetch: vi.fn(),
  } as ReturnType<typeof useDashboardStats>)
  vi.mocked(useAttendanceTrend).mockReturnValue({
    isLoading: false, isError: true, data: undefined, refetch,
  } as ReturnType<typeof useAttendanceTrend>)
  vi.mocked(useDeptDistribution).mockReturnValue({
    isLoading: false, isError: false, data: mockDept, refetch: vi.fn(),
  } as ReturnType<typeof useDeptDistribution>)
  return refetch
}

function setupDeptError() {
  const refetch = vi.fn()
  vi.mocked(useDashboardStats).mockReturnValue({
    isLoading: false, isError: false, data: mockStats, refetch: vi.fn(),
  } as ReturnType<typeof useDashboardStats>)
  vi.mocked(useAttendanceTrend).mockReturnValue({
    isLoading: false, isError: false, data: mockTrend, refetch: vi.fn(),
  } as ReturnType<typeof useAttendanceTrend>)
  vi.mocked(useDeptDistribution).mockReturnValue({
    isLoading: false, isError: true, data: undefined, refetch,
  } as ReturnType<typeof useDeptDistribution>)
  return refetch
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// ---- Tests ----

describe('DashboardPage — page header', () => {
  beforeEach(() => setupSuccess())

  it('renders the h1 heading "Dashboard" (AC-1)', () => {
    render(<DashboardPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Dashboard')
  })

  it('renders welcome subtitle with deterministic formatted date (AC-1)', () => {
    render(<DashboardPage />)
    expect(screen.getByText(/Welcome back, Super!/)).toBeInTheDocument()
    expect(screen.getByText(/Friday, July 24th 2026/)).toBeInTheDocument()
  })
})

describe('DashboardPage — loading / skeleton states', () => {
  beforeEach(() => setupLoading())

  it('renders exactly 8 stat card skeletons while stats load (AC-5)', () => {
    render(<DashboardPage />)
    const skeletons = screen.getAllByLabelText('Loading stat card')
    expect(skeletons).toHaveLength(8)
  })

  it('renders at least one chart skeleton while chart data loads (AC-5)', () => {
    render(<DashboardPage />)
    const chartSkeletons = screen.getAllByLabelText('Loading chart data')
    expect(chartSkeletons.length).toBeGreaterThanOrEqual(1)
  })

  it('does not render any stat card labels while loading (AC-5)', () => {
    render(<DashboardPage />)
    expect(screen.queryByText('Total Employees')).not.toBeInTheDocument()
  })
})

describe('DashboardPage — stat cards happy path', () => {
  beforeEach(() => setupSuccess())

  it('renders all 8 stat card label texts (AC-2)', () => {
    render(<DashboardPage />)
    const expected = [
      'Total Employees', 'Present Today', 'Pending Leaves', 'Monthly Payroll',
      'New Joiners (Month)', 'Attendance Rate', 'Open Positions', 'Active Employees',
    ]
    expected.forEach(label => expect(screen.getByText(label)).toBeInTheDocument())
  })

  it('displays totalEmployees value "11" from API (AC-2)', () => {
    render(<DashboardPage />)
    expect(screen.getByText('11')).toBeInTheDocument()
  })

  it('displays presentToday / presentCapacity as "0 / 10" (AC-2)', () => {
    render(<DashboardPage />)
    expect(screen.getByText('0 / 10')).toBeInTheDocument()
  })

  it('renders subtext "↗ 5% vs last month" for Total Employees (AC-2 / discriminated union subtext)', () => {
    render(<DashboardPage />)
    expect(screen.getByText('↗ 5% vs last month')).toBeInTheDocument()
  })

  it('displays attendanceRatePercent as "0%" (AC-2)', () => {
    render(<DashboardPage />)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })
})

describe('DashboardPage — formatPayroll helper (AC-2 / field-level boundary)', () => {
  it('formats 220000 as Rs.2.2L (≥100K branch)', () => {
    setupSuccess()
    render(<DashboardPage />)
    expect(screen.getByText('Rs.2.2L')).toBeInTheDocument()
  })

  it('formats 100000 as Rs.1.0L (exactly 100K boundary)', () => {
    setupSuccess({ monthlyPayrollRs: 100000 })
    render(<DashboardPage />)
    expect(screen.getByText('Rs.1.0L')).toBeInTheDocument()
  })

  it('formats 1000 as Rs.1.0K (1K–100K branch)', () => {
    setupSuccess({ monthlyPayrollRs: 1000 })
    render(<DashboardPage />)
    expect(screen.getByText('Rs.1.0K')).toBeInTheDocument()
  })

  it('formats 500 as Rs.500 (<1K branch)', () => {
    setupSuccess({ monthlyPayrollRs: 500 })
    render(<DashboardPage />)
    expect(screen.getByText('Rs.500')).toBeInTheDocument()
  })
})

describe('DashboardPage — inline error states', () => {
  it('shows error message and a single Try again button when stats API fails (AC-6)', () => {
    setupStatsError()
    render(<DashboardPage />)
    expect(screen.getByText('Could not load dashboard stats.')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Try again/i })).toHaveLength(1)
  })

  it('calls stats refetch when Try again is clicked after stats failure (AC-6)', () => {
    const refetch = setupStatsError()
    render(<DashboardPage />)
    fireEvent.click(screen.getByRole('button', { name: /Try again/i }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('shows "Could not load attendance trend." when trend API fails (AC-6)', () => {
    setupTrendError()
    render(<DashboardPage />)
    expect(screen.getByText('Could not load attendance trend.')).toBeInTheDocument()
  })

  it('shows "Could not load department data." when dept API fails (AC-6)', () => {
    setupDeptError()
    render(<DashboardPage />)
    expect(screen.getByText('Could not load department data.')).toBeInTheDocument()
  })
})

describe('DashboardPage — Attendance Trend chart section', () => {
  beforeEach(() => setupSuccess())

  it('renders the "Attendance Trend" section heading (AC-3)', () => {
    render(<DashboardPage />)
    expect(screen.getByRole('heading', { level: 2, name: 'Attendance Trend' })).toBeInTheDocument()
  })

  it('renders chart legend items: Absent, On Leave, Present (AC-3)', () => {
    render(<DashboardPage />)
    expect(screen.getByText('Absent')).toBeInTheDocument()
    expect(screen.getByText('On Leave')).toBeInTheDocument()
    expect(screen.getByText('Present')).toBeInTheDocument()
  })

  it('attendance trend container has role="img" with descriptive aria-label (AC-8)', () => {
    render(<DashboardPage />)
    expect(
      screen.getByRole('img', {
        name: /Attendance trend area chart showing present, absent, and on-leave/i,
      })
    ).toBeInTheDocument()
  })
})

describe('DashboardPage — By Department chart section', () => {
  beforeEach(() => setupSuccess())

  it('renders the "By Department" section heading (AC-4)', () => {
    render(<DashboardPage />)
    expect(screen.getByRole('heading', { level: 2, name: 'By Department' })).toBeInTheDocument()
  })

  it('renders department names from API data in the legend (AC-4)', () => {
    render(<DashboardPage />)
    expect(screen.getByText('Engineering')).toBeInTheDocument()
    expect(screen.getByText('Design')).toBeInTheDocument()
  })

  it('renders department employee counts from API data (AC-4)', () => {
    render(<DashboardPage />)
    // Engineering=5, Design=3 — unique values in this fixture
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('dept chart container has role="img" with count in aria-label (AC-4 + AC-8)', () => {
    render(<DashboardPage />)
    expect(
      screen.getByRole('img', {
        name: /Department distribution donut chart showing 2 departments/i,
      })
    ).toBeInTheDocument()
  })
})
