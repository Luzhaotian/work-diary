export function calcHours(clockIn: string, clockOut: string): number {
  const [aH, aM] = clockIn.split(':').map(Number)
  const [bH, bM] = clockOut.split(':').map(Number)
  return (bH * 60 + bM - aH * 60 - aM) / 60
}

export function formatHours(clockIn: string, clockOut: string): string {
  return calcHours(clockIn, clockOut).toFixed(1)
}

export const LEAVE_TYPES = [
  { label: '全天', value: 'full' },
  { label: '半天', value: 'half' }
] as const

export type LeaveType = 'full' | 'half'
