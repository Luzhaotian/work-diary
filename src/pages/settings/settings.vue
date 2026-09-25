<template>
  <view class="page">
    <view class="group">
      <text class="group-title"> 通用 </text>
      <view class="cell" @tap="goDetail('leave')">
        <text class="cell-label"> 按钮设置 </text>
        <view class="cell-right">
          <text class="cell-value">
            {{ showLeaveText }}
          </text>
          <text class="cell-arrow"> › </text>
        </view>
      </view>
      <view class="cell" @tap="goCalendarFromGuide">
        <text class="cell-label"> 日历设置 </text>
        <view class="cell-right">
          <text class="cell-value">
            {{ calendarText }}
          </text>
          <text class="cell-arrow"> › </text>
        </view>
      </view>
      <view class="cell" @tap="goDetail('hours')">
        <text class="cell-label"> 午休扣除 </text>
        <view class="cell-right">
          <text class="cell-value">
            {{ lunchBreakText }}
          </text>
          <text class="cell-arrow"> › </text>
        </view>
      </view>
    </view>

    <GuideOverlay
      :visible="showGuide"
      title="打开日历设置"
      desc="在这里选择休息制度（双休 / 单休 / 大小周 / 无休）和是否遵循法定节假日。"
      primary-text="去看看"
      secondary-text="知道了"
      placement="center"
      @primary="goCalendarFromGuide"
      @secondary="dismissGuide"
      @dismiss="dismissGuide"
    />
  </view>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { onShow } from '@dcloudio/uni-app'
  import GuideOverlay from '@/components/GuideOverlay.vue'
  import {
    getCalendarSettingText,
    getLunchBreakText,
    getShowLeave,
    getGuideShowSettingsTip,
    setGuideShowSettingsTip,
    setGuideCompleted,
  } from '@/utils/storage'

  const showLeave = ref(true)
  const lunchBreakText = ref('不扣除')
  const calendarText = ref('双休 · 法定节假日')
  const showGuide = ref(false)
  const showLeaveText = computed(() => (showLeave.value ? '已开启' : '已关闭'))

  function goDetail(type: string) {
    uni.navigateTo({ url: `/pages/settings/detail?type=${type}` })
  }

  function dismissGuide() {
    showGuide.value = false
    setGuideShowSettingsTip(false)
    setGuideCompleted(true)
  }

  function goCalendarFromGuide() {
    if (showGuide.value) {
      dismissGuide()
    }
    goDetail('calendar')
  }

  onShow(() => {
    showLeave.value = getShowLeave()
    lunchBreakText.value = getLunchBreakText()
    calendarText.value = getCalendarSettingText()
    showGuide.value = getGuideShowSettingsTip()
  })
</script>

<style lang="scss">
  @use '@/styles/variables.scss' as *;

  .page {
    min-height: 100vh;
    background: $gray-50;
    padding: 24rpx;
  }

  .group {
    margin-bottom: 32rpx;
  }

  .group-title {
    font-size: 24rpx;
    color: $gray-400;
    padding: 0 8rpx 12rpx;
    display: block;
  }

  .cell {
    background: #fff;
    border-radius: $radius;
    padding: 28rpx 24rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .cell + .cell {
    margin-top: 16rpx;
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
