<template>
  <view class="page">
    <view class="header">
      <view class="month-nav">
        <view class="nav-btn" @tap="handlePrevMonth">
          <text class="nav-arrow">‹</text>
        </view>
        <text class="month-text">{{ year }}年{{ month }}月</text>
        <view class="nav-btn" @tap="handleNextMonth">
          <text class="nav-arrow">›</text>
        </view>
        <view class="today-btn" @tap="goToday">
          <text class="today-text">今天</text>
        </view>
      </view>
    </view>

    <view class="calendar-body">
      <view class="weekday-row">
        <text v-for="w in weekdays" :key="w" class="weekday-cell">{{ w }}</text>
      </view>

      <view class="day-grid">
        <view
          v-for="(cell, idx) in calendarCells"
          :key="idx"
          class="day-cell"
          :class="{
            empty: !cell.day,
            today: cell.isToday,
            weekend: cell.isWeekend,
            holiday: cell.isHoliday,
            leave: showLeave && cell.isLeave,
            overtime: cell.isOvertime,
            recorded: cell.hasRecord && !cell.isLeave && !cell.isOvertime,
            selected: selectedDay && cell.day && cell.fullDate === selectedDay.fullDate,
          }"
          @tap="cell.day ? onDayTap(cell) : undefined"
        >
          <text v-if="cell.day" class="day-num">{{ cell.day }}</text>
          <text v-if="cell.holidayName" class="day-tag holiday-tag">{{ cell.holidayName }}</text>
          <text v-else-if="cell.isOvertime" class="day-tag overtime-tag">加班</text>
          <text v-else-if="showLeave && cell.isLeave" class="day-tag leave-tag">
            {{ cell.leaveType === 'half' ? '半天' : '请假' }}
          </text>
          <text v-else-if="cell.clockIn" class="day-time">{{ cell.clockIn }}</text>
          <text v-else-if="cell.isWeekend" class="day-tag rest-tag">休</text>
        </view>
      </view>
    </view>

    <view class="legend">
      <view class="legend-item">
        <view class="legend-dot recorded-dot"></view>
        <text class="legend-text">已记录</text>
      </view>
      <view class="legend-item">
        <view class="legend-dot holiday-dot"></view>
        <text class="legend-text">节假日</text>
      </view>
      <view class="legend-item" v-if="showLeave">
        <view class="legend-dot leave-dot"></view>
        <text class="legend-text">请假</text>
      </view>
      <view class="legend-item">
        <view class="legend-dot overtime-dot"></view>
        <text class="legend-text">加班</text>
      </view>
      <view class="legend-item">
        <view class="legend-dot weekend-dot"></view>
        <text class="legend-text">周末</text>
      </view>
    </view>

    <view class="detail-card" v-if="selectedDay">
      <view class="detail-header">
        <text class="detail-date">{{ selectedDay.fullDate }}</text>
        <text class="detail-week">{{ selectedDay.weekday }}</text>
        <text v-if="selectedDay.holidayName" class="detail-holiday">{{
          selectedDay.holidayName
        }}</text>
        <text v-if="selectedDay.isOvertime" class="detail-overtime">加班</text>
      </view>

      <view
        v-if="(selectedDay.isWeekend || selectedDay.isHoliday) && !selectedDay.hasRecord"
        class="detail-rest"
      >
        <text class="rest-text">休息日</text>
      </view>

      <view v-else class="detail-form">
        <view class="form-row">
          <text class="form-label">上班时间</text>
          <picker mode="time" :value="editClockIn" @change="onClockInChange">
            <view class="form-picker">
              <text class="form-picker-text">{{ editClockIn || '09:00' }}</text>
            </view>
          </picker>
        </view>

        <view class="form-row">
          <text class="form-label">下班时间</text>
          <picker mode="time" :value="editClockOut" @change="onClockOutChange">
            <view class="form-picker">
              <text class="form-picker-text">{{ editClockOut || '18:00' }}</text>
            </view>
          </picker>
        </view>

        <view class="form-row" v-if="showLeave">
          <text class="form-label">请假</text>
          <switch :checked="editIsLeave" color="#2563EB" @change="onLeaveChange" />
        </view>

        <view class="form-row" v-if="showLeave && editIsLeave">
          <text class="form-label">类型</text>
          <picker :range="LEAVE_TYPES" :range-key="'label'" @change="onLeaveTypeChange">
            <view class="form-picker">
              <text class="form-picker-text">{{ editLeaveType === 'half' ? '半天' : '全天' }}</text>
            </view>
          </picker>
        </view>

        <view class="form-row hours-row" v-if="editClockIn && editClockOut && !editIsLeave">
          <text class="form-label">工时</text>
          <text class="hours-value">{{ formatHours(editClockIn, editClockOut) }}h</text>
        </view>

        <view class="btn-row">
          <button class="btn btn-primary" @tap="saveRecord">保存</button>
          <button class="btn btn-danger" v-if="selectedDay.hasRecord" @tap="deleteSelected">
            删除
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
  import { ref, computed, nextTick } from 'vue'
  import { onShow } from '@dcloudio/uni-app'
  import type { ClockRecord } from '@/types/clock'
  import {
    getRecordsByMonth,
    addRecord,
    updateRecord,
    deleteRecord,
    generateId,
    getShowLeave,
  } from '@/utils/storage'
  import { isWorkdayFromLib, isHolidayFromLib, getFestivalName } from '@/utils/workday'
  import { formatHours, LEAVE_TYPES } from '@/utils/time'
  import {
    getLocalDateStr,
    prevMonth as getPrevMonth,
    nextMonth as getNextMonth,
    formatWeekday,
  } from '@/utils/date'
  import { useClockForm } from '@/composables/useClockForm'

  const {
    clockIn: editClockIn,
    clockOut: editClockOut,
    isLeave: editIsLeave,
    leaveType: editLeaveType,
    onClockInChange,
    onClockOutChange,
    onLeaveChange,
    onLeaveTypeChange,
    loadFromRecord,
  } = useClockForm()

  const weekdays = ['一', '二', '三', '四', '五', '六', '日']
  const now = new Date()
  const year = ref(now.getFullYear())
  const month = ref(now.getMonth() + 1)
  const records = ref<ClockRecord[]>([])
  const selectedDay = ref<any>(null)
  const showLeave = ref(true)

  function loadRecords() {
    showLeave.value = getShowLeave()
    records.value = getRecordsByMonth(year.value, month.value)
  }

  interface CalendarCell {
    day: number | null
    fullDate: string
    weekday: string
    isToday: boolean
    isWeekend: boolean
    isHoliday: boolean
    holidayName: string | undefined
    hasRecord: boolean
    clockIn?: string
    clockOut?: string
    isLeave: boolean
    isOvertime: boolean
    leaveType?: string
    recordId?: string
  }

  const calendarCells = computed<CalendarCell[]>(() => {
    const firstDay = new Date(year.value, month.value - 1, 1)
    let startWeekday = firstDay.getDay()
    startWeekday = startWeekday === 0 ? 7 : startWeekday
    const daysInMonth = new Date(year.value, month.value, 0).getDate()
    const todayStr = getLocalDateStr()

    const cells: CalendarCell[] = []

    for (let i = 1; i < startWeekday; i++) {
      cells.push({
        day: null,
        fullDate: '',
        weekday: '',
        isToday: false,
        isWeekend: false,
        isHoliday: false,
        holidayName: undefined,
        hasRecord: false,
        isLeave: false,
        isOvertime: false,
      })
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year.value}-${String(month.value).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const dateObj = new Date(year.value, month.value - 1, d)
      const dayOfWeek = dateObj.getDay()
      const isWkend = dayOfWeek === 0 || dayOfWeek === 6
      const isWorkday = isWorkdayFromLib(dateStr)
      const isHol = isHolidayFromLib(dateStr)
      const hName = getFestivalName(dateStr)
      const record = records.value.find((r) => r.date === dateStr)
      const isActualWeekend = isWkend && !isWorkday

      cells.push({
        day: d,
        fullDate: dateStr,
        weekday: formatWeekday(dateObj, 'full'),
        isToday: dateStr === todayStr,
        isWeekend: isActualWeekend,
        isHoliday: isHol,
        holidayName: hName,
        hasRecord: !!record,
        clockIn: record?.clockIn,
        clockOut: record?.clockOut,
        isLeave: record?.isLeave || false,
        isOvertime: (isHol || isActualWeekend) && !!record && !record.isLeave && !!record.clockIn,
        leaveType: record?.leaveType,
        recordId: record?.id,
      })
    }

    return cells
  })

  function handlePrevMonth() {
    const m = getPrevMonth(year.value, month.value)
    year.value = m.year
    month.value = m.month
    selectedDay.value = null
    loadRecords()
  }

  function handleNextMonth() {
    const m = getNextMonth(year.value, month.value)
    year.value = m.year
    month.value = m.month
    selectedDay.value = null
    loadRecords()
  }

  function goToday() {
    year.value = now.getFullYear()
    month.value = now.getMonth() + 1
    selectedDay.value = null
    loadRecords()
    selectToday()
  }

  function selectToday() {
    nextTick(() => {
      const todayCell = calendarCells.value.find((c) => c.isToday)
      if (todayCell) {
        onDayTap(todayCell)
      }
    })
  }

  function onDayTap(cell: CalendarCell) {
    selectedDay.value = cell
    loadFromRecord({
      clockIn: cell.clockIn,
      clockOut: cell.clockOut,
      isLeave: cell.isLeave,
      leaveType: cell.leaveType as 'full' | 'half' | undefined,
    })
  }

  function saveRecord() {
    if (!selectedDay.value) return
    const dateStr = selectedDay.value.fullDate
    const existing = records.value.find((r) => r.date === dateStr)

    if (existing) {
      existing.clockIn = editIsLeave.value ? undefined : editClockIn.value
      existing.clockOut = editIsLeave.value ? undefined : editClockOut.value
      existing.isLeave = editIsLeave.value
      existing.leaveType = editIsLeave.value ? editLeaveType.value : undefined
      updateRecord(existing)
    } else {
      const rec: ClockRecord = {
        id: generateId(),
        date: dateStr,
        clockIn: editIsLeave.value ? undefined : editClockIn.value,
        clockOut: editIsLeave.value ? undefined : editClockOut.value,
        isLeave: editIsLeave.value,
        leaveType: editIsLeave.value ? editLeaveType.value : undefined,
      }
      addRecord(rec)
    }

    loadRecords()
    selectedDay.value = null
    uni.showToast({ title: '已保存', icon: 'success' })
  }

  function deleteSelected() {
    if (!selectedDay.value?.recordId) return
    uni.showModal({
      title: '确认删除',
      content: `删除 ${selectedDay.value.fullDate} 的记录？`,
      confirmColor: '#2563EB',
      success(res) {
        if (res.confirm && selectedDay.value?.recordId) {
          deleteRecord(selectedDay.value.recordId)
          loadRecords()
          selectedDay.value = null
          uni.showToast({ title: '已删除', icon: 'success' })
        }
      },
    })
  }

  onShow(() => {
    loadRecords()
    selectToday()
  })
