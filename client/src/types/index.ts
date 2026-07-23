export interface User {
  _id: string
  firstName: string
  lastName: string
  fullName?: string
  email: string
  role: 'admin' | 'hr' | 'manager' | 'employee'
  isActive: boolean
  avatar?: string | null
  phone?: string
  employee?: Employee | null
  lastLogin?: string
  preferences?: {
    theme: string
    language: string
    notifications: { email: boolean; push: boolean }
    timezone: string
  }
  createdAt: string
  updatedAt: string
}

export interface Employee {
  _id: string
  employeeId: string
  user: User
  department: Department
  designation: Designation
  manager?: Employee | null
  shift?: Shift | null
  dateOfBirth?: string
  gender?: string
  maritalStatus?: string
  bloodGroup?: string
  nationality?: string
  phone?: string
  personalEmail?: string
  joiningDate: string
  confirmationDate?: string
  employmentType: string
  employmentStatus: string
  probationPeriod?: number
  noticePeriod?: number
  currentAddress?: Address
  permanentAddress?: Address
  emergencyContact?: EmergencyContact
  bankDetails?: BankDetails
  skills?: string[]
  qualifications?: Array<{ degree: string; institution: string; year: number; grade: string }>
  salary?: Salary
  leaveBalance?: LeaveBalance
  documents?: Document[]
  age?: number
  yearsOfService?: number
  createdAt: string
}

export interface Department {
  _id: string
  name: string
  code: string
  description?: string
  head?: Employee | null
  budget?: number
  isActive: boolean
  color?: string
  employeeCount?: number
  createdAt: string
}

export interface Designation {
  _id: string
  name: string
  code: string
  department?: Department
  level: number
  description?: string
  salaryRange?: { min: number; max: number; currency: string }
  isActive: boolean
  createdAt: string
}

export interface Attendance {
  _id: string
  employee: Employee
  date: string
  checkIn?: string
  checkOut?: string
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave' | 'holiday' | 'work_from_home'
  workHours?: number
  overtime?: number
  lateMinutes?: number
  isRemote?: boolean
  notes?: string
  createdAt: string
}

export interface Leave {
  _id: string
  employee: Employee
  leaveType: string
  startDate: string
  endDate: string
  totalDays: number
  isHalfDay: boolean
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  approvedBy?: User
  approvedAt?: string
  rejectionReason?: string
  createdAt: string
}

export interface Payroll {
  _id: string
  employee: Employee
  month: number
  year: number
  earnings: {
    basic: number; hra: number; da: number; ta: number; medical: number
    overtime: number; bonus: number; incentive: number; other: number; grossEarnings: number
  }
  deductions: {
    pf: number; esi: number; tds: number; professionalTax: number
    loanRepayment: number; leave: number; other: number; totalDeductions: number
  }
  attendanceSummary: {
    totalDays: number; presentDays: number; absentDays: number
    leaveDays: number; holidays: number; workingDays: number; overtimeHours: number
  }
  netSalary: number
  status: 'draft' | 'processed' | 'paid' | 'cancelled'
  paymentDate?: string
  paymentMethod?: string
  transactionId?: string
  createdAt: string
}

export interface Job {
  _id: string
  title: string
  department: Department
  designation?: Designation
  vacancies: number
  description: string
  status: 'open' | 'in_progress' | 'closed' | 'on_hold'
  deadline?: string
  closingDate?: string
  jobType: string
  experienceMin?: number
  experienceMax?: number
  salaryMin?: number
  salaryMax?: number
  requirements?: string[]
  salaryRange?: { min: number; max: number; currency: string }
  applicationCount?: number
  createdAt: string
}

export interface Application {
  _id: string
  job: Job
  applicantName: string
  email: string
  phone?: string
  status: string
  experience?: number
  currentSalary?: number
  expectedSalary?: number
  source: string
  resumeUrl?: string
  createdAt: string
}

export interface Performance {
  _id: string
  employee: Employee | any
  reviewer: Employee | any
  reviewPeriod: { from?: string; to?: string; type?: string; year?: number; quarter?: number }
  finalRating?: number
  overallRating?: number
  grade?: string
  status: 'draft' | 'submitted' | 'reviewed' | 'acknowledged'
  competencies?: Array<{ name: string; rating: number; comments?: string }>
  goals?: Array<{ title: string; description?: string; targetDate?: string; status?: string; rating?: number }>
  comments?: string
  reviewDate?: string
  selfAssessment?: { achievements?: string; areasForImprovement?: string; overallRating?: number }
  managerAssessment?: { strengths?: string; developmentPlan?: string; overallRating?: number; recommendation?: string }
  createdAt: string
}
export type PerformanceReview = Performance

export interface Training {
  _id: string
  title: string
  description?: string
  category: string
  type: string
  startDate: string
  endDate: string
  venue?: string
  maxParticipants: number
  cost?: number
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
  isMandatory: boolean
  participants: Array<{ employee: Employee; status: string; attendance: boolean; score?: number }>
  trainer?: { name: string; organization: string }
  createdAt: string
}

export interface Document {
  _id: string
  employee: Employee
  title: string
  type: string
  filename: string
  originalName?: string
  url: string
  size?: number
  mimeType?: string
  isVerified: boolean
  fileUrl?: string
  verificationStatus?: string
  expiryDate?: string
  description?: string
  createdAt: string
}

export interface Holiday {
  _id: string
  name: string
  date: string
  type: 'public' | 'optional' | 'restricted'
  description?: string
  year: number
}

export interface Shift {
  _id: string
  name: string
  code: string
  type: string
  startTime: string
  endTime: string
  breakDuration: number
  workHours: number
  weeklyOff: string[]
  weeklyOffs?: string[]
  isActive: boolean
  gracePeriod: number
  color?: string
}

export interface Notification {
  _id: string
  recipient: string
  sender?: User
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  category: string
  isRead: boolean
  readAt?: string
  link?: string
  createdAt: string
}

export interface AuditLog {
  _id: string
  user: User
  action: string
  module: string
  resourceId?: string
  ipAddress?: string
  method?: string
  url?: string
  statusCode?: number
  duration?: number
  description?: string
  createdAt: string
}

export interface Address {
  street?: string; city?: string; state?: string; country?: string; zipCode?: string
}
export interface EmergencyContact {
  name?: string; relationship?: string; phone?: string; email?: string
}
export interface BankDetails {
  bankName?: string; accountNumber?: string; ifscCode?: string; accountType?: string
}
export interface Salary {
  basic: number; hra: number; da: number; ta: number; medical: number
  other: number; gross: number; currency: string
}
export interface LeaveBalance {
  annual: number; sick: number; casual: number; compensatory: number
}

export interface PaginationInfo {
  total: number; page: number; limit: number; totalPages: number
  hasNextPage: boolean; hasPrevPage: boolean
}

export interface ApiResponse<T> {
  success: boolean; message: string; data: T
}
export interface PaginatedApiResponse<T> {
  success: boolean; message: string; data: T[]
  pagination: PaginationInfo
}
