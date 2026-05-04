import { isWorkday, isHoliday, getFestival } from 'chinese-workday'

export function isWorkdayFromLib(date: string): boolean {
  return isWorkday(date)
}

export function isHolidayFromLib(date: string): boolean {
  return isHoliday(date)
}

export function getFestivalName(date: string): string | undefined {
  return getFestival(date)
}

export function countWorkdaysInMonth(year: number, month: number): number {
  let count = 0
  const daysInMonth = new Date(year, month, 0).getDate()

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (isWorkday(dateStr)) {
      count++
    }
  }

  return count
}
