<template>
  <view class="page">
    <view class="month-bar">
      <view class="month-btn" @tap="prevMonth">
        <text class="month-arrow">‹</text>
      </view>
      <text class="month-title">{{ currentYear }}年{{ currentMonth }}月</text>
      <view class="month-btn" @tap="nextMonth">
        <text class="month-arrow">›</text>
      </view>
    </view>

    <scroll-view scroll-y class="list-wrap">
      <view v-for="record in records" :key="record.id" class="record-card">
        <view class="record-left">
          <text class="record-day">{{ formatDay(record.date) }}</text>
          <text class="record-week">{{ formatWeekday(record.date) }}</text>
        </view>
        <view class="record-center">
          <view v-if="record.isLeave" class="leave-badge">
            <text class="leave-text">{{ record.leaveType === 'half' ? '半天假' : '全天假' }}</text>
          </view>
          <view v-else class="record-times">
            <view class="record-time-item">
              <text class="rt-label">上班</text>
              <text class="rt-value">{{ record.clockIn || '--:--' }}</text>
            </view>
            <view class="record-time-item">
              <text class="rt-label">下班</text>
              <text class="rt-value">{{ record.clockOut || '--:--' }}</text>
            </view>
            <view class="record-time-item" v-if="record.clockIn && record.clockOut">
              <text class="rt-label">工时</text>
              <text class="rt-value hl">{{ formatHours(record.clockIn, record.clockOut) }}h</text>
            </view>
          </view>
        </view>
        <view class="record-actions">
          <view class="action-btn edit-btn" @tap="editRecord(record)">
            <text class="action-icon">✎</text>
          </view>
          <view class="action-btn del-btn" @tap="confirmDelete(record)">
            <text class="action-icon">✕</text>
          </view>
        </view>
      </view>

      <view v-if="records.length === 0" class="empty-state">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无记录</text>
      </view>
    </scroll-view>

    <view class="modal-mask" v-if="showModal" @tap="showModal = false">
      <view class="modal-box" @tap.stop>
        <text class="modal-title">修改记录</text>

        <view class="form-row">
          <text class="form-label">上班时间</text>
          <picker mode="time" :value="editForm.clockIn" @change="onEditClockIn">
            <view class="form-picker">
              <text class="form-picker-text">{{ editForm.clockIn || '请选择' }}</text>
            </view>
          </picker>
        </view>

        <view class="form-row">
          <text class="form-label">下班时间</text>
          <picker mode="time" :value="editForm.clockOut" @change="onEditClockOut">
            <view class="form-picker">
              <text class="form-picker-text">{{ editForm.clockOut || '请选择' }}</text>
            </view>
          </picker>
        </view>

        <view class="form-row">
          <text class="form-label">请假</text>
          <switch :checked="editForm.isLeave" color="#2563EB" @change="onLeaveChange" />
        </view>

        <view class="form-row" v-if="editForm.isLeave">
          <text class="form-label">类型</text>
          <picker :range="LEAVE_TYPES" :range-key="'label'" @change="onLeaveTypeChange">
            <view class="form-picker">
              <text class="form-picker-text">{{
                editForm.leaveType === 'half' ? '半天' : '全天'
              }}</text>
            </view>
          </picker>
        </view>

        <view class="modal-btns">
          <button class="m-btn m-cancel" @tap="showModal = false">取消</button>
          <button class="m-btn m-save" @tap="saveEdit">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { onShow } from '@dcloudio/uni-app'
  import type { ClockRecord } from '@/types/clock'
  import { getRecordsByMonth, updateRecord, deleteRecord } from '@/utils/storage'
  import { formatHours, LEAVE_TYPES, type LeaveType } from '@/utils/time'

  const currentYear = ref(new Date().getFullYear())
  const currentMonth = ref(new Date().getMonth() + 1)
  const records = ref<ClockRecord[]>([])
  const showModal = ref(false)
  const editForm = ref<ClockRecord>({ id: '', date: '', isLeave: false })

  function loadRecords() {
    records.value = getRecordsByMonth(currentYear.value, currentMonth.value).sort((a, b) =>
      b.date.localeCompare(a.date),
    )
  }

  function prevMonth() {
    if (currentMonth.value === 1) {
      currentMonth.value = 12
      currentYear.value--
    } else {
      currentMonth.value--
    }
    loadRecords()
  }

  function nextMonth() {
    if (currentMonth.value === 12) {
      currentMonth.value = 1
      currentYear.value++
    } else {
      currentMonth.value++
    }
    loadRecords()
  }

  function formatDay(d: string) {
    return new Date(d).getDate().toString()
  }

  function formatWeekday(d: string) {
    return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(d).getDay()]
  }

  function editRecord(r: ClockRecord) {
    editForm.value = { ...r }
    showModal.value = true
  }

  function confirmDelete(r: ClockRecord) {
    uni.showModal({
      title: '确认删除',
      content: `删除 ${r.date} 的记录？`,
      confirmColor: '#2563EB',
      success(res) {
        if (res.confirm) {
          deleteRecord(r.id)
          loadRecords()
          uni.showToast({ title: '已删除', icon: 'success' })
        }
      },
    })
  }

  function onEditClockIn(e: any) {
    editForm.value.clockIn = e.detail.value
  }
  function onEditClockOut(e: any) {
    editForm.value.clockOut = e.detail.value
  }
  function onLeaveChange(e: any) {
    editForm.value.isLeave = e.detail.value
  }
  function onLeaveTypeChange(e: any) {
    editForm.value.leaveType = LEAVE_TYPES[e.detail.value].value as LeaveType
  }

  function saveEdit() {
    const form = editForm.value
    if (form.isLeave) {
      form.clockIn = undefined
      form.clockOut = undefined
    }
    updateRecord(form)
    showModal.value = false
    loadRecords()
    uni.showToast({ title: '已保存', icon: 'success' })
  }

  onMounted(() => {
    loadRecords()
  })

  onShow(() => {
    loadRecords()
  })
