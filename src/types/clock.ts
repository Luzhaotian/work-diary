import type { Ref, ComputedRef } from 'vue'

export type LeaveType = 'full' | 'half'

export interface ClockRecord {
  id: string
  date: string
  clockIn?: string
  clockOut?: string
  isLeave: boolean
  leaveType?: LeaveType
}

export interface MonthlyStats {
  year: number
  month: number
  totalWorkDays: number
  actualWorkDays: number
  leaveDays: number
  totalHours: number
  averageHours: number
}

/**
 * useClockForm() 的返回结构，供 ClockEditForm 等共享组件按 props 接收。
 *
 * 这里用结构化描述而不是 `ReturnType<typeof useClockForm>`：
 * types/ 反向 import composable 会形成循环依赖（composable 也要用 ClockRecord）。
 *
 * 约定：clockIn / clockOut 为空字符串表示「该项无数据」，
 * 不用 09:00 / 18:00 兜底，避免保存时把默认值写成真实打卡时间。
 */
export interface ClockFormController {
  clockIn: Ref<string>
  clockOut: Ref<string>
  isLeave: Ref<boolean>
  leaveType: Ref<LeaveType>
  /** 下班时间早于/等于上班时间 */
  invalidTimeRange: ComputedRef<boolean>
  onClockInChange: (e: Event) => void
  onClockOutChange: (e: Event) => void
  onLeaveChange: (e: Event) => void
  onLeaveTypeChange: (e: Event) => void
  loadFromRecord: (record: {
    clockIn?: string
    clockOut?: string
    isLeave?: boolean
    leaveType?: LeaveType
  }) => void
  reset: () => void
  toRecordFields: () => {
    clockIn?: string
    clockOut?: string
    isLeave: boolean
    leaveType?: LeaveType
  }
}
