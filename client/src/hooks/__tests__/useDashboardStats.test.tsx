// SCRUM-83 — useDashboardStats hook tests
// Verifies: AC-2 (live data returned from API), AC-6 (error state propagated)

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDashboardStats } from '../useDashboardStats'

vi.mock('../../lib/axios', () => ({
  default: { get: vi.fn() },
}))

import api from '../../lib/axios'

const mockStats = {
  totalEmployees: 11,
  presentToday: 8,
  presentCapacity: 11,
  pendingLeaves: 2,
  monthlyPayrollRs: 220000,
  newJoinersThisMonth: 1,
  attendanceRatePercent: 73,
  openPositions: 3,
  activeEmployees: 10,
}

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useDashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns dashboard stats data on a successful API call (AC-2)', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { data: mockStats } })

    const { result } = renderHook(() => useDashboardStats(), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockStats)
    expect(vi.mocked(api.get)).toHaveBeenCalledWith('/dashboard/stats')
  })

  it('sets isError to true when the API call rejects (AC-6)', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useDashboardStats(), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.data).toBeUndefined()
  })

  it('stores the result under the ["dashboard", "stats"] query key (AC-2 / caching)', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { data: mockStats } })

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useDashboardStats(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = queryClient.getQueryData(['dashboard', 'stats'])
    expect(cached).toEqual(mockStats)
  })
})
