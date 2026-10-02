<template>
  <view class="page">
    <ClockDisplay />

    <view v-if="!todayRecord?.isLeave" class="card today-card">
      <view class="card-header">
        <text class="card-title"> 今日工时 </text>
        <text v-if="todayRecord?.clockIn && todayRecord?.clockOut" class="card-badge">
          {{ todayHours }}
        </text>
      </view>
      <view class="time-row">
        <view class="time-block">
          <text class="time-label"> 上班 </text>
          <text class="time-value" :class="{ filled: todayRecord?.clockIn }">
            {{ todayRecord?.clockIn || '--:--' }}
          </text>
        </view>
        <view class="time-divider">
          <view class="divider-line" />
          <text v-if="todayRecord?.clockIn && todayRecord?.clockOut" class="divider-text">
            {{ todayHours }}
          </text>
        </view>
        <view class="time-block">
          <text class="time-label"> 下班 </text>
          <text class="time-value" :class="{ filled: todayRecord?.clockOut }">
            {{ todayRecord?.clockOut || '--:--' }}
          </text>
        </view>
      </view>
    </view>

    <view v-if="todayRecord?.isLeave" class="card today-card leave-card">
      <view class="card-header">
        <text class="card-title"> 今日请假 </text>
        <text class="card-badge leave-badge">
          {{ leaveType === 'half' ? '半天假' : '全天假' }}
        </text>
      </view>
    </view>

    <view class="card input-card">
      <view class="card-header">
        <text class="card-title"> 记录时间 </text>
      </view>
      <view class="input-row">
        <view class="input-group">
          <text class="input-label"> 上班时间 </text>
          <picker mode="time" :value="clockInTime" @change="onClockInChange">
            <view class="picker-box">
              <text class="picker-text">
                {{ clockInTime }}
              </text>
              <text class="picker-arrow"> ▾ </text>
            </view>
          </picker>
        </view>
        <view class="input-group">
          <text class="input-label"> 下班时间 </text>
          <picker mode="time" :value="clockOutTime" @change="onClockOutChange">
            <view class="picker-box">
              <text class="picker-text">
                {{ clockOutTime }}
              </text>
              <text class="picker-arrow"> ▾ </text>
            </view>
          </picker>
        </view>
      </view>
      <view class="btn-row">
        <button class="btn btn-primary" @tap="recordClockIn">
          {{ todayRecord?.clockIn ? '修改上班' : '记录上班' }}
        </button>
        <button class="btn btn-secondary" @tap="recordClockOut">
          {{ todayRecord?.clockOut ? '修改下班' : '记录下班' }}
        </button>
      </view>
      <view v-if="showLeave" class="leave-section">
        <view class="leave-left">
          <text class="leave-label"> 请假 </text>
          <picker
            v-if="isLeaveToday"
            :range="LEAVE_TYPES"
            :range-key="'label'"
            @change="handleLeaveTypeChange"
          >
            <text class="leave-type-btn"> {{ leaveType === 'half' ? '半天' : '全天' }} ▾ </text>
          </picker>
        </view>
        <switch :checked="isLeaveToday" :color="PRIMARY_COLOR" @change="toggleLeave" />
      </view>
    </view>

    <view class="card stats-card">
      <view class="card-header">
        <text class="card-title"> 本月概览 </text>
        <text class="card-sub"> {{ monthlyStats.year }}年{{ monthlyStats.month }}月 </text>
      </view>
      <view class="stats-grid">
        <view class="stat-item">
          <text class="stat-num">
            {{ monthlyStats.totalWorkDays }}
          </text>
          <text class="stat-desc"> 应出勤 </text>
        </view>
        <view class="stat-item">
          <text class="stat-num">
            {{ monthlyStats.actualWorkDays }}
          </text>
          <text class="stat-desc"> 实际 </text>
        </view>
        <view v-if="showLeave" class="stat-item">
          <text class="stat-num">
            {{ monthlyStats.leaveDays }}
          </text>
          <text class="stat-desc"> 请假 </text>
        </view>
        <view class="stat-item highlight">
          <text class="stat-num">
            {{ monthlyStats.averageHours }}
          </text>
          <text class="stat-desc"> 均工时(h) </text>
        </view>
      </view>
    </view>

    <GuideOverlay
      :visible="showGuide"
      title="配置工作日历"
      desc="在底部「设置」里可选择双休、单休、大小周，以及是否遵循法定节假日。"
      primary-text="去设置"
      secondary-text="知道了"
      placement="bottom"
      @primary="goSettingsFromGuide"
      @secondary="dismissGuide"
      @dismiss="dismissGuide"
    />

    <ApologyDialog :visible="showApology" @confirm="dismissApology" />
  </view>
