<template>
  <view class="page">
    <LeaveSetting v-if="currentType === 'leave'" />
    <CalendarSetting v-else-if="currentType === 'calendar'" />
    <HoursSetting v-else-if="currentType === 'hours'" />
  </view>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import LeaveSetting from './components/LeaveSetting.vue'
  import CalendarSetting from './components/CalendarSetting.vue'
  import HoursSetting from './components/HoursSetting.vue'

  const currentType = ref('')

  const titles: Record<string, string> = {
    leave: '按钮设置',
    calendar: '日历设置',
    hours: '午休扣除',
  }

  onLoad((query?: Record<string, string>) => {
    const type = query?.type || 'leave'
    currentType.value = type
    uni.setNavigationBarTitle({ title: titles[type] || '设置详情' })
  })
</script>

<style lang="scss">
  @use '@/styles/variables.scss' as *;

  .page {
    min-height: 100vh;
    background: $gray-50;
    padding: 24rpx;
  }
</style>
