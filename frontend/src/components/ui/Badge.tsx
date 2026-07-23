interface BadgeProps {
  children: React.ReactNode
  variant?: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple' | 'orange'
  size?: 'sm' | 'md'
}

const variants = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-emerald-100 text-emerald-700',
  yellow: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  gray: 'bg-gray-100 text-gray-600',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700'
}

export default function Badge({ children, variant = 'gray', size = 'md' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs'}`}>
      {children}
    </span>
  )
}

export const getStatusBadge = (status: string) => {
  const map: Record<string, { variant: BadgeProps['variant']; label: string }> = {
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
    work_from_home: { variant: 'blue', label: 'WFH' },
    open: { variant: 'green', label: 'Open' },
    closed: { variant: 'gray', label: 'Closed' },
    in_progress: { variant: 'blue', label: 'In Progress' },
    on_hold: { variant: 'yellow', label: 'On Hold' },
    draft: { variant: 'gray', label: 'Draft' },
    processed: { variant: 'blue', label: 'Processed' },
    paid: { variant: 'green', label: 'Paid' },
    full_time: { variant: 'blue', label: 'Full Time' },
    part_time: { variant: 'purple', label: 'Part Time' },
    contract: { variant: 'orange', label: 'Contract' },
    intern: { variant: 'yellow', label: 'Intern' },
    completed: { variant: 'green', label: 'Completed' },
    upcoming: { variant: 'blue', label: 'Upcoming' },
    ongoing: { variant: 'yellow', label: 'Ongoing' },
    public: { variant: 'green', label: 'Public' },
    optional: { variant: 'blue', label: 'Optional' },
    restricted: { variant: 'yellow', label: 'Restricted' }
  }
  const item = map[status] || { variant: 'gray' as const, label: status }
  return <Badge variant={item.variant}>{item.label}</Badge>
}
