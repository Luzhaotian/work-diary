<template>
  <view class="clock-form">
    <view class="form-row">
      <text class="form-label"> 上班时间 </text>
      <picker
        mode="time"
        :value="form.clockIn.value || DEFAULT_CLOCK_IN"
        @change="form.onClockInChange"
      >
        <view class="form-picker">
          <text class="form-picker-text" :class="{ placeholder: !form.clockIn.value }">
            {{ form.clockIn.value || placeholderIn }}
          </text>
        </view>
      </picker>
    </view>

    <view class="form-row">
      <text class="form-label"> 下班时间 </text>
      <picker
        mode="time"
        :value="form.clockOut.value || DEFAULT_CLOCK_OUT"
        @change="form.onClockOutChange"
      >
        <view class="form-picker">
          <text class="form-picker-text" :class="{ placeholder: !form.clockOut.value }">
            {{ form.clockOut.value || placeholderOut }}
          </text>
        </view>
      </picker>
    </view>

    <view v-if="showLeave" class="form-row">
      <text class="form-label"> 请假 </text>
      <switch :checked="form.isLeave.value" :color="PRIMARY_COLOR" @change="form.onLeaveChange" />
    </view>

    <view v-if="showLeave && form.isLeave.value" class="form-row">
      <text class="form-label"> 类型 </text>
      <picker :range="LEAVE_TYPES" range-key="label" @change="form.onLeaveTypeChange">
        <view class="form-picker">
          <text class="form-picker-text">
            {{ form.leaveType.value === 'half' ? '半天' : '全天' }}
          </text>
        </view>
      </picker>
    </view>

    <view v-if="hoursText" class="form-row hours-row">
      <text class="form-label"> 工时 </text>
      <text class="hours-value" :class="{ invalid: form.invalidTimeRange.value }">
        {{ hoursText }}
      </text>
    </view>

    <view v-if="form.invalidTimeRange.value" class="form-warning">
      <text class="warning-text"> 下班时间早于上班时间，工时按 0 计算 </text>
    </view>
  </view>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import type { ClockFormController } from '@/types/clock'
  import { DEFAULT_CLOCK_IN, DEFAULT_CLOCK_OUT } from '@/composables/useClockForm'
  import { LEAVE_TYPES, calcHours } from '@/utils/time'
  import { PRIMARY_COLOR } from '@/utils/theme'

  const props = withDefaults(
    defineProps<{
      /** useClockForm() 返回的表单控制器，由父页面持有状态 */
      form: ClockFormController
      showLeave: boolean
      /** 未填写时展示的占位文案 */
      placeholderIn?: string
      placeholderOut?: string
      /** 是否展示工时行（全天假当天不展示） */
      showHours?: boolean
    }>(),
    {
      placeholderIn: DEFAULT_CLOCK_IN,
      placeholderOut: DEFAULT_CLOCK_OUT,
      showHours: true,
    },
  )

  const hoursText = computed(() => {
    const { clockIn, clockOut, isLeave, leaveType } = props.form
    if (!props.showHours) return ''
    // 全天假不计工时；半天假当天仍上了另外半天，照常展示工时
    // ——与列表、导出、月度统计同一口径（见 utils/time.ts 的 effectiveHours）
    if (isLeave.value && leaveType.value !== 'half') return ''
    if (!clockIn.value || !clockOut.value) return ''
    return `${calcHours(clockIn.value, clockOut.value).toFixed(1)}h`
  })
</script>

<style lang="scss">
  @use '@/styles/variables.scss' as *;

  .form-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx 0;
    border-bottom: 1rpx solid $gray-100;
  }

  .form-label {
    font-size: 28rpx;
    color: $gray-700;
  }

  .form-picker {
    padding: 8rpx 16rpx;
    background: $gray-50;
    border-radius: 8rpx;
  }

  .form-picker-text {
    font-size: 28rpx;
    color: $gray-900;
  }

  .form-picker-text.placeholder {
    color: $gray-400;
  }

  .hours-row {
    border-bottom: none;
  }

  .hours-value {
    font-size: 30rpx;
    font-weight: 600;
    color: $blue;
  }

  .hours-value.invalid {
    color: $red;
  }

  .form-warning {
    padding: 8rpx 0 0;
  }

  .warning-text {
    font-size: 22rpx;
    color: $red;
    line-height: 1.5;
  }
</style>
