<template>
  <view class="group">
    <text class="group-title">请假功能</text>
    <view class="cell">
      <text class="cell-label">展示请假按钮</text>
      <switch :checked="showLeave" color="#2563EB" @change="onToggle" />
    </view>
    <text class="group-desc">关闭后，记录、历史、日历页面将隐藏请假相关操作</text>
  </view>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { onShow } from '@dcloudio/uni-app'
  import { getShowLeave, setShowLeave } from '@/utils/storage'

  const showLeave = ref(true)

  function onToggle(e: any) {
    const val = (e as { detail: { value: boolean } }).detail.value
    showLeave.value = val
    setShowLeave(val)
    uni.showToast({ title: '已保存', icon: 'success' })
  }

  onShow(() => {
    showLeave.value = getShowLeave()
  })
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
</style>
