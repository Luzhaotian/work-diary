<template>
  <view v-if="visible" class="apology-root" @touchmove.stop.prevent>
    <view class="apology-mask" />
    <view class="apology-panel" @tap.stop>
      <text class="apology-title"> 致歉声明 </text>
      <scroll-view scroll-y class="apology-body">
        <text class="apology-para">
          因行业紧缩、资金吃紧，实在没办法，只能开通广告插入。如对您造成干扰，深感抱歉。
        </text>
        <text class="apology-para">
          小程序设计之初本意是个人自用，如今使用人数猛增，感谢各位的喜爱与支持。
        </text>
        <text class="apology-para">
          如有优化建议或使用问题，可前往「设置 → 联系我」，通过邮箱与我联系。
        </text>
        <text class="apology-para last"> 再次抱歉，也谢谢你们的理解。 </text>
      </scroll-view>
      <view class="apology-btn" @tap="$emit('confirm')"> 我知道了 </view>
    </view>
  </view>
</template>

<script setup lang="ts">
  defineProps<{
    visible: boolean
  }>()

  defineEmits<{
    confirm: []
  }>()
</script>

<style lang="scss">
  @use '@/styles/variables.scss' as *;

  .apology-root {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48rpx;
    box-sizing: border-box;
  }

  .apology-mask {
    position: absolute;
    inset: 0;
    background: rgba(17, 24, 39, 0.55);
  }

  .apology-panel {
    position: relative;
    width: 100%;
    max-width: 640rpx;
    background: #fff;
    border-radius: 20rpx;
    padding: 40rpx 32rpx 28rpx;
    box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.18);
  }

  .apology-title {
    font-size: 36rpx;
    font-weight: 600;
    color: $gray-900;
    text-align: center;
    display: block;
    margin-bottom: 28rpx;
  }

  .apology-body {
    max-height: 56vh;
  }

  .apology-para {
    font-size: 28rpx;
    color: $gray-700;
    line-height: 1.7;
    display: block;
    margin-bottom: 20rpx;
  }

  .apology-para.last {
    margin-bottom: 8rpx;
  }

  .apology-btn {
    margin-top: 32rpx;
    text-align: center;
    padding: 24rpx 12rpx;
    border-radius: $radius;
    background: $blue;
    color: #fff;
    font-size: 30rpx;
    font-weight: 500;
  }
</style>
