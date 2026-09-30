import { ref, computed } from 'vue'
import { toLeaveType, isInvalidTimeRange, type LeaveType } from '@/utils/time'
import { getUniEventValue } from '@/types/event'

/** 新建记录时 picker 的初始值；仅用于展示，不会写入未打卡的记录 */
export const DEFAULT_CLOCK_IN = '09:00'
export const DEFAULT_CLOCK_OUT = '18:00'

export interface ClockFormSource {
  clockIn?: string
  clockOut?: string
  isLeave?: boolean
  leaveType?: LeaveType
}

/**
 * 打卡编辑表单（首页 / 历史编辑弹窗 / 日历详情共用）。
 *
 * 关键约定：clockIn / clockOut 为空字符串表示「这一项没有数据」，
 * 绝不用 09:00 / 18:00 兜底填充。此前 loadFromRecord 会填默认值，
 * 保存时无条件写回，导致只打了上班卡的记录被凭空补上 18:00 下班、
 * 算出 9 小时工时。展示用的默认值由模板的 `|| DEFAULT_CLOCK_*` 负责。
 */
export function useClockForm() {
  const clockIn = ref('')
  const clockOut = ref('')
  const isLeave = ref(false)
  const leaveType = ref<LeaveType>('full')

  /** 下班时间早于/等于上班时间：无效区间，保存前应提示 */
  const invalidTimeRange = computed(() => isInvalidTimeRange(clockIn.value, clockOut.value))

  function onClockInChange(e: Event) {
    clockIn.value = getUniEventValue<string>(e)
  }
  function onClockOutChange(e: Event) {
    clockOut.value = getUniEventValue<string>(e)
  }
  function onLeaveChange(e: Event) {
    isLeave.value = getUniEventValue<boolean>(e)
  }
  /** picker 的 e.detail.value 是索引 number，用 toLeaveType 安全转换 */
  function onLeaveTypeChange(e: Event) {
    leaveType.value = toLeaveType(getUniEventValue<unknown>(e))
  }

  /** 从已有记录载入：缺什么就是什么，不编造默认值 */
  function loadFromRecord(record: ClockFormSource) {
    clockIn.value = record.clockIn || ''
    clockOut.value = record.clockOut || ''
    isLeave.value = record.isLeave || false
    leaveType.value = record.leaveType === 'half' ? 'half' : 'full'
  }

  /** 重置为空白表单（picker 显示默认时间，但保存时仍是空值） */
  function reset() {
    clockIn.value = ''
    clockOut.value = ''
    isLeave.value = false
    leaveType.value = 'full'
  }

  /** 把当前表单合成一条记录的打卡字段，空值保持 undefined */
  function toRecordFields() {
    return {
      clockIn: clockIn.value || undefined,
      clockOut: clockOut.value || undefined,
      isLeave: isLeave.value,
      leaveType: isLeave.value ? leaveType.value : undefined,
    }
  }

  return {
    clockIn,
    clockOut,
    isLeave,
    leaveType,
    invalidTimeRange,
    onClockInChange,
    onClockOutChange,
    onLeaveChange,
    onLeaveTypeChange,
    loadFromRecord,
    reset,
    toRecordFields,
  }
}
