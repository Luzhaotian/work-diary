import type { ClockRecord } from '@/types/clock'
import { getLocalDateStr } from '@/utils/date'

const STORAGE_KEY = 'clock_records'

export function getRecords(): ClockRecord[] {
  try {
    const data = uni.getStorageSync(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveRecords(records: ClockRecord[]): void {
  try {
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(records))
  } catch (e) {
    console.error('保存记录失败', e)
  }
}

export function addRecord(record: ClockRecord): void {
  const records = getRecords()
  records.push(record)
  saveRecords(records)
}

export function updateRecord(record: ClockRecord): void {
  const records = getRecords()
  const index = records.findIndex((r) => r.id === record.id)
  if (index !== -1) {
    records[index] = record
    saveRecords(records)
  }
}

export function deleteRecord(id: string): void {
  const records = getRecords()
  const filtered = records.filter((r) => r.id !== id)
  saveRecords(filtered)
}

export function getRecordsByMonth(year: number, month: number): ClockRecord[] {
  const records = getRecords()
  const monthStr = `${year}-${String(month).padStart(2, '0')}`
  return records.filter((r) => r.date.startsWith(monthStr))
}

export function cleanOldData(): void {
  const records = getRecords()
  const now = new Date()
  const tenYearsAgo = new Date(now.getFullYear() - 10, now.getMonth(), 1)
  const cutoffDate = getLocalDateStr(tenYearsAgo)

  const filtered = records.filter((r) => r.date >= cutoffDate)
  saveRecords(filtered)
}

export function getTodayRecord(): ClockRecord | undefined {
  const records = getRecords()
  const today = getLocalDateStr()
  return records.find((r) => r.date === today)
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

const SHOW_LEAVE_KEY = 'show_leave_button'

export function getShowLeave(): boolean {
  const val = uni.getStorageSync(SHOW_LEAVE_KEY)
  return val === '' ? true : !!val
}

export function setShowLeave(show: boolean): void {
  uni.setStorageSync(SHOW_LEAVE_KEY, show)
}

export const LUNCH_BREAK_OPTIONS = [
  { hours: 0, label: '不扣除' },
  { hours: 0.5, label: '0.5小时' },
  { hours: 1, label: '1小时' },
  { hours: 1.5, label: '1.5小时' },
  { hours: 2, label: '2小时' },
] as const

const LUNCH_BREAK_KEY = 'lunch_break_hours'
const LUNCH_START_KEY = 'lunch_break_start'
const DEFAULT_LUNCH_START = '12:00'

export function getLunchBreakHours(): number {
  const val = uni.getStorageSync(LUNCH_BREAK_KEY)
  if (val === '' || val == null) return 0
  const hours = typeof val === 'number' ? val : Number(val)
  if (!Number.isFinite(hours)) return 0
  return LUNCH_BREAK_OPTIONS.some((opt) => opt.hours === hours) ? hours : 0
}

export function setLunchBreakHours(hours: number): void {
  uni.setStorageSync(LUNCH_BREAK_KEY, Number(hours))
}

export function getLunchStart(): string {
  const val = uni.getStorageSync(LUNCH_START_KEY)
  return typeof val === 'string' && /^\d{2}:\d{2}$/.test(val) ? val : DEFAULT_LUNCH_START
}

export function setLunchStart(time: string): void {
  uni.setStorageSync(LUNCH_START_KEY, time)
}

export function getLunchBreakText(): string {
  const hours = getLunchBreakHours()
  const opt = LUNCH_BREAK_OPTIONS.find((item) => item.hours === hours)
  if (!opt || opt.hours === 0) return '不扣除'
  return `${opt.label} · ${getLunchStart()}`
}

/** 双休 / 单休 / 大小周 / 无休 */
export type WeekendMode = 'double' | 'single' | 'biweekly' | 'none'

/** 单休或大小周的小周：休息哪一天 */
export type SingleRestDay = 'saturday' | 'sunday'

/** 大小周：大周=双休，小周=单休 */
export type BiweeklyWeekType = 'big' | 'small'

export const WEEKEND_MODE_OPTIONS = [
  { value: 'double' as const, label: '双休', desc: '周六、周日休息' },
  { value: 'single' as const, label: '单休', desc: '每周只休息一天' },
  { value: 'biweekly' as const, label: '大小周', desc: '大周双休、小周单休，隔周交替' },
  { value: 'none' as const, label: '无休', desc: '周末也按工作日计算' },
]

export const SINGLE_REST_DAY_OPTIONS = [
  { value: 'sunday' as const, label: '休周日', desc: '周日休息，周六上班' },
  { value: 'saturday' as const, label: '休周六', desc: '周六休息，周日上班' },
]

export const BIWEEKLY_WEEK_TYPE_OPTIONS = [
  { value: 'big' as const, label: '大周（双休）', desc: '该周周六、周日都休息' },
  { value: 'small' as const, label: '小周（单休）', desc: '该周只休一天' },
]

const WEEKEND_MODE_KEY = 'calendar_weekend_mode'
const SINGLE_REST_DAY_KEY = 'calendar_single_rest_day'
const BIWEEKLY_ANCHOR_DATE_KEY = 'calendar_biweekly_anchor_date'
const BIWEEKLY_ANCHOR_TYPE_KEY = 'calendar_biweekly_anchor_type'
const USE_HOLIDAYS_KEY = 'calendar_use_holidays'

export function getWeekendMode(): WeekendMode {
  const val = uni.getStorageSync(WEEKEND_MODE_KEY)
  if (val === 'single' || val === 'none' || val === 'double' || val === 'biweekly') return val
  return 'double'
}

export function setWeekendMode(mode: WeekendMode): void {
  uni.setStorageSync(WEEKEND_MODE_KEY, mode)
}

export function getSingleRestDay(): SingleRestDay {
  const val = uni.getStorageSync(SINGLE_REST_DAY_KEY)
  return val === 'saturday' ? 'saturday' : 'sunday'
}

export function setSingleRestDay(day: SingleRestDay): void {
  uni.setStorageSync(SINGLE_REST_DAY_KEY, day)
}

export function getBiweeklyAnchorDate(): string {
  const val = uni.getStorageSync(BIWEEKLY_ANCHOR_DATE_KEY)
  return typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val) ? val : getLocalDateStr()
}

export function setBiweeklyAnchorDate(date: string): void {
  uni.setStorageSync(BIWEEKLY_ANCHOR_DATE_KEY, date)
}

export function getBiweeklyAnchorType(): BiweeklyWeekType {
  const val = uni.getStorageSync(BIWEEKLY_ANCHOR_TYPE_KEY)
  return val === 'small' ? 'small' : 'big'
}

export function setBiweeklyAnchorType(type: BiweeklyWeekType): void {
  uni.setStorageSync(BIWEEKLY_ANCHOR_TYPE_KEY, type)
}

/** 默认开启中国法定节假日与调休 */
export function getUseHolidays(): boolean {
  const val = uni.getStorageSync(USE_HOLIDAYS_KEY)
  return val === '' || val == null ? true : !!val
}

export function setUseHolidays(use: boolean): void {
  uni.setStorageSync(USE_HOLIDAYS_KEY, use)
}

export function getCalendarSettingText(): string {
  const mode = getWeekendMode()
  const modeOpt = WEEKEND_MODE_OPTIONS.find((item) => item.value === mode)
  const holidayText = getUseHolidays() ? '法定节假日' : '无法定节假日'
  const rest = getSingleRestDay() === 'saturday' ? '休周六' : '休周日'
  if (mode === 'single') {
    return `${modeOpt?.label || '单休'}（${rest}） · ${holidayText}`
  }
  if (mode === 'biweekly') {
    const weekType = getBiweeklyAnchorType() === 'big' ? '参考大周' : '参考小周'
    return `${modeOpt?.label || '大小周'}（${weekType}·${rest}） · ${holidayText}`
  }
  return `${modeOpt?.label || '双休'} · ${holidayText}`
}
