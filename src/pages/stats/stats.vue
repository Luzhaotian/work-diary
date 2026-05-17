<template>
  <view class="page">
    <view class="header">
      <text class="header-title">工时统计</text>
      <text class="header-sub">{{ rangeLabel }}</text>
    </view>

    <view class="filter-bar">
      <view
        v-for="opt in rangeOptions"
        :key="opt.value"
        class="filter-btn"
        :class="{ active: range === opt.value }"
        @tap="onRangeChange(opt.value)"
      >
        <text class="filter-text">{{ opt.label }}</text>
      </view>
    </view>

    <!-- 柱状图：分页展示 -->
    <view class="section" v-if="chartPages.length > 0">
      <view class="section-head">
        <text class="section-title">平均工时对比</text>
        <text class="page-indicator" v-if="chartPages.length > 1"
          >{{ chartPageIndex + 1 }}/{{ chartPages.length }}</text
        >
      </view>
      <swiper
        class="chart-swiper"
        :indicator-dots="chartPages.length > 1"
        indicator-color="rgba(0,0,0,0.15)"
        indicator-active-color="#2563EB"
        @change="onChartPageChange"
      >
        <swiper-item v-for="(page, pi) in chartPages" :key="pi">
          <view class="chart-box">
            <view v-for="stat in page" :key="`bar-${stat.key}`" class="bar-col">
              <view class="bar-track">
                <view
                  class="bar-fill"
                  :style="{
                    height: Math.min((stat.averageHours / maxHours) * 100, 100) + '%',
                  }"
                ></view>
              </view>
              <text class="bar-val">{{ stat.averageHours }}h</text>
              <text class="bar-label">{{ stat.label }}</text>
            </view>
          </view>
        </swiper-item>
      </swiper>
    </view>

    <!-- 月度明细：分页加载 -->
    <view class="section">
      <text class="section-title">月度明细</text>
      <view
        v-for="stat in visibleMonthlyStats"
        :key="`${stat.year}-${stat.month}`"
        class="month-card"
      >
        <view class="month-head">
          <text class="month-name">{{ stat.year }}年{{ stat.month }}月</text>
          <text class="month-avg">均 {{ stat.averageHours }}h</text>
        </view>
        <view class="month-grid">
          <view class="mg-item">
            <text class="mg-val">{{ stat.totalWorkDays }}</text>
            <text class="mg-label">应出勤</text>
          </view>
          <view class="mg-item">
            <text class="mg-val">{{ stat.actualWorkDays }}</text>
            <text class="mg-label">实际</text>
          </view>
          <view class="mg-item">
            <text class="mg-val">{{ stat.leaveDays }}</text>
            <text class="mg-label">请假</text>
          </view>
          <view class="mg-item hl">
            <text class="mg-val">{{ stat.averageHours }}</text>
            <text class="mg-label">均工时</text>
          </view>
        </view>
      </view>
      <view v-if="hasMoreMonths" class="load-more" @tap="loadMoreMonths">
        <text class="load-more-text">加载更多</text>
      </view>
    </view>

    <!-- 汇总 -->
    <view class="section">
      <text class="section-title">汇总</text>
      <view class="summary-grid">
        <view class="sum-item">
          <text class="sum-val">{{ totalWorkDays }}</text>
          <text class="sum-label">总应出勤</text>
        </view>
        <view class="sum-item">
          <text class="sum-val">{{ totalActualDays }}</text>
          <text class="sum-label">总实际出勤</text>
        </view>
        <view class="sum-item">
          <text class="sum-val">{{ totalLeaveDays }}</text>
          <text class="sum-label">总请假</text>
        </view>
        <view class="sum-item hl">
          <text class="sum-val">{{ overallAverageHours }}</text>
          <text class="sum-label">整体均工时</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { onShow } from '@dcloudio/uni-app'
  import type { MonthlyStats } from '@/types/clock'
  import { prevMonth } from '@/utils/date'
  import { calcMonthlyStats } from '@/utils/stats'

  type Range = '3m' | '6m' | '1y' | '5y' | 'all'

  const rangeOptions: { value: Range; label: string }[] = [
    { value: '3m', label: '近3月' },
    { value: '6m', label: '近半年' },
    { value: '1y', label: '近1年' },
    { value: '5y', label: '近5年' },
    { value: 'all', label: '全部' },
  ]

  const rangeLabels: Record<Range, string> = {
    '3m': '最近3个月',
    '6m': '最近6个月',
    '1y': '最近1年',
    '5y': '最近5年',
    all: '全部数据',
  }

  const rangeToMonths: Record<Range, number> = {
    '3m': 3,
    '6m': 6,
    '1y': 12,
    '5y': 60,
    all: 120,
  }

  const range = ref<Range>('1y')
  const monthlyStats = ref<MonthlyStats[]>([])
  const chartPageIndex = ref(0)
  const detailPageSize = 6
  const detailPage = ref(1)

  const rangeLabel = computed(() => rangeLabels[range.value])

  interface ChartItem {
    key: string
    label: string
    averageHours: number
  }

  const chartItems = computed<ChartItem[]>(() => {
    if (monthlyStats.value.length > 60) {
      const yearMap = new Map<number, { totalHours: number; totalDays: number }>()
      for (const s of monthlyStats.value) {
        const entry = yearMap.get(s.year) || { totalHours: 0, totalDays: 0 }
        entry.totalHours += s.totalHours
        entry.totalDays += s.actualWorkDays
        yearMap.set(s.year, entry)
      }
      return Array.from(yearMap.entries()).map(([year, v]) => ({
        key: String(year),
        label: `${year}`,
        averageHours: v.totalDays > 0 ? parseFloat((v.totalHours / v.totalDays).toFixed(1)) : 0,
      }))
    }
    return monthlyStats.value.map((s) => ({
      key: `${s.year}-${s.month}`,
      label: `${s.month}月`,
      averageHours: s.averageHours,
    }))
  })

  const CHART_PAGE_SIZE = 12

  const chartPages = computed<ChartItem[][]>(() => {
    const pages: ChartItem[][] = []
    const items = chartItems.value
    for (let i = 0; i < items.length; i += CHART_PAGE_SIZE) {
      pages.push(items.slice(i, i + CHART_PAGE_SIZE))
    }
    return pages
  })

  function onChartPageChange(e: any) {
    chartPageIndex.value = e.detail.current
  }

  const visibleMonthlyStats = computed(() => {
    return monthlyStats.value
      .slice(0, detailPage.value * detailPageSize)
      .sort((a, b) => b.year - a.year || b.month - a.month)
  })

  const hasMoreMonths = computed(() => {
    return visibleMonthlyStats.value.length < monthlyStats.value.length
  })

  function loadMoreMonths() {
    detailPage.value++
  }

  function loadStats() {
    const months = rangeToMonths[range.value]
    const now = new Date()
    let y = now.getFullYear()
    let m = now.getMonth() + 1
    const stats: MonthlyStats[] = []
    for (let i = 0; i < months; i++) {
      stats.push(calcMonthlyStats(y, m))
      const prev = prevMonth(y, m)
      y = prev.year
      m = prev.month
    }
    stats.reverse()
    monthlyStats.value = stats
    detailPage.value = 1
    chartPageIndex.value = 0
  }

  function onRangeChange(val: Range) {
    range.value = val
    loadStats()
  }

  const summary = computed(() => {
    let workDays = 0,
      actualDays = 0,
      leaveDays = 0,
      totalHours = 0,
      totalActual = 0
    for (const s of monthlyStats.value) {
      workDays += s.totalWorkDays
      actualDays += s.actualWorkDays
      leaveDays += s.leaveDays
      totalHours += s.totalHours
      totalActual += s.actualWorkDays
    }
    return {
      workDays,
      actualDays,
      leaveDays,
      avgHours: totalActual > 0 ? (totalHours / totalActual).toFixed(1) : '0.0',
    }
  })

  const totalWorkDays = computed(() => summary.value.workDays)
  const totalActualDays = computed(() => summary.value.actualDays)
  const totalLeaveDays = computed(() => summary.value.leaveDays)
  const overallAverageHours = computed(() => summary.value.avgHours)
  const maxHours = computed(() => {
    let max = 1
    for (const c of chartItems.value) {
      if (c.averageHours > max) max = c.averageHours
    }
    return Math.ceil(max)
  })

  onShow(() => {
    loadStats()
  })
