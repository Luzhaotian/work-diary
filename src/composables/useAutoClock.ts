import { ref } from 'vue'
import type { ClockRecord } from '@/types/clock'
import {
  getAutoClockEnabled,
  getAutoClockOnLaunch,
  getAutoClockScheduled,
  getAutoClockInTime,
  getAutoClockOutTime,
  getRecordByDate,
  upsertRecordByDate,
  generateId,
} from '@/utils/storage'
import { getLocalDateStr } from '@/utils/date'
import { timeToMinutes } from '@/utils/time'
import { isWorkdayFromLib } from '@/utils/workday'

/**
 * 自动打卡。
 *
 * 平台限制：微信小程序与 H5 都无法在应用未打开时后台执行代码，
 * 因此「定时打卡」只能是应用开着时到点触发；错过之后（应用没开）
 * 由「进入补卡」在下次打开应用时补齐。两者写入的都是设置里的时间，
 * 保证同一天的结果可预测、与班次一致。
 *
 * 触发规则：
 * - 进入补卡（onLaunch）：当前时间已过设置的上班/下班时间、当天是工作日、
 *   且对应字段缺失时，写入设置时间。上班、下班各自独立判断，都补。
 * - 到点打卡（scheduled）：应用开着时每 30 秒检查一次，落在设置时间所在的
 *   那一分钟即触发（同一天同一点只触发一次）；不追溯更早错过的点——
 *   那种情况留给下次进入应用时的补卡逻辑。
 *
 * 不覆盖人工数据：当天已有手动打卡、或标记了请假（含半天假）时不自动写入。
 */

/** 模块级单例：定时器与「已触发」标记跨页面共享，避免多个页面各起一个 interval */
let timer: ReturnType<typeof setInterval> | null = null
/** 本次运行期内已触发过的打卡点（"YYYY-MM-DD|in" / "|out"），防止重复写入 */
const firedThisSession = new Set<string>()
/** 上次执行进入补卡的日期，用于 onShow 时判断是否跨了零点 */
let lastCatchUpDate = ''

/** 最近一次自动打卡的描述，供页面展示提示（如「已自动打卡 09:00」） */
export const lastAutoClockMessage = ref('')

interface AutoClockResult {
  clockedIn: boolean
  clockedOut: boolean
}

function nowMinutes(d: Date): number {
  return d.getHours() * 60 + d.getMinutes()
}

/**
 * 对某一天执行自动打卡。
 *
 * @param allowIn  是否允许补上班卡
 * @param allowOut 是否允许补下班卡
 * @param now      判定基准时间
 */
function applyAutoClock(
  dateStr: string,
  allowIn: boolean,
  allowOut: boolean,
  now: Date,
): AutoClockResult {
  const result: AutoClockResult = { clockedIn: false, clockedOut: false }
  if (!getAutoClockEnabled()) return result
  // 休息日不自动打卡（含法定节假日与调休，遵循日历设置）
  if (!isWorkdayFromLib(dateStr)) return result

  // 按传入的日期查记录（而非内部取今天），避免跨零点时判定日期与写入日期不一致
  const record = getRecordByDate(dateStr)
  // 请假当天（含半天假）不自动写入，避免覆盖请假标记或产生矛盾数据
  if (record?.isLeave) return result

  const inTime = getAutoClockInTime()
  const outTime = getAutoClockOutTime()
  const minutes = nowMinutes(now)

  const canIn = allowIn && !record?.clockIn && minutes >= timeToMinutes(inTime)
  const canOut = allowOut && !record?.clockOut && minutes >= timeToMinutes(outTime)
  if (!canIn && !canOut) return result

  const merged: ClockRecord = {
    id: record?.id ?? generateId(),
    date: dateStr,
    clockIn: canIn ? inTime : record?.clockIn,
    clockOut: canOut ? outTime : record?.clockOut,
    isLeave: record?.isLeave ?? false,
    leaveType: record?.leaveType,
  }
  upsertRecordByDate(merged)

  result.clockedIn = canIn
  result.clockedOut = canOut
  return result
}

