<template>
  <view>
    <view class="group">
      <text class="group-title"> 午休扣除 </text>
      <view class="card">
        <view
          v-for="(opt, index) in LUNCH_BREAK_OPTIONS"
          :key="opt.hours"
          class="option"
          :class="{ 'option-border': index > 0 }"
          @tap="onSelect(opt.hours)"
        >
          <text class="option-label">
            {{ opt.label }}
          </text>
          <text v-if="hours === opt.hours" class="option-check"> ✓ </text>
        </view>
      </view>
      <text class="group-desc">
        从当日工时中扣除与午休重叠的时间。只上了上午或下午、没有跨过午休的，不会扣。
      </text>
    </view>

    <view v-if="hours > 0" class="group">
      <text class="group-title"> 午休开始 </text>
      <picker mode="time" :value="start" @change="onStartChange">
        <view class="cell">
          <text class="cell-label"> 开始时间 </text>
          <view class="cell-right">
            <text class="cell-value">
              {{ start }}
            </text>
            <text class="cell-arrow"> › </text>
          </view>
        </view>
      </picker>
      <text class="group-desc"> 例如 12:00 起扣除 2 小时，午休就是 12:00–14:00。 </text>
    </view>
  </view>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { onShow } from '@dcloudio/uni-app'
  import {
    LUNCH_BREAK_OPTIONS,
    getLunchBreakHours,
    getLunchStart,
    setLunchBreakHours,
    setLunchStart,
  } from '@/utils/storage'
  import { getUniEventValue } from '@/types/event'

  // v-if 延迟挂载时页面 onShow 可能早于子组件，需在 setup 读存储
  const hours = ref(getLunchBreakHours())
  const start = ref(getLunchStart())

  function load() {
    hours.value = getLunchBreakHours()
    start.value = getLunchStart()
  }

  function onSelect(value: number) {
    if (hours.value === value) return
    hours.value = value
    setLunchBreakHours(value)
    uni.showToast({ title: '已保存', icon: 'success' })
  }

  function onStartChange(e: Event) {
    const value = getUniEventValue<string>(e)
    start.value = value
    setLunchStart(value)
    uni.showToast({ title: '已保存', icon: 'success' })
  }

  onShow(load)
</script>

<style lang="scss">
  @use '@/styles/variables.scss' as *;

  .group {
    margin-bottom: 32rpx;
  }

  .group-title {
    font-size: 24rpx;
    color: $gray-400;
    padding: 0 8rpx 12rpx;
    display: block;
  }

  .group-desc {
    font-size: 22rpx;
    color: $gray-400;
    padding: 12rpx 8rpx 0;
    display: block;
    line-height: 1.5;
  }

  .card {
    background: #fff;
    border-radius: $radius;
    overflow: hidden;
  }

  .option {
    padding: 28rpx 24rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .option-border {
    border-top: 1rpx solid $gray-100;
  }

  .option-label {
    font-size: 30rpx;
    color: $gray-900;
  }

  .option-check {
    font-size: 30rpx;
    color: $blue;
    font-weight: 600;
  }

  .cell {
    background: #fff;
    border-radius: $radius;
    padding: 28rpx 24rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .cell-label {
    font-size: 30rpx;
    color: $gray-900;
  }

  .cell-right {
    display: flex;
    align-items: center;
    gap: 8rpx;
  }

  .cell-value {
    font-size: 26rpx;
    color: $gray-400;
  }

  .cell-arrow {
    font-size: 32rpx;
    color: $gray-200;
    font-weight: 300;
  }
</style>
