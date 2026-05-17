export type WeekdayType = 'short' | 'full' | 'min' | 'num'

/** 获取本地日期字符串 "YYYY-MM-DD"，避免 toISOString 的 UTC 时区问题 */
export function getLocalDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function formatDay(dateStr: string): string {
  return new Date(dateStr).getDate().toString()
}

export function formatWeekday(d: string | Date, type: WeekdayType = 'short'): string {
  const day = new Date(d).getDay()
  const map: Record<WeekdayType, string[]> = {
    short: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
    full: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
    min: ['日', '一', '二', '三', '四', '五', '六'],
    num: ['0', '1', '2', '3', '4', '5', '6'],
  }
  return map[type][day]
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
