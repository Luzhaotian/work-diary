import type { ClockRecord } from '@/types/clock'
import { getLocalDateStr, getMonthKey } from '@/utils/date'

// getMonthKey 定义在 utils/date.ts（纯日期逻辑），此处再导出以兼容既有 import 路径
export { getMonthKey }

const STORAGE_KEY = 'clock_records'

export function getRecords(): ClockRecord[] {
  try {
    const data = uni.getStorageSync(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveRecords(records: ClockRecord[]): void {
  try {
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(records))
  } catch (e) {
    console.error('保存记录失败', e)
  }
}

/**
 * 把记录按 "YYYY-MM" 分组。
 * 统计页需要遍历几十个月，用它一次性分组，避免每月都全量读取+JSON.parse。
 */
export function groupRecordsByMonth(
  records: ClockRecord[] = getRecords(),
): Map<string, ClockRecord[]> {
  const grouped = new Map<string, ClockRecord[]>()
  for (const r of records) {
    // date 形如 "YYYY-MM-DD"，前 7 位即月份键；异常数据跳过
    if (typeof r.date !== 'string' || r.date.length < 7) continue
    const key = r.date.slice(0, 7)
    const list = grouped.get(key)
    if (list) list.push(r)
    else grouped.set(key, [r])
  }
  return grouped
}

/**
 * 按日期建立唯一索引。同一天只应有一条记录：
 * 所有读取路径（getTodayRecord、页面里的 find(r => r.date === ...)）都只取第一条，
 * 重复记录会被静默忽略，因此写入时必须保证唯一。
 */
function buildDateIndex(records: ClockRecord[]): Map<string, number> {
  const index = new Map<string, number>()
  records.forEach((r, i) => {
    if (!index.has(r.date)) index.set(r.date, i)
  })
  return index
}

export function addRecord(record: ClockRecord): void {
  const records = getRecords()
  const index = buildDateIndex(records)
  const existing = index.get(record.date)
  if (existing !== undefined) {
    // 同日已有记录：合并而非新增，保留原 id，避免出现被忽略的重复数据
    records[existing] = { ...records[existing], ...record, id: records[existing].id }
  } else {
    records.push(record)
  }
  saveRecords(records)
}

export function updateRecord(record: ClockRecord): void {
  const records = getRecords()
  const index = records.findIndex((r) => r.id === record.id)
  if (index !== -1) {
    records[index] = record
    saveRecords(records)
  }
}

/**
 * 写入某天的记录：已存在则按 id 更新，否则新增。
 * 页面保存编辑时用这个，天然不会造出同日重复记录。
 */
export function upsertRecordByDate(record: ClockRecord): void {
  const records = getRecords()
  const index = buildDateIndex(records)
  const existing = index.get(record.date)
  if (existing !== undefined) {
    records[existing] = { ...records[existing], ...record, id: records[existing].id }
  } else {
    records.push(record)
  }
  saveRecords(records)
}

/**
 * 历史数据可能已存在同日重复（旧版 addRecord 不查重）。
 * 保留每天第一条，其余合并进去（后者的打卡/请假信息补齐前者的空缺），启动时执行一次。
 * @returns 是否发生了清理（用于决定是否需要回写）
 */
export function dedupeRecordsByDate(): boolean {
  const records = getRecords()
  const byDate = new Map<string, ClockRecord>()
  let changed = false

  for (const r of records) {
    const prev = byDate.get(r.date)
    if (!prev) {
      byDate.set(r.date, r)
      continue
    }
    changed = true
    // 合并：已有值优先，空缺由重复记录补齐
    byDate.set(r.date, {
      ...prev,
      clockIn: prev.clockIn ?? r.clockIn,
      clockOut: prev.clockOut ?? r.clockOut,
      isLeave: prev.isLeave || r.isLeave,
      leaveType: prev.leaveType ?? r.leaveType,
    })
  }

  if (changed) saveRecords(Array.from(byDate.values()))
  return changed
}

export function deleteRecord(id: string): void {
  const records = getRecords()
  const filtered = records.filter((r) => r.id !== id)
  saveRecords(filtered)
}

export function getRecordsByMonth(year: number, month: number): ClockRecord[] {
  const records = getRecords()
  const monthStr = getMonthKey(year, month)
  return records.filter((r) => r.date.startsWith(monthStr))
}

const CLEAN_THROTTLE_KEY = 'last_clean_date'

/**
 * 清理 10 年前的旧数据。每天最多真正执行一次：
 * onLaunch 里同步全量读+parse+filter+回写会阻塞启动，没必要每次冷启都做。
 */
export function cleanOldData(): void {
  const today = getLocalDateStr()
  if (uni.getStorageSync(CLEAN_THROTTLE_KEY) === today) return

  const records = getRecords()
  const now = new Date()
  const tenYearsAgo = new Date(now.getFullYear() - 10, now.getMonth(), 1)
  const cutoffDate = getLocalDateStr(tenYearsAgo)

  const filtered = records.filter((r) => r.date >= cutoffDate)
  // 只在真的删掉了东西时回写，避免无意义的写盘
  if (filtered.length !== records.length) saveRecords(filtered)

  uni.setStorageSync(CLEAN_THROTTLE_KEY, today)
}

/** 取指定日期的记录（同一天唯一，见 upsertRecordByDate） */
export function getRecordByDate(date: string): ClockRecord | undefined {
  return getRecords().find((r) => r.date === date)
}

export function getTodayRecord(): ClockRecord | undefined {
  return getRecordByDate(getLocalDateStr())
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

/* -------------------------------------------------------------------------- */
/*  设置项：模块级缓存                                                          */
/* -------------------------------------------------------------------------- */
/*
 * 日历/统计会对每一天调用工作日判断，而判断依赖多项设置。若每次都读
 * uni.getStorageSync（小程序端同步阻塞 JS 线程），统计页选「全部」会产生
 * 6000+ 次同步 IO。这里把「从 storage 读到的原始值」缓存在模块作用域：
 *   - 所有 setter 写入时同步失效对应缓存，保证同页/跨页读到最新值
 *   - uni-app 是单 JS 运行时，设置页写入后其他页面立即可见
 * 缓存的是原始值而非解析结果：这样「未配置」（raw = ''）也能被缓存，
 * 否则每次都要重新 getStorageSync。parse 是纯函数、开销可忽略，每次在缓存的
 * 原始值上重算即可——parse 返回 undefined 表示「未配置」，交由调用方决定
 * 回退值（用于回退值随日期变化的场景，如大小周参考日默认取今天）。
 */

const settingsCache = new Map<string, unknown>()

function readSetting<T>(key: string, parse: (raw: unknown) => T | undefined): T | undefined {
  // 缓存原始 storage 值（含未配置的 ''），只有缓存未命中时才真正读盘
  let raw: unknown
  if (settingsCache.has(key)) {
    raw = settingsCache.get(key)
  } else {
    raw = uni.getStorageSync(key)
    settingsCache.set(key, raw)
  }
  return parse(raw)
}

function writeSetting(key: string, value: unknown): void {
  uni.setStorageSync(key, value)
  settingsCache.delete(key)
}

const SHOW_LEAVE_KEY = 'show_leave_button'

export function getShowLeave(): boolean {
  // 未设置时默认展示请假按钮
  return readSetting(SHOW_LEAVE_KEY, (val) => (val === '' ? undefined : !!val)) ?? true
}

export function setShowLeave(show: boolean): void {
  writeSetting(SHOW_LEAVE_KEY, show)
}

export const LUNCH_BREAK_OPTIONS = [
  { hours: 0, label: '不扣除' },
  { hours: 0.5, label: '0.5小时' },
  { hours: 1, label: '1小时' },
  { hours: 1.5, label: '1.5小时' },
  { hours: 2, label: '2小时' },
] as const

const LUNCH_BREAK_KEY = 'lunch_break_hours'
const LUNCH_START_KEY = 'lunch_break_start'
const DEFAULT_LUNCH_START = '12:00'

export function getLunchBreakHours(): number {
  return (
    readSetting(LUNCH_BREAK_KEY, (val) => {
      if (val === '' || val == null) return 0
      const hours = typeof val === 'number' ? val : Number(val)
      if (!Number.isFinite(hours)) return 0
      // 只接受预设档位，避免异常值导致工时被扣成负数
      return LUNCH_BREAK_OPTIONS.some((opt) => opt.hours === hours) ? hours : 0
    }) ?? 0
  )
}

export function setLunchBreakHours(hours: number): void {
  writeSetting(LUNCH_BREAK_KEY, Number(hours))
}

export function getLunchStart(): string {
  return (
    readSetting(LUNCH_START_KEY, (val) =>
      typeof val === 'string' && /^\d{2}:\d{2}$/.test(val) ? val : DEFAULT_LUNCH_START,
    ) ?? DEFAULT_LUNCH_START
  )
}

export function setLunchStart(time: string): void {
  writeSetting(LUNCH_START_KEY, time)
}

export function getLunchBreakText(): string {
  const hours = getLunchBreakHours()
  const opt = LUNCH_BREAK_OPTIONS.find((item) => item.hours === hours)
  if (!opt || opt.hours === 0) return '不扣除'
  return `${opt.label} · ${getLunchStart()}`
}

/** 双休 / 单休 / 大小周 / 无休 */
export type WeekendMode = 'double' | 'single' | 'biweekly' | 'none'

/** 单休或大小周的小周：休息哪一天 */
export type SingleRestDay = 'saturday' | 'sunday'

/** 大小周：大周=双休，小周=单休 */
export type BiweeklyWeekType = 'big' | 'small'

export const WEEKEND_MODE_OPTIONS = [
  { value: 'double' as const, label: '双休', desc: '周六、周日休息' },
  { value: 'single' as const, label: '单休', desc: '每周只休息一天' },
  { value: 'biweekly' as const, label: '大小周', desc: '大周双休、小周单休，隔周交替' },
  { value: 'none' as const, label: '无休', desc: '周末也按工作日计算' },
]

export const SINGLE_REST_DAY_OPTIONS = [
  { value: 'sunday' as const, label: '休周日', desc: '周日休息，周六上班' },
  { value: 'saturday' as const, label: '休周六', desc: '周六休息，周日上班' },
]

export const BIWEEKLY_WEEK_TYPE_OPTIONS = [
  { value: 'big' as const, label: '大周（双休）', desc: '该周周六、周日都休息' },
  { value: 'small' as const, label: '小周（单休）', desc: '该周只休一天' },
]

const WEEKEND_MODE_KEY = 'calendar_weekend_mode'
const SINGLE_REST_DAY_KEY = 'calendar_single_rest_day'
const BIWEEKLY_ANCHOR_DATE_KEY = 'calendar_biweekly_anchor_date'
const BIWEEKLY_ANCHOR_TYPE_KEY = 'calendar_biweekly_anchor_type'
const USE_HOLIDAYS_KEY = 'calendar_use_holidays'

const VALID_WEEKEND_MODES: readonly WeekendMode[] = ['double', 'single', 'biweekly', 'none']

export function getWeekendMode(): WeekendMode {
  return (
    readSetting(WEEKEND_MODE_KEY, (val) =>
      VALID_WEEKEND_MODES.includes(val as WeekendMode) ? (val as WeekendMode) : undefined,
    ) ?? 'double'
  )
}

export function setWeekendMode(mode: WeekendMode): void {
  writeSetting(WEEKEND_MODE_KEY, mode)
}

export function getSingleRestDay(): SingleRestDay {
  return readSetting(SINGLE_REST_DAY_KEY, (val) => (val === 'saturday' ? 'saturday' : 'sunday'))!
}

export function setSingleRestDay(day: SingleRestDay): void {
  writeSetting(SINGLE_REST_DAY_KEY, day)
}

/**
 * 大小周参考日期。未设置时回退到「今天」——该回退值不缓存，
 * 否则应用跨零点常驻时会一直停留在旧的今天，导致大小周判断错位。
 */
export function getBiweeklyAnchorDate(): string {
  return (
    readSetting(BIWEEKLY_ANCHOR_DATE_KEY, (val) =>
      typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val) ? val : undefined,
    ) ?? getLocalDateStr()
  )
}

export function setBiweeklyAnchorDate(date: string): void {
  writeSetting(BIWEEKLY_ANCHOR_DATE_KEY, date)
}

export function getBiweeklyAnchorType(): BiweeklyWeekType {
  return readSetting(BIWEEKLY_ANCHOR_TYPE_KEY, (val) => (val === 'small' ? 'small' : 'big'))!
}

export function setBiweeklyAnchorType(type: BiweeklyWeekType): void {
  writeSetting(BIWEEKLY_ANCHOR_TYPE_KEY, type)
}

/** 默认开启中国法定节假日与调休 */
export function getUseHolidays(): boolean {
  return (
    readSetting(USE_HOLIDAYS_KEY, (val) => (val === '' || val == null ? undefined : !!val)) ?? true
  )
}

export function setUseHolidays(use: boolean): void {
  writeSetting(USE_HOLIDAYS_KEY, use)
}

/* -------------------------------------------------------------------------- */
/*  自动打卡                                                                    */
/* -------------------------------------------------------------------------- */

const AUTO_CLOCK_ENABLED_KEY = 'auto_clock_enabled'
const AUTO_CLOCK_ON_LAUNCH_KEY = 'auto_clock_on_launch'
const AUTO_CLOCK_SCHEDULED_KEY = 'auto_clock_scheduled'
const AUTO_CLOCK_IN_TIME_KEY = 'auto_clock_in_time'
const AUTO_CLOCK_OUT_TIME_KEY = 'auto_clock_out_time'

/** 自动打卡总开关，默认关闭 */
export function getAutoClockEnabled(): boolean {
  return (
    readSetting(AUTO_CLOCK_ENABLED_KEY, (val) => (val === '' || val == null ? undefined : !!val)) ??
    false
  )
}

export function setAutoClockEnabled(on: boolean): void {
  writeSetting(AUTO_CLOCK_ENABLED_KEY, on)
}

/** 进入应用时补卡，默认开启（总开关打开后才生效） */
export function getAutoClockOnLaunch(): boolean {
  return (
    readSetting(AUTO_CLOCK_ON_LAUNCH_KEY, (val) =>
      val === '' || val == null ? undefined : !!val,
    ) ?? true
  )
}

export function setAutoClockOnLaunch(on: boolean): void {
  writeSetting(AUTO_CLOCK_ON_LAUNCH_KEY, on)
}

/** 应用开着时到点自动打卡，默认开启（总开关打开后才生效） */
export function getAutoClockScheduled(): boolean {
  return (
    readSetting(AUTO_CLOCK_SCHEDULED_KEY, (val) =>
      val === '' || val == null ? undefined : !!val,
    ) ?? true
  )
}

export function setAutoClockScheduled(on: boolean): void {
  writeSetting(AUTO_CLOCK_SCHEDULED_KEY, on)
}

/** 自动打卡的上班时间，默认 09:00 */
export function getAutoClockInTime(): string {
  return (
    readSetting(AUTO_CLOCK_IN_TIME_KEY, (val) =>
      typeof val === 'string' && /^\d{2}:\d{2}$/.test(val) ? val : undefined,
    ) ?? '09:00'
  )
}

export function setAutoClockInTime(time: string): void {
  writeSetting(AUTO_CLOCK_IN_TIME_KEY, time)
}

/** 自动打卡的下班时间，默认 18:00 */
export function getAutoClockOutTime(): string {
  return (
    readSetting(AUTO_CLOCK_OUT_TIME_KEY, (val) =>
      typeof val === 'string' && /^\d{2}:\d{2}$/.test(val) ? val : undefined,
    ) ?? '18:00'
  )
}

export function setAutoClockOutTime(time: string): void {
  writeSetting(AUTO_CLOCK_OUT_TIME_KEY, time)
}

/** 设置主页的摘要文案 */
export function getAutoClockSettingText(): string {
  if (!getAutoClockEnabled()) return '已关闭'
  const modes: string[] = []
  if (getAutoClockOnLaunch()) modes.push('进入补卡')
  if (getAutoClockScheduled()) modes.push('到点打卡')
  if (modes.length === 0) return '已开启（未选方式）'
  return `${modes.join(' · ')} ${getAutoClockInTime()}/${getAutoClockOutTime()}`
}

const GUIDE_COMPLETED_KEY = 'guide_completed'
/** 首页点「去设置」后，在设置页再高亮日历设置一项 */
const GUIDE_SHOW_SETTINGS_TIP_KEY = 'guide_show_settings_tip'

/** 首次蒙层引导是否已看过（含点「知道了」） */
export function getGuideCompleted(): boolean {
  return (
    readSetting(GUIDE_COMPLETED_KEY, (val) => (val === '' || val == null ? undefined : !!val)) ??
    false
  )
}

export function setGuideCompleted(done: boolean): void {
  writeSetting(GUIDE_COMPLETED_KEY, done)
}

export function getGuideShowSettingsTip(): boolean {
  return !!uni.getStorageSync(GUIDE_SHOW_SETTINGS_TIP_KEY)
}

export function setGuideShowSettingsTip(show: boolean): void {
  if (show) uni.setStorageSync(GUIDE_SHOW_SETTINGS_TIP_KEY, true)
  else uni.removeStorageSync(GUIDE_SHOW_SETTINGS_TIP_KEY)
}

/** 广告致歉声明是否已读（点过「我知道了」） */
const APOLOGY_ADS_DISMISSED_KEY = 'apology_ads_dismissed'

export function getApologyAdsDismissed(): boolean {
  return !!uni.getStorageSync(APOLOGY_ADS_DISMISSED_KEY)
}

export function setApologyAdsDismissed(done: boolean): void {
  uni.setStorageSync(APOLOGY_ADS_DISMISSED_KEY, done)
}

export function getCalendarSettingText(): string {
  const mode = getWeekendMode()
  const modeOpt = WEEKEND_MODE_OPTIONS.find((item) => item.value === mode)
  const holidayText = getUseHolidays() ? '法定节假日' : '无法定节假日'
  const rest = getSingleRestDay() === 'saturday' ? '休周六' : '休周日'
  if (mode === 'single') {
    return `${modeOpt?.label || '单休'}（${rest}） · ${holidayText}`
  }
  if (mode === 'biweekly') {
    const weekType = getBiweeklyAnchorType() === 'big' ? '参考大周' : '参考小周'
    return `${modeOpt?.label || '大小周'}（${weekType}·${rest}） · ${holidayText}`
  }
  return `${modeOpt?.label || '双休'} · ${holidayText}`
}
