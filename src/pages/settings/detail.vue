<template>
  <view class="page">
    <LeaveSetting v-if="currentType === 'leave'" />
    <CalendarSetting v-else-if="currentType === 'calendar'" />
  </view>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import LeaveSetting from './components/LeaveSetting.vue'
  import CalendarSetting from './components/CalendarSetting.vue'

  const currentType = ref('')

  onLoad((query: any) => {
    currentType.value = query?.type || 'leave'
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
