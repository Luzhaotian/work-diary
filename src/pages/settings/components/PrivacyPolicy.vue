<template>
  <view>
    <view class="group">
      <text class="group-title"> 隐私说明 </text>
      <view class="card">
        <text class="para">
          「上班记」是一款纯本地工时记录工具。无需注册或登录账号，不收集、不上传、不向第三方共享你的个人信息。
        </text>
        <text class="para">
          打卡记录、请假标记、日历与午休等偏好，仅保存在本机（微信小程序本地存储 /
          浏览器本地存储）。卸载应用或清除本地数据后，相关内容将无法恢复。
        </text>
        <text class="para">
          本应用不请求通讯录、定位、相册等与核心功能无关的权限，也不进行用户画像或广告追踪。
        </text>
        <text class="para">
          法定节假日判断基于应用内置的公开节假日数据在本地完成，不会因此向我们的服务器回传你的使用情况。
        </text>
        <text class="para last">
          如对隐私有疑问，请联系我：lu199705@163.com。继续使用即表示你理解上述说明。
        </text>
      </view>
    </view>

    <view class="group">
      <text class="group-title"> 数据归属 </text>
      <view class="card">
        <view class="row">
          <text class="row-label"> 账号体系 </text>
          <text class="row-value"> 无 </text>
        </view>
        <view class="row row-border">
          <text class="row-label"> 数据存放 </text>
          <text class="row-value"> 仅本机 </text>
        </view>
        <view class="row row-border">
          <text class="row-label"> 信息收集 </text>
          <text class="row-value"> 不收集 </text>
        </view>
        <view class="row row-border">
          <text class="row-label"> 产品属性 </text>
          <text class="row-value"> 纯工具 </text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts"></script>

<style lang="scss">
  @use '@/styles/variables.scss' as *;
  @use '@/styles/settings.scss' as st;

  @include st.group-block;

  .card {
    background: #fff;
    border-radius: $radius;
    padding: 28rpx 24rpx;
    overflow: hidden;
  }

  .para {
    font-size: 28rpx;
    color: $gray-700;
    line-height: 1.7;
    display: block;
    margin-bottom: 24rpx;
  }

  .para.last {
    margin-bottom: 0;
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8rpx 0;
  }

  .row-border {
    margin-top: 20rpx;
    padding-top: 20rpx;
    border-top: 1rpx solid $gray-100;
  }

  .row-label {
    font-size: 28rpx;
    color: $gray-900;
  }

  .row-value {
    font-size: 28rpx;
    color: $gray-400;
  }
</style>
