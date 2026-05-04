<template>
  <view class="page">
    <view class="header">
      <text class="header-title">工时统计</text>
      <text class="header-sub">最近三个月数据</text>
    </view>

    <view class="section">
      <text class="section-title">月度明细</text>
      <view
        v-for="stat in monthlyStats"
        :key="`${stat.year}-${stat.month}`"
        class="month-card"
      >
        <view class="month-head">
          <text class="month-name">{{ stat.month }}月</text>
          <text class="month-avg">均 {{ stat.averageHours }}h</text>
        </view>
        <view class="month-grid">
          <view class="mg-item">
            <text class="mg-val">{{ stat.totalWorkDays }}</text>
            <text class="mg-label">应出勤</text>
          </view>
          <view class="mg-item">
            <text class="mg-val">{{ stat.actualWorkDays }}</text>
            <text class="mg-label">实际</text>
          </view>
          <view class="mg-item">
            <text class="mg-val">{{ stat.leaveDays }}</text>
            <text class="mg-label">请假</text>
          </view>
          <view class="mg-item hl">
            <text class="mg-val">{{ stat.averageHours }}</text>
            <text class="mg-label">均工时</text>
          </view>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">平均工时对比</text>
      <view class="chart-box">
        <view
          v-for="stat in monthlyStats"
          :key="`bar-${stat.year}-${stat.month}`"
          class="bar-col"
        >
          <view class="bar-track">
            <view
              class="bar-fill"
              :style="{
                height: Math.min((stat.averageHours / 10) * 100, 100) + '%',
              }"
            ></view>
          </view>
          <text class="bar-val">{{ stat.averageHours }}h</text>
          <text class="bar-label">{{ stat.month }}月</text>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">汇总</text>
      <view class="summary-grid">
        <view class="sum-item">
          <text class="sum-val">{{ totalWorkDays }}</text>
          <text class="sum-label">总应出勤</text>
        </view>
        <view class="sum-item">
          <text class="sum-val">{{ totalActualDays }}</text>
          <text class="sum-label">总实际出勤</text>
        </view>
        <view class="sum-item">
          <text class="sum-val">{{ totalLeaveDays }}</text>
          <text class="sum-label">总请假</text>
        </view>
        <view class="sum-item hl">
          <text class="sum-val">{{ overallAverageHours }}</text>
          <text class="sum-label">整体均工时</text>
        </view>
      </view>
    </view>

  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { onShow } from "@dcloudio/uni-app";
import type { MonthlyStats } from "@/types/clock";
import { getRecordsByMonth } from "@/utils/storage";
import { countWorkdaysInMonth } from "@/utils/workday";
import { calcHours } from "@/utils/time";

const monthlyStats = ref<MonthlyStats[]>([]);

function calcStats(year: number, month: number): MonthlyStats {
  const records = getRecordsByMonth(year, month);
  const totalWorkDays = countWorkdaysInMonth(year, month);
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

  return {
    year,
    month,
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

function loadStats() {
  const now = new Date();
  const stats: MonthlyStats[] = [];
  for (let i = 2; i >= 0; i--) {
    let m = now.getMonth() + 1 - i;
    let y = now.getFullYear();
    if (m <= 0) {
      m += 12;
      y--;
    }
    stats.push(calcStats(y, m));
  }
  monthlyStats.value = stats;
}

const totalWorkDays = computed(() =>
  monthlyStats.value.reduce((s, v) => s + v.totalWorkDays, 0),
);
const totalActualDays = computed(() =>
  monthlyStats.value.reduce((s, v) => s + v.actualWorkDays, 0),
);
const totalLeaveDays = computed(() =>
  monthlyStats.value.reduce((s, v) => s + v.leaveDays, 0),
);
const overallAverageHours = computed(() => {
  const h = monthlyStats.value.reduce((s, v) => s + v.totalHours, 0);
  const d = monthlyStats.value.reduce((s, v) => s + v.actualWorkDays, 0);
  return d > 0 ? (h / d).toFixed(1) : "0.0";
});

onMounted(() => {
  loadStats();
});

onShow(() => {
  loadStats();
});
</script>

<style lang="scss">
@use "@/styles/variables.scss" as *;

.page {
  min-height: 100vh;
  background: $gray-50;
  padding-bottom: 140rpx;
}

.header {
  background: linear-gradient(135deg, $blue 0%, $blue-dark 100%);
  padding: 40rpx;
  border-radius: 0 0 40rpx 40rpx;
}

.header-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #fff;
  display: block;
  margin-bottom: 8rpx;
}

.header-sub {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}

.section {
  margin: 24rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 700;
  color: $gray-900;
  margin-bottom: 16rpx;
  display: block;
}

.month-card {
  background: #fff;
  border-radius: $radius;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.month-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.month-name {
  font-size: 28rpx;
  font-weight: 700;
  color: $gray-900;
}

.month-avg {
  font-size: 24rpx;
  color: $blue;
  font-weight: 600;
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
}

.mg-item {
  text-align: center;
  padding: 16rpx 0;
  background: $gray-50;
  border-radius: 12rpx;
}

.mg-item.hl {
  background: $blue-bg;
}

.mg-val {
  font-size: 30rpx;
  font-weight: 700;
  color: $gray-900;
  display: block;
  margin-bottom: 4rpx;
}

.mg-item.hl .mg-val {
  color: $blue;
}

.mg-label {
  font-size: 20rpx;
  color: $gray-500;
}

.chart-box {
  background: #fff;
  border-radius: $radius;
  padding: 32rpx;
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.bar-track {
  width: 48rpx;
  height: 240rpx;
  background: $gray-100;
  border-radius: 24rpx;
  position: relative;
  overflow: hidden;
  margin-bottom: 12rpx;
}

.bar-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, $blue 0%, $blue-dark 100%);
  border-radius: 24rpx;
  transition: height 0.3s;
}

.bar-val {
  font-size: 22rpx;
  color: $blue;
  font-weight: 600;
  margin-bottom: 4rpx;
}

.bar-label {
  font-size: 22rpx;
  color: $gray-500;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.sum-item {
  text-align: center;
  padding: 24rpx;
  background: #fff;
  border-radius: $radius;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.sum-item.hl {
  background: linear-gradient(135deg, $blue 0%, $blue-dark 100%);
}

.sum-val {
  font-size: 36rpx;
  font-weight: 700;
  color: $gray-900;
  display: block;
  margin-bottom: 4rpx;
}

.sum-item.hl .sum-val {
  color: #fff;
}

.sum-label {
  font-size: 22rpx;
  color: $gray-500;
}

.sum-item.hl .sum-label {
  color: rgba(255, 255, 255, 0.7);
}
</style>
