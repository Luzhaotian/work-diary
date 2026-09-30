<template>
  <view>
    <view class="group">
      <text class="group-title"> 休息制度 </text>
      <view class="card">
        <view
          v-for="(opt, index) in WEEKEND_MODE_OPTIONS"
          :key="opt.value"
          class="option"
          :class="{ 'option-border': index > 0 }"
          @tap="onSelectMode(opt.value)"
        >
          <view class="option-main">
            <text class="option-label">
              {{ opt.label }}
            </text>
            <text class="option-desc">
              {{ opt.desc }}
            </text>
          </view>
          <text v-if="weekendMode === opt.value" class="option-check"> ✓ </text>
        </view>
      </view>
    </view>

    <view v-if="weekendMode === 'single' || weekendMode === 'biweekly'" class="group">
      <text class="group-title">
        {{ weekendMode === 'biweekly' ? '小周单休日' : '单休日' }}
      </text>
      <view class="card">
        <view
          v-for="(opt, index) in SINGLE_REST_DAY_OPTIONS"
          :key="opt.value"
          class="option"
          :class="{ 'option-border': index > 0 }"
          @tap="onSelectRestDay(opt.value)"
        >
          <view class="option-main">
            <text class="option-label">
              {{ opt.label }}
            </text>
            <text class="option-desc">
              {{ opt.desc }}
            </text>
          </view>
          <text v-if="singleRestDay === opt.value" class="option-check"> ✓ </text>
        </view>
      </view>
    </view>

    <view v-if="weekendMode === 'biweekly'" class="group">
      <text class="group-title"> 大小周参考 </text>
      <picker mode="date" :value="anchorDate" @change="onAnchorDateChange">
        <view class="cell">
          <text class="cell-label"> 参考日期 </text>
          <view class="cell-right">
            <text class="cell-value">
              {{ anchorDate }}
            </text>
            <text class="cell-arrow"> › </text>
          </view>
        </view>
      </picker>
      <view class="card card-gap">
        <view
          v-for="(opt, index) in BIWEEKLY_WEEK_TYPE_OPTIONS"
          :key="opt.value"
          class="option"
          :class="{ 'option-border': index > 0 }"
          @tap="onSelectAnchorType(opt.value)"
        >
          <view class="option-main">
            <text class="option-label">
              {{ opt.label }}
            </text>
            <text class="option-desc">
              {{ opt.desc }}
            </text>
          </view>
          <text v-if="anchorType === opt.value" class="option-check"> ✓ </text>
        </view>
      </view>
      <view class="quick-row">
        <view class="quick-btn" @tap="setThisWeek('big')"> 本周设为大周 </view>
        <view class="quick-btn" @tap="setThisWeek('small')"> 本周设为小周 </view>
      </view>
      <text class="group-desc">
        选定参考周后隔周交替。当前：本周为{{ thisWeekLabel }}，下周为{{ nextWeekLabel }}。
      </text>
    </view>

    <view class="group">
      <text class="group-title"> 法定节假日 </text>
      <view class="cell">
        <text class="cell-label"> 遵循法定节假日 </text>
        <switch :checked="useHolidays" :color="PRIMARY_COLOR" @change="onToggleHolidays" />
      </view>
      <text class="group-desc">
        开启后按中国法定节假日与调休标记；关闭则为「无法定节假日」，仅按休息制度判断。
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { onShow } from '@dcloudio/uni-app'
  import {
    WEEKEND_MODE_OPTIONS,
    SINGLE_REST_DAY_OPTIONS,
    BIWEEKLY_WEEK_TYPE_OPTIONS,
    getWeekendMode,
    setWeekendMode,
    getSingleRestDay,
    setSingleRestDay,
    getBiweeklyAnchorDate,
    setBiweeklyAnchorDate,
    getBiweeklyAnchorType,
    setBiweeklyAnchorType,
    getUseHolidays,
    setUseHolidays,
    type WeekendMode,
    type SingleRestDay,
    type BiweeklyWeekType,
  } from '@/utils/storage'
  import { getLocalDateStr } from '@/utils/date'
  import { getBiweeklyWeekType } from '@/utils/workday'
  import { getUniEventValue } from '@/types/event'
  import { PRIMARY_COLOR } from '@/utils/theme'

  // v-if 延迟挂载时需在 setup 读存储
  const weekendMode = ref<WeekendMode>(getWeekendMode())
  const singleRestDay = ref<SingleRestDay>(getSingleRestDay())
  const anchorDate = ref(getBiweeklyAnchorDate())
  const anchorType = ref<BiweeklyWeekType>(getBiweeklyAnchorType())
  const useHolidays = ref(getUseHolidays())
  const todayStr = getLocalDateStr()

  // 直接把响应式的 anchorDate / anchorType 传进去，computed 能正常追踪依赖。
  // 此前用 `void anchorDate.value` 制造假依赖，因为 getBiweeklyWeekType 内部
  // 读的是 storage 缓存、Vue 追踪不到——现在改成显式传参，hack 可删。
  const thisWeekType = computed(() =>
    getBiweeklyWeekType(todayStr, {
      anchorDate: anchorDate.value,
      anchorType: anchorType.value,
    }),
  )
  const thisWeekLabel = computed(() => (thisWeekType.value === 'big' ? '大周' : '小周'))
  const nextWeekLabel = computed(() => (thisWeekType.value === 'big' ? '小周' : '大周'))

  function load() {
    weekendMode.value = getWeekendMode()
    singleRestDay.value = getSingleRestDay()
    anchorDate.value = getBiweeklyAnchorDate()
    anchorType.value = getBiweeklyAnchorType()
    useHolidays.value = getUseHolidays()
  }

  function onSelectMode(value: WeekendMode) {
    if (weekendMode.value === value) return
    weekendMode.value = value
    setWeekendMode(value)
    uni.showToast({ title: '已保存', icon: 'success' })
  }

  function onSelectRestDay(value: SingleRestDay) {
    if (singleRestDay.value === value) return
    singleRestDay.value = value
    setSingleRestDay(value)
    uni.showToast({ title: '已保存', icon: 'success' })
  }

  function onAnchorDateChange(e: Event) {
    const value = getUniEventValue<string>(e)
    anchorDate.value = value
    setBiweeklyAnchorDate(value)
    uni.showToast({ title: '已保存', icon: 'success' })
  }

  function onSelectAnchorType(value: BiweeklyWeekType) {
    if (anchorType.value === value) return
    anchorType.value = value
    setBiweeklyAnchorType(value)
    uni.showToast({ title: '已保存', icon: 'success' })
  }

  function setThisWeek(type: BiweeklyWeekType) {
    const today = getLocalDateStr()
    anchorDate.value = today
    anchorType.value = type
    setBiweeklyAnchorDate(today)
    setBiweeklyAnchorType(type)
    uni.showToast({ title: type === 'big' ? '本周已设为大周' : '本周已设为小周', icon: 'success' })
  }

  function onToggleHolidays(e: Event) {
    const val = getUniEventValue<boolean>(e)
    useHolidays.value = val
    setUseHolidays(val)
    uni.showToast({ title: '已保存', icon: 'success' })
  }

  onShow(load)
