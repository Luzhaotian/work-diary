<template>
  <view>
    <view class="group">
      <text class="group-title"> 自动打卡 </text>
      <view class="cell">
        <text class="cell-label"> 开启自动打卡 </text>
        <switch :checked="enabled" :color="PRIMARY_COLOR" @change="onToggleEnabled" />
      </view>
      <text class="group-desc">
        开启后按下方设置的时间自动记录上下班。关闭后所有自动打卡（含进入补卡、到点打卡）都不生效。
      </text>
    </view>

    <template v-if="enabled">
      <view class="group">
        <text class="group-title"> 打卡方式 </text>
        <view class="cell">
          <text class="cell-label"> 进入应用时补卡 </text>
          <switch :checked="onLaunch" :color="PRIMARY_COLOR" @change="onToggleLaunch" />
        </view>
        <view class="cell cell-gap">
          <text class="cell-label"> 应用开着到点打卡 </text>
          <switch :checked="scheduled" :color="PRIMARY_COLOR" @change="onToggleScheduled" />
        </view>
        <text class="group-desc">
          小程序与网页无法在应用未打开时后台运行：没开应用时错过的点，会在你下次打开应用时按「进入补卡」补齐；应用开着则由「到点打卡」在整点写入。
        </text>
      </view>

      <view class="group">
        <text class="group-title"> 打卡时间 </text>
        <picker mode="time" :value="inTime" @change="onInTimeChange">
          <view class="cell">
            <text class="cell-label"> 上班时间 </text>
            <view class="cell-right">
              <text class="cell-value"> {{ inTime }} </text>
              <text class="cell-arrow"> › </text>
            </view>
          </view>
        </picker>
        <picker mode="time" :value="outTime" @change="onOutTimeChange">
          <view class="cell cell-gap">
            <text class="cell-label"> 下班时间 </text>
            <view class="cell-right">
              <text class="cell-value"> {{ outTime }} </text>
              <text class="cell-arrow"> › </text>
            </view>
          </view>
        </picker>
        <text class="group-desc">
          自动打卡写入的就是这里的时间，与班次保持一致；休息日（含法定节假日与调休）不会自动打卡，也不会覆盖你手动打过的卡或请假标记。
        </text>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { onShow } from '@dcloudio/uni-app'
  import {
    getAutoClockEnabled,
    setAutoClockEnabled,
    getAutoClockOnLaunch,
    setAutoClockOnLaunch,
    getAutoClockScheduled,
    setAutoClockScheduled,
    getAutoClockInTime,
    setAutoClockInTime,
    getAutoClockOutTime,
    setAutoClockOutTime,
  } from '@/utils/storage'
  import { getUniEventValue } from '@/types/event'
  import { PRIMARY_COLOR } from '@/utils/theme'

  // v-if 延迟挂载时需在 setup 读存储
  const enabled = ref(getAutoClockEnabled())
  const onLaunch = ref(getAutoClockOnLaunch())
  const scheduled = ref(getAutoClockScheduled())
  const inTime = ref(getAutoClockInTime())
  const outTime = ref(getAutoClockOutTime())

  function load() {
    enabled.value = getAutoClockEnabled()
    onLaunch.value = getAutoClockOnLaunch()
    scheduled.value = getAutoClockScheduled()
    inTime.value = getAutoClockInTime()
    outTime.value = getAutoClockOutTime()
  }

  function onToggleEnabled(e: Event) {
    enabled.value = getUniEventValue<boolean>(e)
    setAutoClockEnabled(enabled.value)
    uni.showToast({ title: enabled.value ? '已开启' : '已关闭', icon: 'success' })
  }

  function onToggleLaunch(e: Event) {
    onLaunch.value = getUniEventValue<boolean>(e)
    setAutoClockOnLaunch(onLaunch.value)
    uni.showToast({ title: '已保存', icon: 'success' })
  }

  function onToggleScheduled(e: Event) {
    scheduled.value = getUniEventValue<boolean>(e)
    setAutoClockScheduled(scheduled.value)
    uni.showToast({ title: '已保存', icon: 'success' })
  }

  function onInTimeChange(e: Event) {
    inTime.value = getUniEventValue<string>(e)
    setAutoClockInTime(inTime.value)
    uni.showToast({ title: '已保存', icon: 'success' })
  }

  function onOutTimeChange(e: Event) {
    outTime.value = getUniEventValue<string>(e)
    setAutoClockOutTime(outTime.value)
    uni.showToast({ title: '已保存', icon: 'success' })
  }

  onShow(load)
</script>

<style lang="scss">
  @use '@/styles/settings.scss' as st;

  @include st.group-block;
  @include st.group-desc;
  @include st.cell-base;
  @include st.cell-nav;

  // 本页特有：picker 包裹的相邻 cell 之间留间距
  .cell-gap {
    margin-top: 16rpx;
  }
</style>
