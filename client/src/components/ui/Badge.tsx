import type { ReactNode } from 'react'

type Variant = 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple' | 'orange' | 'cyan' | 'pink'

const VARIANTS: Record<Variant, string> = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-emerald-100 text-emerald-700',
  yellow: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  gray: 'bg-gray-100 text-gray-600',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
  cyan: 'bg-cyan-100 text-cyan-700',
  pink: 'bg-pink-100 text-pink-700',
}

interface BadgeProps { children: ReactNode; variant?: Variant; className?: string }

export function Badge({ children, variant = 'gray', className = '' }: BadgeProps) {
  return (
    <span className={`badge ${VARIANTS[variant]} ${className}`}>{children}</span>
  )
}

const STATUS_MAP: Record<string, { variant: Variant; label: string }> = {
  active: { variant: 'green', label: 'Active' },
  inactive: { variant: 'gray', label: 'Inactive' },
  on_probation: { variant: 'yellow', label: 'Probation' },
  terminated: { variant: 'red', label: 'Terminated' },
  resigned: { variant: 'red', label: 'Resigned' },
  pending: { variant: 'yellow', label: 'Pending' },
  approved: { variant: 'green', label: 'Approved' },
  rejected: { variant: 'red', label: 'Rejected' },
  cancelled: { variant: 'gray', label: 'Cancelled' },
  present: { variant: 'green', label: 'Present' },
  absent: { variant: 'red', label: 'Absent' },
  late: { variant: 'yellow', label: 'Late' },
  half_day: { variant: 'orange', label: 'Half Day' },
  on_leave: { variant: 'blue', label: 'On Leave' },
  holiday: { variant: 'purple', label: 'Holiday' },
  work_from_home: { variant: 'cyan', label: 'WFH' },
  open: { variant: 'green', label: 'Open' },
  closed: { variant: 'gray', label: 'Closed' },
  in_progress: { variant: 'blue', label: 'In Progress' },
  on_hold: { variant: 'yellow', label: 'On Hold' },
  draft: { variant: 'gray', label: 'Draft' },
  processed: { variant: 'blue', label: 'Processed' },
  paid: { variant: 'green', label: 'Paid' },
  submitted: { variant: 'blue', label: 'Submitted' },
  reviewed: { variant: 'purple', label: 'Reviewed' },
  acknowledged: { variant: 'green', label: 'Acknowledged' },
  scheduled: { variant: 'blue', label: 'Scheduled' },
  ongoing: { variant: 'cyan', label: 'Ongoing' },
  completed: { variant: 'green', label: 'Completed' },
  full_time: { variant: 'blue', label: 'Full Time' },
  part_time: { variant: 'purple', label: 'Part Time' },
  contract: { variant: 'orange', label: 'Contract' },
  intern: { variant: 'yellow', label: 'Intern' },
  freelance: { variant: 'pink', label: 'Freelance' },
  annual: { variant: 'blue', label: 'Annual' },
  sick: { variant: 'red', label: 'Sick' },
  casual: { variant: 'orange', label: 'Casual' },
  public: { variant: 'green', label: 'Public' },
  optional: { variant: 'yellow', label: 'Optional' },
  restricted: { variant: 'gray', label: 'Restricted' },
  info: { variant: 'blue', label: 'Info' },
  warning: { variant: 'yellow', label: 'Warning' },
  success: { variant: 'green', label: 'Success' },
  error: { variant: 'red', label: 'Error' },
}

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status] ?? { variant: 'gray' as Variant, label: status }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
