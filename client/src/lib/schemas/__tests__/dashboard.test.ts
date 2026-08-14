// SCRUM-83 — Dashboard Zod schema tests
// Verifies: AC-2, AC-3, AC-4 (field-level schema validation)

import { describe, it, expect } from 'vitest'
import {
  DashboardStatsSchema,
  AttendanceDaySchema,
  AttendanceTrendSchema,
  DeptDataPointSchema,
  DeptDistributionSchema,
} from '../dashboard'

const validStats = {
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

describe('DashboardStatsSchema', () => {
  it('accepts a fully-populated valid stats object (AC-2)', () => {
    expect(DashboardStatsSchema.safeParse(validStats).success).toBe(true)
  })

  it('rejects an object missing totalEmployees (AC-2 / field_validations.mandatory[0])', () => {
    const { totalEmployees: _omit, ...rest } = validStats
    expect(DashboardStatsSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects a string value for a numeric field (AC-2 / type guard)', () => {
    expect(
      DashboardStatsSchema.safeParse({ ...validStats, attendanceRatePercent: '73' }).success
    ).toBe(false)
  })

  it('rejects null for a required numeric field (AC-2)', () => {
    expect(
      DashboardStatsSchema.safeParse({ ...validStats, activeEmployees: null }).success
    ).toBe(false)
  })

  it('rejects an empty object (AC-2 / edge case)', () => {
    expect(DashboardStatsSchema.safeParse({}).success).toBe(false)
  })
})

const validDay = { day: 'Mon', present: 5, absent: 2, onLeave: 1 }

describe('AttendanceDaySchema', () => {
  it('accepts a valid attendance day record (AC-3)', () => {
    expect(AttendanceDaySchema.safeParse(validDay).success).toBe(true)
  })

  it('rejects a record missing the day field (AC-3 / mandatory)', () => {
    const { day: _omit, ...rest } = validDay
    expect(AttendanceDaySchema.safeParse(rest).success).toBe(false)
  })

  it('rejects a non-numeric present count (AC-3 / type guard)', () => {
    expect(AttendanceDaySchema.safeParse({ ...validDay, present: 'five' }).success).toBe(false)
  })
})

describe('AttendanceTrendSchema', () => {
  it('accepts an array of valid attendance day records (AC-3)', () => {
    const data = [
      { day: 'Mon', present: 5, absent: 1, onLeave: 0 },
      { day: 'Tue', present: 6, absent: 0, onLeave: 2 },
    ]
    expect(AttendanceTrendSchema.safeParse(data).success).toBe(true)
  })

  it('accepts an empty array (AC-3 / edge case)', () => {
    expect(AttendanceTrendSchema.safeParse([]).success).toBe(true)
  })

  it('rejects an array that contains an invalid item (AC-3)', () => {
    expect(
      AttendanceTrendSchema.safeParse([{ day: 'Mon', present: 'bad', absent: 0, onLeave: 0 }]).success
    ).toBe(false)
  })
})

const validDept = { name: 'Engineering', value: 5, color: '#3B82F6' }

describe('DeptDataPointSchema', () => {
  it('accepts a valid department data point (AC-4)', () => {
    expect(DeptDataPointSchema.safeParse(validDept).success).toBe(true)
  })

  it('rejects a record missing name (AC-4 / mandatory)', () => {
    const { name: _omit, ...rest } = validDept
    expect(DeptDataPointSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects a non-numeric value field (AC-4 / type guard)', () => {
    expect(DeptDataPointSchema.safeParse({ ...validDept, value: 'five' }).success).toBe(false)
  })
})

describe('DeptDistributionSchema', () => {
  it('accepts an array of valid department data points (AC-4)', () => {
    const data = [
      { name: 'Engineering', value: 5, color: '#3B82F6' },
      { name: 'Design', value: 3, color: '#8B5CF6' },
    ]
    expect(DeptDistributionSchema.safeParse(data).success).toBe(true)
  })

  it('accepts an empty array (AC-4 / edge case — no departments)', () => {
    expect(DeptDistributionSchema.safeParse([]).success).toBe(true)
  })
})