</script>

<style lang="scss">
  @use '@/styles/variables.scss' as *;

  .page {
    min-height: 100vh;
    background: $gray-50;
    padding-bottom: 140rpx;
  }

  .header {
    background: linear-gradient(135deg, $blue 0%, $blue-dark 100%);
    padding: 40rpx;
    border-radius: 0 0 40rpx 40rpx;
  }

  .header-title {
    font-size: 36rpx;
    font-weight: 700;
    color: #fff;
    display: block;
    margin-bottom: 8rpx;
  }

  .header-sub {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.7);
  }

  .filter-bar {
    display: flex;
    gap: 12rpx;
    padding: 20rpx 24rpx;
    background: #fff;
    border-bottom: 1rpx solid $gray-100;
  }

  .filter-btn {
    flex: 1;
    text-align: center;
    padding: 14rpx 0;
    border-radius: 12rpx;
    background: $gray-100;
  }

  .filter-btn.active {
    background: $blue;
  }

  .filter-text {
    font-size: 24rpx;
    color: $gray-500;
    font-weight: 600;
  }

  .filter-btn.active .filter-text {
    color: #fff;
  }

  .section {
    margin: 24rpx;
  }

  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16rpx;
  }

  .section-title {
    font-size: 28rpx;
    font-weight: 700;
    color: $gray-900;
    margin-bottom: 0;
    display: block;
  }

  .page-indicator {
    font-size: 22rpx;
    color: $gray-400;
    font-weight: 600;
  }

  .chart-swiper {
    height: 400rpx;
  }

  .chart-box {
    background: #fff;
    border-radius: $radius;
    padding: 32rpx 16rpx;
    display: flex;
    align-items: flex-end;
    justify-content: space-around;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
    height: 340rpx;
    box-sizing: border-box;
  }

  .bar-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    min-width: 0;
  }

  .bar-track {
    width: 40rpx;
    height: 220rpx;
    background: $gray-100;
    border-radius: 20rpx;
    position: relative;
    overflow: hidden;
    margin-bottom: 12rpx;
  }

  .bar-fill {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(180deg, $blue 0%, $blue-dark 100%);
    border-radius: 20rpx;
    transition: height 0.3s;
  }

  .bar-val {
    font-size: 20rpx;
    color: $blue;
    font-weight: 600;
    margin-bottom: 4rpx;
  }

  .bar-label {
    font-size: 20rpx;
    color: $gray-500;
  }

  .month-card {
    background: #fff;
    border-radius: $radius;
    padding: 24rpx;
    margin-bottom: 16rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  }

  .month-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16rpx;
  }

  .month-name {
    font-size: 28rpx;
    font-weight: 700;
    color: $gray-900;
  }

  .month-avg {
    font-size: 24rpx;
    color: $blue;
    font-weight: 600;
  }

  .month-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12rpx;
  }

  .mg-item {
    text-align: center;
    padding: 16rpx 0;
    background: $gray-50;
    border-radius: 12rpx;
  }

  .mg-item.hl {
    background: $blue-bg;
  }

  .mg-val {
    font-size: 30rpx;
    font-weight: 700;
    color: $gray-900;
    display: block;
    margin-bottom: 4rpx;
  }

  .mg-item.hl .mg-val {
    color: $blue;
  }

  .mg-label {
    font-size: 20rpx;
    color: $gray-500;
  }

  .load-more {
    text-align: center;
    padding: 24rpx;
    background: #fff;
    border-radius: $radius;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
    margin-top: 8rpx;
  }

  .load-more-text {
    font-size: 26rpx;
    color: $blue;
    font-weight: 600;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16rpx;
  }

  .sum-item {
    text-align: center;
    padding: 24rpx;
    background: #fff;
    border-radius: $radius;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  }

  .sum-item.hl {
    background: linear-gradient(135deg, $blue 0%, $blue-dark 100%);
  }

  .sum-val {
    font-size: 36rpx;
    font-weight: 700;
    color: $gray-900;
    display: block;
    margin-bottom: 4rpx;
  }

  .sum-item.hl .sum-val {
    color: #fff;
  }

  .sum-label {
    font-size: 22rpx;
    color: $gray-500;
  }

  .sum-item.hl .sum-label {
    color: rgba(255, 255, 255, 0.7);
  }
</style>
