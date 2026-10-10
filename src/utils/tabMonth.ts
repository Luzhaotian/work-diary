/**
 * tabBar 页之间用 switchTab，不能带 query。
 * 首页概览跳转时先记下目标月份，目标页 onShow 消费一次后清空。
 * 底部 Tab 直接点进去不受影响，仍保留用户上次浏览的月份。
 */
export type TabMonthTarget = 'record' | 'calendar'

let pending: { target: TabMonthTarget; year: number; month: number } | null = null

export function requestTabMonth(target: TabMonthTarget, year: number, month: number) {
  pending = { target, year, month }
}

export function consumeTabMonth(target: TabMonthTarget): { year: number; month: number } | null {
  if (!pending || pending.target !== target) return null
  const { year, month } = pending
  pending = null
  return { year, month }
}
