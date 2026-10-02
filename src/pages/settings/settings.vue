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
      <view class="cell" @tap="goDetail('autoclock')">
        <text class="cell-label"> 自动打卡 </text>
        <view class="cell-right">
          <text class="cell-value">
            {{ autoClockText }}
          </text>
          <text class="cell-arrow"> › </text>
        </view>
      </view>
    </view>

    <view class="group">
      <text class="group-title"> 关于 </text>
      <view class="cell" @tap="goDetail('privacy')">
        <text class="cell-label"> 隐私协议 </text>
        <view class="cell-right">
          <text class="cell-value"> 不收集 · 纯本地 </text>
          <text class="cell-arrow"> › </text>
        </view>
      </view>
      <view class="cell" @tap="copyEmail">
        <text class="cell-label"> 联系我 </text>
        <view class="cell-right">
          <text class="cell-value">
            {{ contactEmail }}
          </text>
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
    getAutoClockSettingText,
    getShowLeave,
    getGuideShowSettingsTip,
    setGuideShowSettingsTip,
    setGuideCompleted,
  } from '@/utils/storage'

  const showLeave = ref(true)
  const lunchBreakText = ref('不扣除')
  const calendarText = ref('双休 · 法定节假日')
  const autoClockText = ref('已关闭')
  const showGuide = ref(false)
  const contactEmail = 'lu199705@163.com'
  const showLeaveText = computed(() => (showLeave.value ? '已开启' : '已关闭'))

  function goDetail(type: string) {
    uni.navigateTo({ url: `/pages/settings/detail?type=${type}` })
  }

  function copyEmail() {
    uni.setClipboardData({
      data: contactEmail,
      success() {
        uni.showToast({ title: '邮箱已复制', icon: 'success' })
      },
    })
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
    autoClockText.value = getAutoClockSettingText()
    showGuide.value = getGuideShowSettingsTip()
  })
</script>

<style lang="scss">
  @use '@/styles/variables.scss' as *;
  @use '@/styles/settings.scss' as st;

  .page {
    min-height: 100vh;
    background: $gray-50;
    padding: 24rpx;
  }

  // 只 include 模板真正用到的类（本页无 .group-desc）
  @include st.group-block;
  @include st.cell-base;
  @include st.cell-nav;

  // 设置主页特有：相邻单元格之间留间距
  .cell + .cell {
    margin-top: 16rpx;
  }
</style>