</template>

<script setup lang="ts">
  import ClockDisplay from '@/components/ClockDisplay.vue'
  import GuideOverlay from '@/components/GuideOverlay.vue'
  import ApologyDialog from '@/components/ApologyDialog.vue'
  import { ref, computed } from 'vue'
  import { onShow } from '@dcloudio/uni-app'
  import type { ClockRecord, MonthlyStats } from '@/types/clock'
  import {
    getTodayRecord,
    upsertRecordByDate,
    generateId,
    getShowLeave,
    getGuideCompleted,
    setGuideCompleted,
    setGuideShowSettingsTip,
    getApologyAdsDismissed,
    setApologyAdsDismissed,
  } from '@/utils/storage'
  import { calcHours, LEAVE_TYPES } from '@/utils/time'
  import { getLocalDateStr } from '@/utils/date'
  import { calcMonthlyStats } from '@/utils/stats'
  import { getUniEventValue } from '@/types/event'
  import { useClockForm, DEFAULT_CLOCK_IN, DEFAULT_CLOCK_OUT } from '@/composables/useClockForm'
  import { lastAutoClockMessage } from '@/composables/useAutoClock'
  import { PRIMARY_COLOR } from '@/utils/theme'

  const form = useClockForm()
  const {
    clockIn: clockInTime,
    clockOut: clockOutTime,
    isLeave: isLeaveToday,
    leaveType,
    onClockInChange,
    onClockOutChange,
    onLeaveTypeChange,
  } = form

  const todayRecord = ref<ClockRecord | undefined>()
  const showLeave = ref(true)
  const showGuide = ref(false)
  const showApology = ref(false)
  const monthlyStats = ref<MonthlyStats>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    totalWorkDays: 0,
    actualWorkDays: 0,
    leaveDays: 0,
    totalHours: 0,
    averageHours: 0,
  })

  /**
   * 今日工时的展示。
   * 走 formatEffectiveHours（与列表/导出/统计同一口径）：请假当天不计工时，
   * 只显示上下班两端都有时间时才算出的小时数。
   */
  const todayHours = computed(() => {
    if (!todayRecord.value) return '--'
    if (todayRecord.value.isLeave) return '--'
    if (!todayRecord.value.clockIn || !todayRecord.value.clockOut) return '--'
    return calcHours(todayRecord.value.clockIn, todayRecord.value.clockOut).toFixed(1) + 'h'
  })

  function refreshOverlays() {
    const guideDone = getGuideCompleted()
    showGuide.value = !guideDone
    // 引导未完成时不抢致歉弹窗；关掉引导后下次 onShow 再出
    showApology.value = guideDone && !getApologyAdsDismissed()
  }

  function dismissGuide() {
    showGuide.value = false
    setGuideCompleted(true)
    setGuideShowSettingsTip(false)
    showApology.value = !getApologyAdsDismissed()
  }

  function goSettingsFromGuide() {
    showGuide.value = false
    setGuideCompleted(true)
    setGuideShowSettingsTip(true)
    uni.switchTab({ url: '/pages/settings/settings' })
  }

  function dismissApology() {
    showApology.value = false
    setApologyAdsDismissed(true)
  }

  /**
   * 统计始终基于「调用当下」的日期。
   * 此前在 setup 里冻结 const now = new Date()，而 tabBar 页面常驻不重建，
   * 应用跨月后首页「本月概览」会一直统计上一个月。
   */
  function loadMonthlyStats() {
    const now = new Date()
    monthlyStats.value = calcMonthlyStats(now.getFullYear(), now.getMonth() + 1)
  }

  /**
   * 写入今天的记录。
   *
   * 关键：日期一律取「调用当下」的 getLocalDateStr()，并复用 upsertRecordByDate
   * 按日期查重。此前 recordClockIn/recordClockOut/toggleLeave 三处都是
   * 「if (todayRecord.value) 就地改 date 字段」，而 todayRecord 是上次 onShow
   * 加载的——应用保持前台跨过零点后再打卡，10/1 的卡会被写进 9/30 的记录。
   */
  function saveToday(fields: Partial<ClockRecord>): ClockRecord {
    const today = getLocalDateStr()

    // 跨零点后 todayRecord 已是昨天的数据，直接作废，按今天重新载入
    if (todayRecord.value && todayRecord.value.date !== today) {
      todayRecord.value = getTodayRecord()
      form.loadFromRecord(todayRecord.value ?? {})
      // 首页 picker 需始终有可用时间（见 refreshData 说明）
      if (!clockInTime.value) clockInTime.value = DEFAULT_CLOCK_IN
      if (!clockOutTime.value) clockOutTime.value = DEFAULT_CLOCK_OUT
    }

    const existing = todayRecord.value
    const record: ClockRecord = {
      id: existing?.id ?? generateId(),
      date: today,
      clockIn: fields.clockIn !== undefined ? fields.clockIn : existing?.clockIn,
      clockOut: fields.clockOut !== undefined ? fields.clockOut : existing?.clockOut,
      isLeave: fields.isLeave !== undefined ? fields.isLeave : (existing?.isLeave ?? false),
      leaveType: fields.leaveType !== undefined ? fields.leaveType : existing?.leaveType,
    }
    // 未请假时不残留 leaveType
    if (!record.isLeave) record.leaveType = undefined

    upsertRecordByDate(record)
    todayRecord.value = record
    loadMonthlyStats()
    return record
  }

  function toggleLeave(e: Event) {
    isLeaveToday.value = getUniEventValue<boolean>(e)
    saveToday({
      isLeave: isLeaveToday.value,
      leaveType: isLeaveToday.value ? leaveType.value : undefined,
    })
  }

  function handleLeaveTypeChange(e: Event) {
    onLeaveTypeChange(e)
    // 仅在当天确实处于请假状态时才有意义，否则会凭空造出一条请假记录
    if (todayRecord.value?.isLeave) {
      saveToday({ leaveType: leaveType.value })
    }
  }

  function recordClockIn() {
    saveToday({ clockIn: clockInTime.value })
    uni.showToast({ title: '已记录', icon: 'success' })
  }

  function recordClockOut() {
    const saved = saveToday({ clockOut: clockOutTime.value })
    // 只打了下班卡、或下班早于上班时给出提示，避免用户以为工时算对了
    if (saved.clockIn && calcHours(saved.clockIn, saved.clockOut ?? '') === 0) {
      uni.showToast({ title: '下班时间早于上班时间', icon: 'none' })
      return
    }
    uni.showToast({ title: '已记录', icon: 'success' })
  }

  function refreshData() {
    showLeave.value = getShowLeave()
    todayRecord.value = getTodayRecord()
    form.loadFromRecord(todayRecord.value ?? {})
    // 首页是「快速打卡」页，与历史/日历的编辑表单语义不同：
    // picker 必须始终显示一个可用时间，用户不打开 picker 直接点
    // 「记录下班」也能存进去。因此未打卡的那一项回落到默认值。
    // 编辑表单（ClockEditForm）不能这么做——那里的空值代表「原本没有数据」，
    // 填默认值会导致只打了上班卡的记录被凭空补上 18:00、算出 9 小时工时。
    if (!clockInTime.value) clockInTime.value = DEFAULT_CLOCK_IN
    if (!clockOutTime.value) clockOutTime.value = DEFAULT_CLOCK_OUT
    loadMonthlyStats()
  }

  onShow(() => {
    refreshData()
    refreshOverlays()
    // 自动打卡（进入补卡/到点打卡）的提示只展示一次
    const msg = lastAutoClockMessage.value
    if (msg) {
      lastAutoClockMessage.value = ''
      uni.showToast({ title: msg, icon: 'none', duration: 2500 })
    }
  })