</script>

<style lang="scss">
  @use '@/styles/variables.scss' as *;
  @use '@/styles/settings.scss' as st;

  @include st.group-block;
  @include st.group-desc;
  @include st.option-card;
  @include st.cell-base;
  @include st.cell-nav;

  // 以下为 CalendarSetting 特有、或与 HoursSetting 同名但有差异的类，
  // 故保留在组件内（.option 多 gap、.option-label 多 display:block、
  // .option-check 多 flex-shrink，直接并入 mixin 会改变 HoursSetting 外观）
  .card-gap {
    margin-top: 16rpx;
  }

  .option {
    padding: 28rpx 24rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24rpx;
  }

  .option-main {
    flex: 1;
    min-width: 0;
  }

  .option-label {
    font-size: 30rpx;
    color: $gray-900;
    display: block;
  }

  .option-desc {
    font-size: 22rpx;
    color: $gray-400;
    margin-top: 6rpx;
    display: block;
  }

  .option-check {
    font-size: 30rpx;
    color: $blue;
    font-weight: 600;
    flex-shrink: 0;
  }

  .quick-row {
    display: flex;
    gap: 16rpx;
    margin-top: 16rpx;
  }

  .quick-btn {
    flex: 1;
    text-align: center;
    background: #fff;
    border-radius: $radius;
    padding: 20rpx 12rpx;
    font-size: 26rpx;
    color: $blue;
  }
</style>
