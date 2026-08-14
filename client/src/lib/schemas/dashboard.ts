import { z } from 'zod'

export const DashboardStatsSchema = z.object({
  totalEmployees: z.number(),
  presentToday: z.number(),
  presentCapacity: z.number(),
  pendingLeaves: z.number(),
  monthlyPayrollRs: z.number(),
  newJoinersThisMonth: z.number(),
  attendanceRatePercent: z.number(),
  openPositions: z.number(),
  activeEmployees: z.number(),
})

export type DashboardStats = z.infer<typeof DashboardStatsSchema>

export const AttendanceDaySchema = z.object({
  day: z.string(),
  present: z.number(),
  absent: z.number(),
  onLeave: z.number(),
})

export const AttendanceTrendSchema = z.array(AttendanceDaySchema)
export type AttendanceDay = z.infer<typeof AttendanceDaySchema>

export const DeptDataPointSchema = z.object({
  name: z.string(),
  value: z.number(),
  color: z.string(),
})

export const DeptDistributionSchema = z.array(DeptDataPointSchema)
export type DeptDataPoint = z.infer<typeof DeptDataPointSchema>
