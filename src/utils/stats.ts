import type { MonthlyStats } from '@/types/clock'
import { getRecordsByMonth } from '@/utils/storage'
import { countWorkdaysInMonth } from '@/utils/workday'
import { calcHours } from '@/utils/time'

export function calcMonthlyStats(year: number, month: number): MonthlyStats {
  const records = getRecordsByMonth(year, month)
  const totalWorkDays = countWorkdaysInMonth(year, month)
  let actualWorkDays = 0
  let leaveDays = 0
  let totalHours = 0

  records.forEach((r) => {
    if (r.isLeave) {
      leaveDays += r.leaveType === 'half' ? 0.5 : 1
    } else if (r.clockIn && r.clockOut) {
      actualWorkDays++
      totalHours += calcHours(r.clockIn, r.clockOut)
    }
  })

  return {
    year,
    month,
    totalWorkDays,
    actualWorkDays,
    leaveDays,
    totalHours,
    averageHours: actualWorkDays > 0 ? parseFloat((totalHours / actualWorkDays).toFixed(1)) : 0,
  }
}
