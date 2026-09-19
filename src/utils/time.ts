import { getLunchBreakHours, getLunchStart } from '@/utils/storage'

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0
  return h * 60 + m
}

export function calcHours(clockIn: string, clockOut: string): number {
  const start = toMinutes(clockIn)
  const end = toMinutes(clockOut)
  let minutes = end - start
  if (minutes <= 0) return 0

  const lunchHours = getLunchBreakHours()
  if (lunchHours > 0) {
    const lunchStart = toMinutes(getLunchStart())
    const lunchEnd = lunchStart + Math.round(lunchHours * 60)
    const overlap = Math.min(end, lunchEnd) - Math.max(start, lunchStart)
    if (overlap > 0) minutes -= overlap
  }

  return Math.max(0, minutes) / 60
}

export function formatHours(clockIn: string, clockOut: string): string {
  return calcHours(clockIn, clockOut).toFixed(1)
}

export const LEAVE_TYPES = [
  { label: '全天', value: 'full' },
  { label: '半天', value: 'half' },
] as const

export type LeaveType = 'full' | 'half'
