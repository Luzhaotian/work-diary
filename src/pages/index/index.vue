<template>
  <view class="page">
    <view class="hero">
      <text class="hero-date">{{ currentDate }}</text>
      <text class="hero-time">{{ currentTime }}</text>
    </view>

    <view class="card today-card">
      <view class="card-header">
        <text class="card-title">今日工时</text>
        <text
          class="card-badge"
          v-if="todayRecord?.clockIn && todayRecord?.clockOut"
        >
          {{ todayHours }}
        </text>
      </view>
      <view class="time-row">
        <view class="time-block">
          <text class="time-label">上班</text>
          <text class="time-value" :class="{ filled: todayRecord?.clockIn }">
            {{ todayRecord?.clockIn || "--:--" }}
          </text>
        </view>
        <view class="time-divider">
          <view class="divider-line"></view>
          <text
            class="divider-text"
            v-if="todayRecord?.clockIn && todayRecord?.clockOut"
          >
            {{ todayHours }}
          </text>
        </view>
        <view class="time-block">
          <text class="time-label">下班</text>
          <text class="time-value" :class="{ filled: todayRecord?.clockOut }">
            {{ todayRecord?.clockOut || "--:--" }}
          </text>
        </view>
      </view>
    </view>

    <view class="card input-card">
      <view class="card-header">
        <text class="card-title">记录时间</text>
      </view>
      <view class="input-row">
        <view class="input-group">
          <text class="input-label">上班时间</text>
          <picker mode="time" :value="clockInTime" @change="onClockInChange">
            <view class="picker-box">
              <text class="picker-text">{{ clockInTime }}</text>
              <text class="picker-arrow">▾</text>
            </view>
          </picker>
        </view>
        <view class="input-group">
          <text class="input-label">下班时间</text>
          <picker mode="time" :value="clockOutTime" @change="onClockOutChange">
            <view class="picker-box">
              <text class="picker-text">{{ clockOutTime }}</text>
              <text class="picker-arrow">▾</text>
            </view>
          </picker>
        </view>
      </view>
      <view class="btn-row">
        <button class="btn btn-primary" @tap="recordClockIn">
          {{ todayRecord?.clockIn ? "修改上班" : "记录上班" }}
        </button>
        <button class="btn btn-secondary" @tap="recordClockOut">
          {{ todayRecord?.clockOut ? "修改下班" : "记录下班" }}
        </button>
      </view>
      <view class="leave-section">
        <view class="leave-left">
          <text class="leave-label">请假</text>
          <picker
            v-if="isLeaveToday"
            :range="LEAVE_TYPES"
            :range-key="'label'"
            @change="onLeaveTypeChange"
          >
            <text class="leave-type-btn"
              >{{ leaveType === "half" ? "半天" : "全天" }} ▾</text
            >
          </picker>
        </view>
        <switch :checked="isLeaveToday" color="#2563EB" @change="toggleLeave" />
      </view>
    </view>

    <view class="card stats-card">
      <view class="card-header">
        <text class="card-title">本月概览</text>
        <text class="card-sub"
          >{{ monthlyStats.year }}年{{ monthlyStats.month }}月</text
        >
      </view>
      <view class="stats-grid">
        <view class="stat-item">
          <text class="stat-num">{{ monthlyStats.totalWorkDays }}</text>
          <text class="stat-desc">应出勤</text>
        </view>
        <view class="stat-item">
          <text class="stat-num">{{ monthlyStats.actualWorkDays }}</text>
          <text class="stat-desc">实际</text>
        </view>
        <view class="stat-item">
          <text class="stat-num">{{ monthlyStats.leaveDays }}</text>
          <text class="stat-desc">请假</text>
        </view>
        <view class="stat-item highlight">
          <text class="stat-num">{{ monthlyStats.averageHours }}</text>
          <text class="stat-desc">均工时(h)</text>
        </view>
      </view>
    </view>

  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { onShow } from "@dcloudio/uni-app";
import type { ClockRecord, MonthlyStats } from "@/types/clock";
import {
  getTodayRecord,
  addRecord,
  updateRecord,
  getRecordsByMonth,
  generateId,
} from "@/utils/storage";
import { countWorkdaysInMonth } from "@/utils/workday";
import { calcHours, LEAVE_TYPES, type LeaveType } from "@/utils/time";

const todayRecord = ref<ClockRecord | undefined>();
const currentDate = ref("");
const currentTime = ref("");
const clockInTime = ref("09:00");
const clockOutTime = ref("18:00");
const isLeaveToday = ref(false);
const leaveType = ref<LeaveType>("full");
const now = new Date();
let timer: ReturnType<typeof setInterval> | null = null;
const monthlyStats = ref<MonthlyStats>({
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  totalWorkDays: 0,
  actualWorkDays: 0,
  leaveDays: 0,
  totalHours: 0,
  averageHours: 0,
});

