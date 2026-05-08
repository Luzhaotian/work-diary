/** 获取本地日期字符串 "YYYY-MM-DD"，避免 toISOString 的 UTC 时区问题 */
export function getLocalDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function formatDay(dateStr: string): string {
  return new Date(dateStr).getDate().toString()
}

export function formatWeekday(dateStr: string): string {
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(dateStr).getDay()]
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
