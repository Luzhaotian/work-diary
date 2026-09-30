import type { ClockRecord, LeaveType } from '@/types/clock'
import { getLunchBreakHours, getLunchStart } from '@/utils/storage'

// LeaveType 的唯一定义在 types/clock.ts，此处再导出以兼容既有 import 路径
export type { LeaveType }

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0
  return h * 60 + m
}

/**
 * 计算当日工时（小时）。
 *
 * 有意不支持跨零点班次：下班早于上班时视为录入错误返回 0。
 * 若改成 `minutes += 24 * 60`，手滑把下班时间选早（如 18:00→09:00）会被算成
 * 15 小时而不是 0，属于静默的数据污染，因此宁可返回 0 并由 UI 提示。
 * 确有夜班需求时应引入显式的「跨天」标记，而不是靠时间大小推断。
 */
export function calcHours(clockIn: string, clockOut: string): number {
  const start = toMinutes(clockIn)
  const end = toMinutes(clockOut)
  let minutes = end - start
  if (minutes <= 0) return 0

  const lunchHours = getLunchBreakHours()
  if (lunchHours > 0) {
    const lunchStart = toMinutes(getLunchStart())
    const lunchEnd = lunchStart + Math.round(lunchHours * 60)
    // 只扣除与午休真正重叠的部分：只上上午或只上下午的不会被扣
    const overlap = Math.min(end, lunchEnd) - Math.max(start, lunchStart)
    if (overlap > 0) minutes -= overlap
  }

  return Math.max(0, minutes) / 60
}

export function formatHours(clockIn: string, clockOut: string): string {
  return calcHours(clockIn, clockOut).toFixed(1)
}

/** 下班时间不晚于上班时间，属于无效区间（保存时应提示用户） */
export function isInvalidTimeRange(clockIn?: string, clockOut?: string): boolean {
  if (!clockIn || !clockOut) return false
  return toMinutes(clockOut) <= toMinutes(clockIn)
}

/**
 * 是否全天请假。
 * 全天假：整天没上班，打卡时间无意义（展示时遮成 --:--，不计工时）。
 * 半天假：上了另外半天，打卡时间是真实的，应照常展示并计入工时。
 */
export function isFullDayLeave(record: Pick<ClockRecord, 'isLeave' | 'leaveType'>): boolean {
  return record.isLeave && record.leaveType !== 'half'
}

/**
 * 一条记录的「有效工时」。
 *
 * 口径：
 * - 全天请假：不计工时（即便记录里残留了打卡时间也不算，
 *   修复此前 CSV 导出未判断 isLeave、把全天假导出成 9.0h 而复制文本导出 0h 的不一致）
 * - 半天请假：照常按 clockIn/clockOut 计算——半天假当天仍上了半天班，
 *   那几小时应当计入（见 stats.ts 的月度汇总）
 * - 普通日：按 clockIn/clockOut 计算
 *
 * 列表渲染、CSV 导出、复制文本、月度统计全部走这一个函数，
 * 避免各写一套判断导致同一份数据在不同出口口径不一致。
 *
 * @returns 无有效工时时返回 undefined，由调用方决定展示 '' 还是 '0h'
 */
export function effectiveHours(record: ClockRecord): number | undefined {
  // 全天假（leaveType 非 'half'）不计工时；半天假继续往下按打卡时间算
  if (record.isLeave && record.leaveType !== 'half') return undefined
  if (!record.clockIn || !record.clockOut) return undefined
  return calcHours(record.clockIn, record.clockOut)
}

/** 有效工时的展示文本，如 "8.5h"；无工时返回 fallback */
export function formatEffectiveHours(record: ClockRecord, fallback = '0h'): string {
  const hours = effectiveHours(record)
  return hours === undefined ? fallback : `${hours.toFixed(1)}h`
}

export const LEAVE_TYPES = [
  { label: '全天', value: 'full' },
  { label: '半天', value: 'half' },
] as const

/**
 * 把 picker 返回的下标安全转成 LeaveType。
 * uni-app picker 的 e.detail.value 是索引 number（不是字符串），
 * 越界时回退到全天，避免读到 undefined 再崩。
 */
export function toLeaveType(index: unknown): LeaveType {
  const i = Number(index)
  return Number.isInteger(i) && i >= 0 && i < LEAVE_TYPES.length ? LEAVE_TYPES[i].value : 'full'
}
