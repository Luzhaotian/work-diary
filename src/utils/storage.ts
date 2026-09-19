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
  const hours = Number(val)
  return LUNCH_BREAK_OPTIONS.some((opt) => opt.hours === hours) ? hours : 0
}

export function setLunchBreakHours(hours: number): void {
  uni.setStorageSync(LUNCH_BREAK_KEY, hours)
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
