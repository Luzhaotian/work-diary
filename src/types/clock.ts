export interface ClockRecord {
  id: string
  date: string
  clockIn?: string
  clockOut?: string
  isLeave: boolean
  leaveType?: 'full' | 'half'
  note?: string
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

export interface Holiday {
  date: string
  name: string
}