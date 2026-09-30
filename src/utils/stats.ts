import type { ClockRecord, MonthlyStats } from '@/types/clock'
import { getRecordsByMonth, groupRecordsByMonth, getMonthKey, getRecords } from '@/utils/storage'
import { countWorkdaysInMonth } from '@/utils/workday'
import { effectiveHours } from '@/utils/time'

/**
 * 由「某月记录 + 应出勤天数」汇总出月度统计。
 *
 * 请假与打卡不再互斥：半天假当天照常上班（09:00–13:00）时，
 * leaveDays 记 0.5，同时那 4 小时计入 totalHours / actualWorkDays。
 * 此前用 else if 分支，半天假的工时会被整段丢弃。
 *
 * effectiveHours 内部已排除请假当天的工时（全天假不算工时），
 * 与列表渲染、CSV 导出、复制文本共用同一口径。
 */
function summarize(
  year: number,
  month: number,
  records: ClockRecord[],
  totalWorkDays: number,
): MonthlyStats {
  let actualWorkDays = 0
  let leaveDays = 0
  let totalHours = 0

  for (const r of records) {
    if (r.isLeave) leaveDays += r.leaveType === 'half' ? 0.5 : 1
    const hours = effectiveHours(r)
    if (hours !== undefined) {
      actualWorkDays++
      totalHours += hours
    }
  }

  return {
    year,
    month,
    totalWorkDays,
    actualWorkDays,
    // 0.5 的半天假累加会产生浮点误差（0.1+0.2 类问题），保留一位小数收敛
    leaveDays: parseFloat(leaveDays.toFixed(1)),
    totalHours,
    averageHours: actualWorkDays > 0 ? parseFloat((totalHours / actualWorkDays).toFixed(1)) : 0,
  }
}

/** 单月统计（读一次该月记录） */
export function calcMonthlyStats(year: number, month: number): MonthlyStats {
  return summarize(year, month, getRecordsByMonth(year, month), countWorkdaysInMonth(year, month))
}

/**
 * 批量统计多个月。
 *
 * 统计页选「全部」要算 120 个月，若逐月调用 calcMonthlyStats，
 * 每月都会全量读取并 JSON.parse 一次记录（实测 120 个月 = 120 次全量 parse、
 * 6000+ 次同步 storage 读取）。这里只读一次全量记录、按月分组后复用。
 *
 * @param months 形如 [{year, month}, ...]，按传入顺序返回
 */
export function calcStatsForMonths(months: { year: number; month: number }[]): MonthlyStats[] {
  const grouped = groupRecordsByMonth(getRecords())
  return months.map(({ year, month }) =>
    summarize(
      year,
      month,
      grouped.get(getMonthKey(year, month)) ?? [],
      countWorkdaysInMonth(year, month),
    ),
  )
}

/** 该月是否有任何数据（用于过滤统计页的空白月份） */
export function hasAnyData(stat: MonthlyStats): boolean {
  return stat.actualWorkDays > 0 || stat.leaveDays > 0
}
