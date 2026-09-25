<template>
  <view v-if="visible" class="guide-root" @touchmove.stop.prevent>
    <view class="guide-mask" @tap="onDismiss" />
    <view class="guide-panel" :class="placement" @tap.stop>
      <text class="guide-title">
        {{ title }}
      </text>
      <text class="guide-desc">
        {{ desc }}
      </text>
      <view class="guide-actions">
        <view v-if="secondaryText" class="guide-btn ghost" @tap="onSecondary">
          {{ secondaryText }}
        </view>
        <view class="guide-btn primary" @tap="onPrimary">
          {{ primaryText }}
        </view>
      </view>
      <view v-if="placement === 'bottom'" class="guide-arrow" />
    </view>
  </view>
</template>

<script setup lang="ts">
  withDefaults(
    defineProps<{
      visible: boolean
      title: string
      desc: string
      primaryText?: string
      secondaryText?: string
      /** bottom：贴近底部 tab；center：居中 */
      placement?: 'bottom' | 'center'
    }>(),
    {
      primaryText: '知道了',
      secondaryText: '',
      placement: 'bottom',
    },
  )

  const emit = defineEmits<{
    dismiss: []
    primary: []
    secondary: []
  }>()

  function onDismiss() {
    emit('dismiss')
  }
  function onPrimary() {
    emit('primary')
  }
  function onSecondary() {
    emit('secondary')
  }
</script>

<style lang="scss">
  @use '@/styles/variables.scss' as *;

  .guide-root {
    position: fixed;
    inset: 0;
    z-index: 9999;
  }

  .guide-mask {
    position: absolute;
    inset: 0;
    background: rgba(17, 24, 39, 0.55);
  }

  .guide-panel {
    position: absolute;
    left: 40rpx;
    right: 40rpx;
    background: #fff;
    border-radius: 20rpx;
    padding: 36rpx 32rpx 28rpx;
    box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.18);
  }

  .guide-panel.bottom {
    bottom: calc(120rpx + env(safe-area-inset-bottom));
  }

  .guide-panel.center {
    top: 40%;
    transform: translateY(-50%);
  }

  .guide-title {
    font-size: 34rpx;
    font-weight: 600;
    color: $gray-900;
    display: block;
  }

  .guide-desc {
    font-size: 26rpx;
    color: $gray-500;
    line-height: 1.55;
    margin-top: 16rpx;
    display: block;
  }

  .guide-actions {
    display: flex;
    gap: 16rpx;
    margin-top: 32rpx;
  }

  .guide-btn {
    flex: 1;
    text-align: center;
    padding: 22rpx 12rpx;
    border-radius: $radius;
    font-size: 28rpx;
  }

  .guide-btn.ghost {
    background: $gray-100;
    color: $gray-500;
  }

  .guide-btn.primary {
    background: $blue;
    color: #fff;
    font-weight: 500;
  }

  .guide-arrow {
    position: absolute;
    right: 48rpx;
    bottom: -16rpx;
    width: 28rpx;
    height: 28rpx;
    background: #fff;
    transform: rotate(45deg);
    border-radius: 4rpx;
  }
</style>