/**
 * 进入应用时补卡：上班、下班都补（只要已过对应时间）。
 * 由 App.vue 的 onLaunch 调用。
 */
export function runAutoClockOnLaunch(): AutoClockResult {
  if (!getAutoClockOnLaunch()) return { clockedIn: false, clockedOut: false }
  const now = new Date()
  const dateStr = getLocalDateStr(now)
  lastCatchUpDate = dateStr
  const result = applyAutoClock(dateStr, true, true, now)

  if (result.clockedIn || result.clockedOut) {
    const parts: string[] = []
    if (result.clockedIn) parts.push(`上班 ${getAutoClockInTime()}`)
    if (result.clockedOut) parts.push(`下班 ${getAutoClockOutTime()}`)
    lastAutoClockMessage.value = `已自动补卡：${parts.join('、')}`
    // 补过的点记入本次会话，避免到点打卡逻辑再写一次
    if (result.clockedIn) firedThisSession.add(`${dateStr}|in`)
    if (result.clockedOut) firedThisSession.add(`${dateStr}|out`)
  }
  return result
}

/**
 * 回到前台时：重启到点打卡定时器；若日期已变（应用开着跨过零点），
 * 对新的今天补一次卡。
 * 由 App.vue 的 onShow 调用。
 */
export function runAutoClockOnShow(): void {
  startAutoClockTimer()
  const today = getLocalDateStr()
  if (lastCatchUpDate === today) return
  lastCatchUpDate = today
  if (!getAutoClockOnLaunch()) return
  const now = new Date()
  const result = applyAutoClock(today, true, true, now)
  if (result.clockedIn || result.clockedOut) {
    const parts: string[] = []
    if (result.clockedIn) parts.push(`上班 ${getAutoClockInTime()}`)
    if (result.clockedOut) parts.push(`下班 ${getAutoClockOutTime()}`)
    lastAutoClockMessage.value = `已自动补卡：${parts.join('、')}`
    if (result.clockedIn) firedThisSession.add(`${today}|in`)
    if (result.clockedOut) firedThisSession.add(`${today}|out`)
  }
}

/**
 * 到点打卡：跨过设置时间的那一分钟触发。
 * 只补「刚刚跨过」的点（上一分钟还没到、这一分钟到了），
 * 应用长时间开着但错过的点不会追溯——追溯交给下次进入的补卡。
 */
function checkScheduledTick(): void {
  if (!getAutoClockScheduled()) return
  const now = new Date()
  const dateStr = getLocalDateStr(now)
  const minutes = nowMinutes(now)
  const inAt = timeToMinutes(getAutoClockInTime())
  const outAt = timeToMinutes(getAutoClockOutTime())

  const justIn = minutes === inAt && !firedThisSession.has(`${dateStr}|in`)
  const justOut = minutes === outAt && !firedThisSession.has(`${dateStr}|out`)
  if (!justIn && !justOut) return

  const result = applyAutoClock(dateStr, justIn, justOut, now)
  if (result.clockedIn) firedThisSession.add(`${dateStr}|in`)
  if (result.clockedOut) firedThisSession.add(`${dateStr}|out`)
  if (result.clockedIn || result.clockedOut) {
    const parts: string[] = []
    if (result.clockedIn) parts.push(`上班 ${getAutoClockInTime()}`)
    if (result.clockedOut) parts.push(`下班 ${getAutoClockOutTime()}`)
    lastAutoClockMessage.value = `已自动打卡：${parts.join('、')}`
  }
}

/**
 * 启动到点打卡定时器（应用级单例，重复调用安全）。
 * 每 30 秒检查一次：比每分钟更细，保证跨过整点的那一次检查不会漏掉
 * （setInterval 在后台可能被节流，恢复前台后下一次检查仍能命中整分钟）。
 */
export function startAutoClockTimer(): void {
  if (timer) return
  timer = setInterval(checkScheduledTick, 30 * 1000)
}

export function stopAutoClockTimer(): void {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