</script>

<style lang="scss">
  @use '@/styles/variables.scss' as *;

  .page {
    min-height: 100vh;
    background: $gray-50;
    padding-bottom: 160rpx;
  }

  .header {
    background: linear-gradient(135deg, $blue 0%, $blue-dark 100%);
    padding: 24rpx 32rpx 32rpx;
    border-radius: 0 0 40rpx 40rpx;
  }

  .month-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24rpx;
  }

  .nav-btn {
    width: 56rpx;
    height: 56rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-arrow {
    font-size: 36rpx;
    color: #fff;
    font-weight: 600;
  }

  .month-text {
    font-size: 32rpx;
    font-weight: 700;
    color: #fff;
    min-width: 180rpx;
    text-align: center;
  }

  .today-btn {
    background: rgba(255, 255, 255, 0.2);
    padding: 8rpx 24rpx;
    border-radius: 20rpx;
  }

  .today-text {
    font-size: 22rpx;
    color: #fff;
  }

  .calendar-body {
    background: #fff;
    margin: 24rpx;
    border-radius: $radius;
    padding: 20rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  }

  .weekday-row {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    margin-bottom: 12rpx;
  }

  .weekday-cell {
    text-align: center;
    font-size: 22rpx;
    color: $gray-400;
    font-weight: 600;
    padding: 8rpx 0;
  }

  .day-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 6rpx;
  }

  .day-cell {
    height: 96rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 12rpx;
    position: relative;
    background: transparent;
    border: 2rpx solid transparent;
  }

  .day-cell.today {
    background: $blue-bg;
    border-color: $blue;
  }

  .day-cell.weekend {
    background: $gray-50;
  }

  .day-cell.holiday {
    background: #fef3c7;
  }

  .day-cell.leave {
    background: #fef2f2;
  }

  .day-cell.overtime {
    background: #f0fdf4;
  }

  .day-cell.recorded {
    background: $blue-bg;
  }

  .day-cell.selected {
    border-color: $blue;
    box-shadow: 0 0 0 2rpx rgba(37, 99, 235, 0.2);
  }

  .day-num {
    font-size: 26rpx;
    font-weight: 600;
    color: $gray-900;
  }

  .day-cell.weekend .day-num {
    color: $gray-400;
  }

  .day-cell.today .day-num {
    color: $blue;
    font-weight: 700;
  }

  .day-tag {
    font-size: 16rpx;
    margin-top: 2rpx;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .holiday-tag {
    color: $orange;
  }

  .leave-tag {
    color: $red;
  }

  .overtime-tag {
    color: #16a34a;
  }

  .rest-tag {
    color: $gray-400;
  }

  .day-time {
    font-size: 16rpx;
    color: $blue;
    margin-top: 2rpx;
  }

  .legend {
    display: flex;
    justify-content: center;
    gap: 24rpx;
    padding: 16rpx 24rpx;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 8rpx;
  }

  .legend-dot {
    width: 16rpx;
    height: 16rpx;
    border-radius: 50%;
  }

  .recorded-dot {
    background: $blue-bg;
    border: 1rpx solid $blue;
  }
  .holiday-dot {
    background: #fef3c7;
    border: 1rpx solid $orange;
  }
  .leave-dot {
    background: #fef2f2;
    border: 1rpx solid $red;
  }
  .overtime-dot {
    background: #f0fdf4;
    border: 1rpx solid #16a34a;
  }
  .weekend-dot {
    background: $gray-50;
    border: 1rpx solid $gray-200;
  }

  .legend-text {
    font-size: 20rpx;
    color: $gray-500;
  }

  .detail-card {
    background: #fff;
    margin: 0 24rpx 24rpx;
    border-radius: $radius;
    padding: 28rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  }

  .detail-header {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 20rpx;
    padding-bottom: 16rpx;
    border-bottom: 1rpx solid $gray-100;
  }

  .detail-date {
    font-size: 30rpx;
    font-weight: 700;
    color: $gray-900;
  }

  .detail-week {
    font-size: 24rpx;
    color: $gray-500;
  }

  .detail-holiday {
    font-size: 22rpx;
    color: $orange;
    background: #fef3c7;
    padding: 4rpx 12rpx;
    border-radius: 8rpx;
  }

  .detail-overtime {
    font-size: 22rpx;
    color: #16a34a;
    background: #f0fdf4;
    padding: 4rpx 12rpx;
    border-radius: 8rpx;
  }

  .detail-rest {
    text-align: center;
    padding: 32rpx 0;
  }

  .rest-text {
    font-size: 28rpx;
    color: $gray-400;
  }

  .form-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16rpx 0;
    border-bottom: 1rpx solid $gray-100;
  }

  .form-row:last-of-type {
    border-bottom: none;
  }

  .form-label {
    font-size: 28rpx;
    color: $gray-700;
  }

  .form-picker {
    padding: 8rpx 16rpx;
    background: $gray-50;
    border-radius: 8rpx;
  }

  .form-picker-text {
    font-size: 28rpx;
    color: $gray-900;
    font-weight: 600;
  }

  .hours-row {
    border-bottom: none;
  }

  .hours-value {
    font-size: 32rpx;
    font-weight: 700;
    color: $blue;
  }

  .btn-row {
    display: flex;
    gap: 20rpx;
    margin-top: 24rpx;
  }

  .btn {
    flex: 1;
    height: 80rpx;
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

  .btn-danger {
    background: #fef2f2;
    color: $red;
  }
</style>