function updateTime() {
  const n = new Date();
  currentDate.value = n.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  });
  currentTime.value = [
    String(n.getHours()).padStart(2, "0"),
    String(n.getMinutes()).padStart(2, "0"),
    String(n.getSeconds()).padStart(2, "0"),
  ].join(":");
}

const todayHours = computed(() => {
  if (todayRecord.value?.clockIn && todayRecord.value?.clockOut) {
    return (
      calcHours(todayRecord.value.clockIn, todayRecord.value.clockOut).toFixed(
        1,
      ) + "h"
    );
  }
  return "--";
});

function loadMonthlyStats() {
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const records = getRecordsByMonth(y, m);
  const totalWorkDays = countWorkdaysInMonth(y, m);
  let actualWorkDays = 0;
  let leaveDays = 0;
  let totalHours = 0;

  records.forEach((r) => {
    if (r.isLeave) {
      leaveDays += r.leaveType === "half" ? 0.5 : 1;
    } else if (r.clockIn && r.clockOut) {
      actualWorkDays++;
      totalHours += calcHours(r.clockIn, r.clockOut);
    }
  });

  monthlyStats.value = {
    year: y,
    month: m,
    totalWorkDays,
    actualWorkDays,
    leaveDays,
    totalHours,
    averageHours:
      actualWorkDays > 0
        ? parseFloat((totalHours / actualWorkDays).toFixed(1))
        : 0,
  };
}

function onClockInChange(e: any) {
  clockInTime.value = e.detail.value;
}
function onClockOutChange(e: any) {
  clockOutTime.value = e.detail.value;
}
function onLeaveTypeChange(e: any) {
  leaveType.value = LEAVE_TYPES[e.detail.value].value as LeaveType;
}

function toggleLeave(e: any) {
  const today = new Date().toISOString().split("T")[0];
  isLeaveToday.value = e.detail.value;

  if (todayRecord.value) {
    todayRecord.value.isLeave = isLeaveToday.value;
    todayRecord.value.leaveType = isLeaveToday.value
      ? leaveType.value
      : undefined;
    if (isLeaveToday.value) {
      todayRecord.value.clockIn = undefined;
      todayRecord.value.clockOut = undefined;
    }
    updateRecord(todayRecord.value);
  } else {
    const rec: ClockRecord = {
      id: generateId(),
      date: today,
      isLeave: isLeaveToday.value,
      leaveType: isLeaveToday.value ? leaveType.value : undefined,
    };
    addRecord(rec);
    todayRecord.value = rec;
  }
  loadMonthlyStats();
}

function recordClockIn() {
  const today = new Date().toISOString().split("T")[0];
  if (todayRecord.value) {
    todayRecord.value.clockIn = clockInTime.value;
    updateRecord(todayRecord.value);
  } else {
    const rec: ClockRecord = {
      id: generateId(),
      date: today,
      clockIn: clockInTime.value,
      isLeave: false,
    };
    addRecord(rec);
    todayRecord.value = rec;
  }
  loadMonthlyStats();
  uni.showToast({ title: "已记录", icon: "success" });
}

function recordClockOut() {
  const today = new Date().toISOString().split("T")[0];
  if (todayRecord.value) {
    todayRecord.value.clockOut = clockOutTime.value;
    updateRecord(todayRecord.value);
  } else {
    const rec: ClockRecord = {
      id: generateId(),
      date: today,
      clockOut: clockOutTime.value,
      isLeave: false,
    };
    addRecord(rec);
    todayRecord.value = rec;
  }
  loadMonthlyStats();
  uni.showToast({ title: "已记录", icon: "success" });
}

function refreshData() {
  todayRecord.value = getTodayRecord();
  if (todayRecord.value) {
    isLeaveToday.value = todayRecord.value.isLeave || false;
    leaveType.value =
      (todayRecord.value.leaveType as "full" | "half") || "full";
    if (todayRecord.value.clockIn)
      clockInTime.value = todayRecord.value.clockIn;
    if (todayRecord.value.clockOut)
      clockOutTime.value = todayRecord.value.clockOut;
  } else {
    isLeaveToday.value = false;
    leaveType.value = "full";
    clockInTime.value = "09:00";
    clockOutTime.value = "18:00";
  }
  loadMonthlyStats();
}

onMounted(() => {
  refreshData();
  updateTime();
  timer = setInterval(updateTime, 1000);
});

onShow(() => {
  refreshData();
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style lang="scss">
@use "@/styles/variables.scss" as *;

.page {
  min-height: 100vh;
  background: $gray-50;
  padding-bottom: 140rpx;
}

.hero {
  background: linear-gradient(135deg, $blue 0%, $blue-dark 100%);
  padding: 48rpx 40rpx 56rpx;
  color: #fff;
  text-align: center;
  border-radius: 0 0 40rpx 40rpx;
}

.hero-date {
  font-size: 26rpx;
  opacity: 0.85;
  display: block;
  margin-bottom: 8rpx;
}

.hero-time {
  font-size: 64rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
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