</script>

<style lang="scss">
  @use '@/styles/variables.scss' as *;

  .page {
    min-height: 100vh;
    background: $gray-50;
    // padding-bottom: 140rpx;
  }

  .card {
    background: #fff;
    margin: 24rpx;
    border-radius: $radius;
    padding: 28rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24rpx;
  }

  .card-title {
    font-size: 30rpx;
    font-weight: 600;
    color: $gray-900;
  }

  .card-sub {
    font-size: 24rpx;
    color: $gray-500;
  }

  .card-badge {
    font-size: 24rpx;
    color: #fff;
    background: $blue;
    padding: 4rpx 16rpx;
    border-radius: 20rpx;
  }

  .leave-card {
    .card-header {
      margin-bottom: 0;
    }
  }

  .card-badge.leave-badge {
    background: $orange;
  }

  .time-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .time-block {
    text-align: center;
    flex: 1;
  }

  .time-label {
    font-size: 24rpx;
    color: $gray-500;
    display: block;
    margin-bottom: 8rpx;
  }

  .time-value {
    font-size: 44rpx;
    font-weight: 700;
    color: $gray-200;
    display: block;
  }

  .time-value.filled {
    color: $gray-900;
  }

  .time-divider {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 120rpx;
  }

  .divider-line {
    width: 60rpx;
    height: 2rpx;
    background: $gray-200;
    margin-bottom: 8rpx;
  }

  .divider-text {
    font-size: 20rpx;
    color: $blue;
    font-weight: 600;
  }

  .input-row {
    display: flex;
    gap: 20rpx;
    margin-bottom: 24rpx;
  }

  .input-group {
    flex: 1;
  }

  .input-label {
    font-size: 24rpx;
    color: $gray-500;
    margin-bottom: 12rpx;
    display: block;
  }

  .picker-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: $gray-50;
    border: 2rpx solid $gray-200;
    border-radius: 12rpx;
    padding: 20rpx;
  }

  .picker-text {
    font-size: 30rpx;
    font-weight: 600;
    color: $gray-900;
  }

  .picker-arrow {
    font-size: 24rpx;
    color: $gray-500;
  }

  .btn-row {
    display: flex;
    gap: 20rpx;
  }

  .btn {
    flex: 1;
    height: 88rpx;
    border-radius: 12rpx;
    font-size: 28rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
  }

  .btn-primary {
    background: $blue;
    color: #fff;
  }

  .btn-secondary {
    background: $blue-bg;
    color: $blue;
  }

  .leave-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 20rpx;
    padding-top: 20rpx;
    border-top: 1rpx solid $gray-100;
  }

  .leave-left {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }

  .leave-label {
    font-size: 28rpx;
    color: $gray-700;
  }

  .leave-type-btn {
    font-size: 24rpx;
    color: $blue;
    background: $blue-bg;
    padding: 6rpx 16rpx;
    border-radius: 8rpx;
    font-weight: 600;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16rpx;
  }

  .stat-item {
    text-align: center;
    padding: 20rpx 0;
    background: $gray-50;
    border-radius: 12rpx;
  }

  .stat-item.highlight {
    background: $blue-bg;
  }

  .stat-num {
    font-size: 32rpx;
    font-weight: 700;
    color: $gray-900;
    display: block;
    margin-bottom: 4rpx;
  }

  .stat-item.highlight .stat-num {
    color: $blue;
  }

  .stat-desc {
    font-size: 20rpx;
    color: $gray-500;
  }
</style>
