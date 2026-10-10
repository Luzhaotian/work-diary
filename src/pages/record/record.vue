<template>
  <view class="page">
    <view class="month-bar">
      <view class="month-btn" @tap="handlePrevMonth">
        <text class="month-arrow"> ‹ </text>
      </view>
      <picker mode="date" fields="month" :value="monthPickerValue" @change="onMonthPickerChange">
        <view class="month-title-wrap">
          <text class="month-title"> {{ currentYear }}年{{ currentMonth }}月 </text>
          <text class="month-picker-hint"> ▾ </text>
        </view>
      </picker>
      <view class="month-btn" @tap="handleNextMonth">
        <text class="month-arrow"> › </text>
      </view>
      <view class="export-btn" @tap="handleExport">
        <text class="export-icon"> ⬇ </text>
      </view>
    </view>

    <scroll-view scroll-y class="list-wrap">
      <view v-for="record in records" :key="record.id" class="record-card">
        <view class="record-left">
          <text class="record-day">
            {{ formatDay(record.date) }}
          </text>
          <text class="record-week">
            {{ formatWeekday(record.date) }}
          </text>
        </view>
        <view class="record-center">
          <view v-if="showLeave && record.isLeave" class="leave-badge">
            <text class="leave-text">
              {{ record.leaveType === 'half' ? '半天假' : '全天假' }}
            </text>
          </view>
          <!--
            全天假：整天没上班，遮掉打卡时间。
            半天假 / 普通日：打卡时间真实，照常展示（半天假仍上了另外半天）。
            showLeave 关闭时无请假语义，一律展示时间。
          -->
          <view v-if="!(showLeave && isFullDayLeave(record))" class="record-times">
            <view class="record-time-item">
              <text class="rt-label"> 上班 </text>
              <text class="rt-value">
                {{ record.clockIn || '--:--' }}
              </text>
            </view>
            <view class="record-time-item">
              <text class="rt-label"> 下班 </text>
              <text class="rt-value">
                {{ record.clockOut || '--:--' }}
              </text>
            </view>
            <view v-if="hoursOf(record)" class="record-time-item">
              <text class="rt-label"> 工时 </text>
              <text class="rt-value hl"> {{ hoursOf(record) }} </text>
            </view>
          </view>
        </view>
        <view class="record-actions">
          <view class="action-btn edit-btn" @tap="editRecord(record)">
            <text class="action-icon"> ✎ </text>
          </view>
          <view class="action-btn del-btn" @tap="confirmDelete(record)">
            <text class="action-icon"> ✕ </text>
          </view>
        </view>
      </view>

      <view v-if="records.length === 0" class="empty-state">
        <text class="empty-icon"> 📭 </text>
        <text class="empty-text"> 暂无记录 </text>
      </view>
    </scroll-view>

    <view class="fab" @tap="goStats">
      <text class="fab-icon"> 📊 </text>
    </view>

    <view v-if="showModal" class="modal-mask" @tap="closeModal" />
    <view v-if="showModal" class="modal-box">
      <text class="modal-title"> 修改记录 </text>

      <ClockEditForm
        :form="form"
        :show-leave="showLeave"
        placeholder-in="请选择"
        placeholder-out="请选择"
      />

      <view class="modal-btns">
        <button class="m-btn m-cancel" @tap="closeModal">取消</button>
        <button class="m-btn m-save" @tap="saveEdit">保存</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { onShow } from '@dcloudio/uni-app'
  import ClockEditForm from '@/components/ClockEditForm.vue'
  import type { ClockRecord } from '@/types/clock'
  import {
    getRecordsByMonth,
    deleteRecord,
    getShowLeave,
    upsertRecordByDate,
  } from '@/utils/storage'
  import { formatEffectiveHours, isFullDayLeave } from '@/utils/time'
  import { formatDay, formatWeekday, prevMonth, nextMonth } from '@/utils/date'
  import { useClockForm } from '@/composables/useClockForm'
  import { CONFIRM_COLOR } from '@/utils/theme'
  import { getUniEventValue } from '@/types/event'
  import { consumeTabMonth } from '@/utils/tabMonth'

  const currentYear = ref(new Date().getFullYear())
  const currentMonth = ref(new Date().getMonth() + 1)
  const records = ref<ClockRecord[]>([])
  const showModal = ref(false)
  const showLeave = ref(true)
  const editingRecord = ref<ClockRecord | null>(null)

  const form = useClockForm()

  /** picker fields="month" 需要 YYYY-MM-DD，日固定为 01 */
  const monthPickerValue = computed(() => {
    const m = String(currentMonth.value).padStart(2, '0')
    return `${currentYear.value}-${m}-01`
  })

  /**
   * 列表工时展示。走 formatEffectiveHours（与导出、统计同一口径），
   * 请假当天返回空串，不再渲染工时项。
   */
  function hoursOf(r: ClockRecord): string {
    return formatEffectiveHours(r, '')
  }

  function loadRecords() {
    showLeave.value = getShowLeave()
    records.value = getRecordsByMonth(currentYear.value, currentMonth.value).sort((a, b) =>
      b.date.localeCompare(a.date),
    )
  }

  /** 切月后刷新列表；无数据时 toast，但仍进入该月（空态可浏览）。进入页面 onShow 不走这里。 */
  function applyMonth(year: number, month: number) {
    currentYear.value = year
    currentMonth.value = month
    loadRecords()
    if (records.value.length === 0) {
      uni.showToast({ title: '该月暂无记录', icon: 'none' })
    }
  }

  function handlePrevMonth() {
    const m = prevMonth(currentYear.value, currentMonth.value)
    applyMonth(m.year, m.month)
  }

  function handleNextMonth() {
    const m = nextMonth(currentYear.value, currentMonth.value)
    applyMonth(m.year, m.month)
  }

  function onMonthPickerChange(e: Event) {
    const value = getUniEventValue<string>(e)
    const [y, m] = value.split('-').map(Number)
    if (!y || !m) return
    applyMonth(y, m)
  }

  function editRecord(r: ClockRecord) {
    // 持有整条记录：保存时基于它展开，不再先构造 date: '' 再回填
    editingRecord.value = r
    form.loadFromRecord(r)
    showModal.value = true
  }

  function closeModal() {
    showModal.value = false
    editingRecord.value = null
  }

  function confirmDelete(r: ClockRecord) {
    uni.showModal({
      title: '确认删除',
      content: `删除 ${r.date} 的记录？`,
      confirmColor: CONFIRM_COLOR,
      success(res) {
        if (res.confirm) {
          deleteRecord(r.id)
          loadRecords()
          uni.showToast({ title: '已删除', icon: 'success' })
        }
      },
    })
  }

  function saveEdit() {
    const original = editingRecord.value
    if (!original) {
      closeModal()
      return
    }
    if (form.invalidTimeRange.value) {
      uni.showToast({ title: '下班时间早于上班时间', icon: 'none' })
      return
    }

    // 基于原记录展开、只覆盖表单字段。
    // toRecordFields() 对未填写项返回 undefined，因此不会像旧实现那样
    // 把 picker 的默认值（09:00/18:00）当成真实打卡时间写进去
    // ——此前只打了上班卡的记录，点编辑再保存会凭空多出 18:00 下班、算出 9 小时。
    upsertRecordByDate({ ...original, ...form.toRecordFields() })
    closeModal()
    loadRecords()
    uni.showToast({ title: '已保存', icon: 'success' })
  }

  onShow(() => {
    const pending = consumeTabMonth('record')
    if (pending) {
      currentYear.value = pending.year
      currentMonth.value = pending.month
    }
    loadRecords()
  })

  function goStats() {
    uni.navigateTo({ url: '/pages/stats/stats' })
  }

  /**
   * 生成两种导出内容。
   *
   * 口径与列表、统计完全一致（都基于 effectiveHours / isFullDayLeave）：
   * - 全天假：打卡时间遮成 --:-- / 空，工时不计
   * - 半天假：保留真实打卡时间，工时照常计算（当天上了另外半天）
   * 此前「导出为文件」未判断请假，全天假会导出 9.0 小时，
   * 而「复制文本」判断了导出 0h——同一份数据两种口径。
   */
  function buildExportContent(): { fileContent: string; clipboardContent: string } {
    const fileHeader = '日期\t上班\t下班\t工时(h)\t请假\t请假类型'
    const fileRows = records.value.map((r) => {
      const fullLeave = isFullDayLeave(r)
      // 纯数字工时，便于在 Excel 里直接求和
      const hours = formatEffectiveHours(r, '').replace('h', '')
      const clockIn = fullLeave ? '' : r.clockIn || ''
      const clockOut = fullLeave ? '' : r.clockOut || ''
      const leave = r.isLeave ? '是' : '否'
      const leaveTypeText = r.isLeave ? (r.leaveType === 'half' ? '半天' : '全天') : ''
      return [r.date, clockIn, clockOut, hours, leave, leaveTypeText].join('\t')
    })

    const clipHeader = '日期\t上班\t下班\t工时\t请假'
    const clipRows = records.value.map((r) => {
      const fullLeave = isFullDayLeave(r)
      const leave = r.isLeave ? (r.leaveType === 'half' ? '半天假' : '全天假') : ''
      const clockIn = fullLeave ? '--:--' : r.clockIn || '--:--'
      const clockOut = fullLeave ? '--:--' : r.clockOut || '--:--'
      return [r.date, clockIn, clockOut, formatEffectiveHours(r), leave].join('\t')
    })

    return {
      fileContent: [fileHeader, ...fileRows].join('\n'),
      clipboardContent: [clipHeader, ...clipRows].join('\n'),
    }
  }

  function handleExport() {
    if (records.value.length === 0) {
      uni.showToast({ title: '暂无记录', icon: 'none' })
      return
    }

    const { fileContent, clipboardContent } = buildExportContent()
    const fileName = `打卡记录_${currentYear.value}_${String(currentMonth.value).padStart(2, '0')}.csv`

    uni.showActionSheet({
      itemList: ['导出为文件', '复制文本'],
      success(res) {
        if (res.tapIndex === 0) {
          exportAsFile(fileContent, fileName)
        } else {
          uni.setClipboardData({
            data: clipboardContent,
            success() {
              uni.showToast({ title: '已复制', icon: 'success' })
            },
          })
        }
      },
    })
  }

  /** BOM 让 Excel 正确识别 UTF-8 中文 */
  const BOM = '﻿'

  /**
   * 微信小程序的用户目录。
   * `wx` 只在小程序运行时存在，@dcloudio/types 未声明它，
   * 通过 globalThis 取值并显式标注类型，避免 @ts-expect-error 掩盖真实类型错误。
   */
  function getWxUserDataPath(): string {
    const wxGlobal = (globalThis as { wx?: { env?: { USER_DATA_PATH?: string } } }).wx
    return wxGlobal?.env?.USER_DATA_PATH ?? ''
  }

  function exportAsFile(content: string, fileName: string) {
    // #ifdef MP-WEIXIN
    // 文件系统与分享文件能力仅微信小程序具备。
    // 此前没有条件编译，H5 端会在 `wx.env` 处抛未捕获的 ReferenceError
    // （try/catch 从下一行才开始），点「导出为文件」直接报错。
    const userDataPath = getWxUserDataPath()
    if (!userDataPath) {
      fallbackCopy(content)
      return
    }
    const fs = uni.getFileSystemManager()
    const filePath = `${userDataPath}/${fileName}`
    try {
      fs.writeFileSync(filePath, BOM + content, 'utf8')
    } catch {
      uni.showToast({ title: '写入文件失败', icon: 'none' })
      return
    }
    uni.shareFileMessage({
      filePath,
      fileName,
      success() {
        uni.showToast({ title: '已发送', icon: 'success' })
      },
      fail() {
        uni.openDocument({
          filePath,
          showMenu: true,
          success() {
            uni.showToast({ title: '已打开，可转发保存', icon: 'none' })
          },
          fail() {
            fallbackCopy(content)
          },
        })
      },
    })
    // #endif

    // #ifndef MP-WEIXIN
    // H5：用 Blob 触发浏览器下载；其余端退化为复制到剪贴板
    if (
      typeof document !== 'undefined' &&
      typeof URL !== 'undefined' &&
      typeof Blob !== 'undefined'
    ) {
      try {
        const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        uni.showToast({ title: '已下载', icon: 'success' })
        return
      } catch {
        // 落到下面的复制兜底
      }
    }
    fallbackCopy(content)
    // #endif
  }

  function fallbackCopy(content: string) {
    uni.setClipboardData({
      data: content,
      success() {
        uni.showToast({ title: '已复制到剪贴板', icon: 'success' })
      },
    })
  }
