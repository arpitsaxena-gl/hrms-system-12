import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import type { DeptDataPoint } from '../lib/schemas/dashboard'

export function useDeptDistribution() {
  return useQuery<DeptDataPoint[]>({
    queryKey: ['dashboard', 'dept-distribution'],
    queryFn: async () => {
      const res = await api.get<{ data: DeptDataPoint[] }>('/dashboard/dept-distribution')
      return res.data.data
    },
    staleTime: 30_000,
  })
}
