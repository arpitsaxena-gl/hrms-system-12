import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import type { AttendanceDay } from '../lib/schemas/dashboard'

export function useAttendanceTrend() {
  return useQuery<AttendanceDay[]>({
    queryKey: ['dashboard', 'attendance-trend'],
    queryFn: async () => {
      const res = await api.get<{ data: AttendanceDay[] }>('/dashboard/attendance-trend')
      return res.data.data
    },
    staleTime: 30_000,
  })
}
