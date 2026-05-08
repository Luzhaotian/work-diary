export interface ClockRecord {
  id: string
  date: string
  clockIn?: string
  clockOut?: string
  isLeave: boolean
  leaveType?: 'full' | 'half'
}

export interface MonthlyStats {
  year: number
  month: number
  totalWorkDays: number
  actualWorkDays: number
  leaveDays: number
  totalHours: number
  averageHours: number
}
