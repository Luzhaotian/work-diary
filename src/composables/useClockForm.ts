import { ref } from 'vue'
import { LEAVE_TYPES, type LeaveType } from '@/utils/time'

function getEventValue<T>(e: { detail: { value: T } } | Event): T {
  if ('detail' in e && e.detail && 'value' in e.detail) {
    return (e.detail as { value: T }).value
  }
  return (e as { detail: { value: T } }).detail.value
}

export function useClockForm() {
  const clockIn = ref('09:00')
  const clockOut = ref('18:00')
  const isLeave = ref(false)
  const leaveType = ref<LeaveType>('full')

  function onClockInChange(e: { detail: { value: string } } | Event) {
    clockIn.value = getEventValue<string>(e)
  }
  function onClockOutChange(e: { detail: { value: string } } | Event) {
    clockOut.value = getEventValue<string>(e)
  }
  function onLeaveChange(e: { detail: { value: boolean } } | Event) {
    isLeave.value = getEventValue<boolean>(e)
  }
  function onLeaveTypeChange(e: { detail: { value: string } } | Event) {
    leaveType.value = LEAVE_TYPES[getEventValue<string>(e)].value as LeaveType
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