</script>

<style lang="scss">
  @use '@/styles/variables.scss' as *;

  .page {
    min-height: 100vh;
    background: $gray-50;
    padding-bottom: 140rpx;
  }

  .month-bar {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24rpx;
    background: #fff;
    gap: 40rpx;
  }

  .month-btn {
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    background: $gray-100;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .month-arrow {
    font-size: 36rpx;
    color: $gray-700;
    font-weight: 600;
  }

  .month-title-wrap {
    display: flex;
    align-items: center;
    gap: 4rpx;
  }

  .month-title {
    font-size: 32rpx;
    font-weight: 700;
    color: $gray-900;
  }

  .month-picker-hint {
    font-size: 20rpx;
    color: $gray-400;
    line-height: 1;
  }

  .export-btn {
    width: 56rpx;
    height: 56rpx;
    border-radius: 50%;
    background: $blue-bg;
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    right: 24rpx;
  }

  .export-icon {
    font-size: 24rpx;
    color: $blue;
  }

  .list-wrap {
    padding: 16rpx 24rpx;
    box-sizing: border-box;
  }

  .record-card {
    background: #fff;
    border-radius: $radius;
    padding: 24rpx;
    margin-bottom: 16rpx;
    display: flex;
    align-items: center;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
    box-sizing: border-box;
  }

  .record-left {
    width: 80rpx;
    text-align: center;
    margin-right: 24rpx;
    flex-shrink: 0;
  }

  .record-day {
    font-size: 36rpx;
    font-weight: 700;
    color: $gray-900;
    display: block;
  }

  .record-week {
    font-size: 22rpx;
    color: $gray-400;
  }

  .record-center {
    flex: 1;
  }

  .record-times {
    display: flex;
    gap: 24rpx;
  }

  .record-time-item {
    display: flex;
    flex-direction: column;
  }

  .rt-label {
    font-size: 20rpx;
    color: $gray-400;
    margin-bottom: 4rpx;
  }

  .rt-value {
    font-size: 28rpx;
    font-weight: 600;
    color: $gray-900;
  }

  .rt-value.hl {
    color: $blue;
  }

  .leave-badge {
    background: $orange-bg;
    padding: 8rpx 20rpx;
    border-radius: 8rpx;
    display: inline-block;
  }

  .leave-text {
    font-size: 24rpx;
    color: $orange-dark;
  }

  .record-actions {
    display: flex;
    gap: 12rpx;
    margin-left: 16rpx;
    flex-shrink: 0;
  }

  .action-btn {
    width: 56rpx;
    height: 56rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .edit-btn {
    background: $blue-bg;
  }

  .edit-btn .action-icon {
    color: $blue;
    font-size: 24rpx;
  }

  .del-btn {
    background: $red-bg;
  }

  .del-btn .action-icon {
    color: $red;
    font-size: 24rpx;
    font-weight: 700;
  }

  .empty-state {
    text-align: center;
    padding: 120rpx 0;
  }

  .empty-icon {
    font-size: 64rpx;
    display: block;
    margin-bottom: 16rpx;
  }

  .empty-text {
    font-size: 28rpx;
    color: $gray-400;
  }

  .modal-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }

  .modal-box {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #fff;
    border-radius: 24rpx;
    padding: 40rpx;
    width: 80%;
    z-index: 1000;
  }

  .modal-title {
    font-size: 32rpx;
    font-weight: 700;
    color: $gray-900;
    text-align: center;
    margin-bottom: 32rpx;
    display: block;
  }

  .modal-btns {
    display: flex;
    gap: 20rpx;
    margin-top: 32rpx;
  }

  .m-btn {
    flex: 1;
    height: 80rpx;
    border-radius: 12rpx;
    font-size: 28rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
  }

  .m-cancel {
    background: $gray-100;
    color: $gray-700;
  }

  .m-save {
    background: $blue;
    color: #fff;
  }

  .fab {
    position: fixed;
    bottom: 200rpx;
    right: 40rpx;
    width: 100rpx;
    height: 100rpx;
    border-radius: 50%;
    background: $blue;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8rpx 24rpx rgba(37, 99, 235, 0.4);
    z-index: 100;
  }

  .fab-icon {
    font-size: 40rpx;
  }
</style>