</script>

<style lang="scss">
  @use '@/styles/variables.scss' as *;

  .page {
    min-height: 100vh;
    background: $gray-50;
    padding-bottom: 140rpx;
  }

  .month-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24rpx;
    background: #fff;
    gap: 40rpx;
  }

  .month-btn {
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    background: $gray-100;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .month-arrow {
    font-size: 36rpx;
    color: $gray-700;
    font-weight: 600;
  }

  .month-title {
    font-size: 32rpx;
    font-weight: 700;
    color: $gray-900;
  }

  .list-wrap {
    height: calc(100vh - 260rpx);
    padding: 16rpx 24rpx;
    box-sizing: border-box;
  }

  .record-card {
    background: #fff;
    border-radius: $radius;
    padding: 24rpx;
    margin-bottom: 16rpx;
    display: flex;
    align-items: center;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
    box-sizing: border-box;
  }

  .record-left {
    width: 80rpx;
    text-align: center;
    margin-right: 24rpx;
    flex-shrink: 0;
  }

  .record-day {
    font-size: 36rpx;
    font-weight: 700;
    color: $gray-900;
    display: block;
  }

  .record-week {
    font-size: 22rpx;
    color: $gray-400;
  }

  .record-center {
    flex: 1;
  }

  .record-times {
    display: flex;
    gap: 24rpx;
  }

  .record-time-item {
    display: flex;
    flex-direction: column;
  }

  .rt-label {
    font-size: 20rpx;
    color: $gray-400;
    margin-bottom: 4rpx;
  }

  .rt-value {
    font-size: 28rpx;
    font-weight: 600;
    color: $gray-900;
  }

  .rt-value.hl {
    color: $blue;
  }

  .leave-badge {
    background: #fef3c7;
    padding: 8rpx 20rpx;
    border-radius: 8rpx;
    display: inline-block;
  }

  .leave-text {
    font-size: 24rpx;
    color: #d97706;
  }

  .record-actions {
    display: flex;
    gap: 12rpx;
    margin-left: 16rpx;
    flex-shrink: 0;
  }

  .action-btn {
    width: 56rpx;
    height: 56rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .edit-btn {
    background: $blue-bg;
  }

  .edit-btn .action-icon {
    color: $blue;
    font-size: 24rpx;
  }

  .del-btn {
    background: #fef2f2;
  }

  .del-btn .action-icon {
    color: $red;
    font-size: 24rpx;
    font-weight: 700;
  }

  .empty-state {
    text-align: center;
    padding: 120rpx 0;
  }

  .empty-icon {
    font-size: 64rpx;
    display: block;
    margin-bottom: 16rpx;
  }

  .empty-text {
    font-size: 28rpx;
    color: $gray-400;
  }

  .modal-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
  }

  .modal-box {
    background: #fff;
    border-radius: 24rpx;
    padding: 40rpx;
    width: 80%;
  }

  .modal-title {
    font-size: 32rpx;
    font-weight: 700;
    color: $gray-900;
    text-align: center;
    margin-bottom: 32rpx;
    display: block;
  }

  .form-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx 0;
    border-bottom: 1rpx solid $gray-100;
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
  }

  .modal-btns {
    display: flex;
    gap: 20rpx;
    margin-top: 32rpx;
  }

  .m-btn {
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

  .m-cancel {
    background: $gray-100;
    color: $gray-700;
  }

  .m-save {
    background: $blue;
    color: #fff;
  }
</style>
