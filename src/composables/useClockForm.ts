import { ref } from 'vue'
import { LEAVE_TYPES, type LeaveType } from '@/utils/time'
import { getUniEventValue } from '@/types/event'

export function useClockForm() {
  const clockIn = ref('09:00')
  const clockOut = ref('18:00')
  const isLeave = ref(false)
  const leaveType = ref<LeaveType>('full')

  function onClockInChange(e: Event) {
    clockIn.value = getUniEventValue<string>(e)
  }
  function onClockOutChange(e: Event) {
    clockOut.value = getUniEventValue<string>(e)
  }
  function onLeaveChange(e: Event) {
    isLeave.value = getUniEventValue<boolean>(e)
  }
  function onLeaveTypeChange(e: Event) {
    leaveType.value = LEAVE_TYPES[getUniEventValue<string>(e)].value as LeaveType
  }

  function loadFromRecord(record: {
    clockIn?: string
    clockOut?: string
    isLeave?: boolean
    leaveType?: 'full' | 'half'
  }) {
    clockIn.value = record.clockIn || '09:00'
    clockOut.value = record.clockOut || '18:00'
    isLeave.value = record.isLeave || false
    leaveType.value = (record.leaveType as LeaveType) || 'full'
  }

  return {
    clockIn,
    clockOut,
    isLeave,
    leaveType,
    onClockInChange,
    onClockOutChange,
    onLeaveChange,
    onLeaveTypeChange,
    loadFromRecord,
  }
}
