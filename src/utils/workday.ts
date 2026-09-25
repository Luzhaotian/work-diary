import { isWorkday as libIsWorkday, isHoliday as libIsHoliday, getFestival } from 'chinese-workday'
import { getWeekMonday, weeksBetweenMondays } from '@/utils/date'
import {
  getBiweeklyAnchorDate,
  getBiweeklyAnchorType,
  getSingleRestDay,
  getUseHolidays,
  getWeekendMode,
  type BiweeklyWeekType,
  type WeekendMode,
} from '@/utils/storage'

function getDayOfWeek(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

function isSingleRestDayOfWeek(day: number): boolean {
  return getSingleRestDay() === 'saturday' ? day === 6 : day === 0
}

/** 大小周：该日期所在周是大周还是小周 */
export function getBiweeklyWeekType(dateStr: string): BiweeklyWeekType {
  const monday = getWeekMonday(dateStr)
  const anchorMonday = getWeekMonday(getBiweeklyAnchorDate())
  const weeks = weeksBetweenMondays(anchorMonday, monday)
  const sameAsAnchor = weeks % 2 === 0
  const anchorIsBig = getBiweeklyAnchorType() === 'big'
  if (sameAsAnchor) return anchorIsBig ? 'big' : 'small'
  return anchorIsBig ? 'small' : 'big'
}

/** 按休息制度判断是否为周末休息日（不含法定节假日） */
export function isWeekendRest(dateStr: string, mode?: WeekendMode): boolean {
  const weekendMode = mode ?? getWeekendMode()
  const day = getDayOfWeek(dateStr)
  if (weekendMode === 'double') return day === 0 || day === 6
  if (weekendMode === 'single') return isSingleRestDayOfWeek(day)
  if (weekendMode === 'biweekly') {
    const weekType = getBiweeklyWeekType(dateStr)
    if (weekType === 'big') return day === 0 || day === 6
    return isSingleRestDayOfWeek(day)
  }
  return false
}

/**
 * 是否为工作日。
 * - 开启法定节假日：放假日休息；调休周末仍上班；其余按休息制度
 * - 关闭法定节假日：仅按双休/单休/大小周/无休
 */
export function isWorkdayFromLib(dateStr: string): boolean {
  if (getUseHolidays()) {
    if (libIsHoliday(dateStr)) return false
    if (isWeekendRest(dateStr)) return libIsWorkday(dateStr)
    return true
  }
  return !isWeekendRest(dateStr)
}

/** 是否为法定节假日（关闭设置时恒为 false） */
export function isHolidayFromLib(dateStr: string): boolean {
  if (!getUseHolidays()) return false
  return libIsHoliday(dateStr)
}

/** 周末休息日且当天不上班（排除调休上班） */
export function isRestWeekend(dateStr: string): boolean {
  return isWeekendRest(dateStr) && !isWorkdayFromLib(dateStr)
}

export function getFestivalName(dateStr: string): string | undefined {
  if (!getUseHolidays()) return undefined
  return getFestival(dateStr)
}

export function countWorkdaysInMonth(year: number, month: number): number {
  let count = 0
  const daysInMonth = new Date(year, month, 0).getDate()

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (isWorkdayFromLib(dateStr)) {
      count++
    }
  }

  return count
}
