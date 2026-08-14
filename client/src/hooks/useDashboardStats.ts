import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import type { DashboardStats } from '../lib/schemas/dashboard'

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const res = await api.get<{ data: DashboardStats }>('/dashboard/stats')
      return res.data.data
    },
    staleTime: 30_000,
  })
}
