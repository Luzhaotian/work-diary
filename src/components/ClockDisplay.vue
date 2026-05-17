<template>
  <view class="hero">
    <text class="hero-date">{{ currentDate }}</text>
    <text class="hero-time">{{ currentTime }}</text>
  </view>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue'
  import { getLocalTimeStr, formatFullDate } from '@/utils/date'

  const currentDate = ref('')
  const currentTime = ref('')
  let timer: ReturnType<typeof setInterval> | null = null

  function updateTime() {
    const n = new Date()
    currentDate.value = formatFullDate(n, 'full')
    currentTime.value = getLocalTimeStr(n)
  }

  onMounted(() => {
    updateTime()
    timer = setInterval(updateTime, 1000)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })
</script>

<style lang="scss">
  @use '@/styles/variables.scss' as *;

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
</style>
