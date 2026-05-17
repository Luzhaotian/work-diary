<template>
  <view class="page">
    <view class="group">
      <text class="group-title">通用</text>
      <view class="cell" @tap="goDetail('leave')">
        <text class="cell-label">按钮设置</text>
        <view class="cell-right">
          <text class="cell-value">{{ showLeaveText }}</text>
          <text class="cell-arrow">›</text>
        </view>
      </view>
      <view class="cell" @tap="goDetail('calendar')">
        <text class="cell-label">日历设置</text>
        <view class="cell-right">
          <text class="cell-arrow">›</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { onShow } from '@dcloudio/uni-app'
  import { getShowLeave } from '@/utils/storage'

  const showLeave = ref(true)
  const showLeaveText = computed(() => (showLeave.value ? '已开启' : '已关闭'))

  function goDetail(type: string) {
    uni.navigateTo({ url: `/pages/settings/detail?type=${type}` })
  }

  onShow(() => {
    showLeave.value = getShowLeave()
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
