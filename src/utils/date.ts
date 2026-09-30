export type WeekdayType = 'short' | 'full' | 'min' | 'num'

/** 获取本地日期字符串 "YYYY-MM-DD"，避免 toISOString 的 UTC 时区问题 */
export function getLocalDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * 解析 "YYYY-MM-DD" 为本地零点。
 * 必须用这个而不是 new Date(dateStr)：字符串日期会被 JS 引擎按 UTC 解析，
 * 在 UTC 以西的时区（如 America/New_York）会整体前移一天，
 * 导致 getDate()/getDay() 拿到错的日期与星期。
 */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** 从 "YYYY-MM-DD" 取「日」，纯字符串切片，不经过 Date 构造，无时区风险 */
export function formatDay(dateStr: string): string {
  return String(Number(dateStr.slice(8, 10)))
}

const WEEKDAY_MAP: Record<WeekdayType, string[]> = {
  short: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
  full: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
  min: ['日', '一', '二', '三', '四', '五', '六'],
  num: ['0', '1', '2', '3', '4', '5', '6'],
}

/** 星期几。字符串入参走本地解析，避免 UTC 时区错位 */
export function formatWeekday(d: string | Date, type: WeekdayType = 'short'): string {
  const day = (typeof d === 'string' ? parseLocalDate(d) : d).getDay()
  return WEEKDAY_MAP[type][day]
}

/** 月份键 "YYYY-MM"，与 ClockRecord.date 的前 7 位对齐，用于按月分组/筛选 */
export function getMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function prevMonth(year: number, month: number): { year: number; month: number } {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
}

export function nextMonth(year: number, month: number): { year: number; month: number } {
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }
}

export function getLocalTimeStr(d: Date = new Date()): string {
  return [
    String(d.getHours()).padStart(2, '0'),
    String(d.getMinutes()).padStart(2, '0'),
    String(d.getSeconds()).padStart(2, '0'),
  ].join(':')
}

export function formatFullDate(d: Date = new Date(), type: WeekdayType = 'full'): string {
  return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日 ${formatWeekday(d, type)}`
}

/** 所在周的周一（周一为一周起始） */
export function getWeekMonday(dateStr: string): string {
  const date = parseLocalDate(dateStr)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return getLocalDateStr(date)
}

/** 两个周一之间相差的周数（可为负） */
export function weeksBetweenMondays(mondayA: string, mondayB: string): number {
  const a = parseLocalDate(mondayA).getTime()
  const b = parseLocalDate(mondayB).getTime()
  return Math.round((b - a) / (7 * 24 * 60 * 60 * 1000))
}
