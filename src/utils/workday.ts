import { isWorkday as libIsWorkday, isHoliday as libIsHoliday, getFestival } from 'chinese-workday'
import { getWeekMonday, weeksBetweenMondays, parseLocalDate } from '@/utils/date'
import {
  getBiweeklyAnchorDate,
  getBiweeklyAnchorType,
  getSingleRestDay,
  getUseHolidays,
  getWeekendMode,
  type BiweeklyWeekType,
  type WeekendMode,
} from '@/utils/storage'

/*
 * 依赖说明：chinese-workday 内置的是静态节假日表（当前覆盖 2010–2026）。
 * 超出覆盖范围的年份，该库只会把周末当假日，法定节假日与调休一律识别不到
 * （例如 2027-01-01 元旦会被判为「工作日」）。日历/统计对这类年份只能给出
 * 近似结果，需等依赖更新数据表。
 */

function getDayOfWeek(dateStr: string): number {
  return parseLocalDate(dateStr).getDay()
}

function isSingleRestDayOfWeek(day: number): boolean {
  return getSingleRestDay() === 'saturday' ? day === 6 : day === 0
}

/**
 * 大小周：该日期所在周是大周还是小周。
 *
 * @param overrides 可选，直接传入参考日期/类型（供响应式组件用本地 ref 计算，
 *   避免依赖 storage 缓存导致 computed 追踪不到依赖）。不传则从设置读取。
 */
export function getBiweeklyWeekType(
  dateStr: string,
  overrides?: { anchorDate?: string; anchorType?: BiweeklyWeekType },
): BiweeklyWeekType {
  const monday = getWeekMonday(dateStr)
  const anchorMonday = getWeekMonday(overrides?.anchorDate ?? getBiweeklyAnchorDate())
  const weeks = weeksBetweenMondays(anchorMonday, monday)
  const sameAsAnchor = weeks % 2 === 0
  const anchorIsBig = (overrides?.anchorType ?? getBiweeklyAnchorType()) === 'big'
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
 *
 * 注：设置项已在 storage 层做模块级缓存，日历逐日调用不再产生同步 IO。
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
  // 「周末」「工作日」是库对普通日子的兜底返回值，不是节日名，不应展示成节假日标签
  const name = getFestival(dateStr)
  return name && name !== '周末' && name !== '工作日' ? name : undefined
}

export function countWorkdaysInMonth(year: number, month: number): number {
  let count = 0
  const daysInMonth = new Date(year, month, 0).getDate()
  const prefix = `${year}-${String(month).padStart(2, '0')}`

  for (let day = 1; day <= daysInMonth; day++) {
    if (isWorkdayFromLib(`${prefix}-${String(day).padStart(2, '0')}`)) count++
  }

  return count
}
