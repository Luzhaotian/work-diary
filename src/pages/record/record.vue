<template>
  <view class="page">
    <view class="month-bar">
      <view class="month-btn" @tap="handlePrevMonth">
        <text class="month-arrow"> ‹ </text>
      </view>
      <text class="month-title"> {{ currentYear }}年{{ currentMonth }}月 </text>
      <view class="month-btn" @tap="handleNextMonth">
        <text class="month-arrow"> › </text>
      </view>
      <!-- <view class="import-btn" @tap="handleImport">
        <text class="import-icon"> ⬆ </text>
      </view> -->
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
          <view v-else class="record-times">
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
            <view v-if="record.clockIn && record.clockOut" class="record-time-item">
              <text class="rt-label"> 工时 </text>
              <text class="rt-value hl"> {{ formatHours(record.clockIn, record.clockOut) }}h </text>
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

    <view v-if="showModal" class="modal-mask" @tap="showModal = false" />
    <view v-if="showModal" class="modal-box">
      <text class="modal-title"> 修改记录 </text>

      <view class="form-row">
        <text class="form-label"> 上班时间 </text>
        <picker mode="time" :value="clockIn" @change="onClockInChange">
          <view class="form-picker">
            <text class="form-picker-text">
              {{ clockIn || '请选择' }}
            </text>
          </view>
        </picker>
      </view>

      <view class="form-row">
        <text class="form-label"> 下班时间 </text>
        <picker mode="time" :value="clockOut" @change="onClockOutChange">
          <view class="form-picker">
            <text class="form-picker-text">
              {{ clockOut || '请选择' }}
            </text>
          </view>
        </picker>
      </view>

      <view v-if="showLeave" class="form-row">
        <text class="form-label"> 请假 </text>
        <switch :checked="isLeave" color="#2563EB" @change="onLeaveChange" />
      </view>

      <view v-if="showLeave && isLeave" class="form-row">
        <text class="form-label"> 类型 </text>
        <picker :range="leaveTypeOptions" :range-key="'label'" @change="onLeaveTypeChange">
          <view class="form-picker">
            <text class="form-picker-text">
              {{ leaveType === 'half' ? '半天' : '全天' }}
            </text>
          </view>
        </picker>
      </view>

      <view class="modal-btns">
        <button class="m-btn m-cancel" @tap="showModal = false">取消</button>
        <button class="m-btn m-save" @tap="saveEdit">保存</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { onShow } from '@dcloudio/uni-app'
  import type { ClockRecord } from '@/types/clock'
  import {
    getRecordsByMonth,
    updateRecord,
    deleteRecord,
    getShowLeave,
    // getRecords,
    // saveRecords,
    // generateId,
  } from '@/utils/storage'
  import { formatHours, LEAVE_TYPES } from '@/utils/time'
  import { formatDay, formatWeekday, prevMonth, nextMonth } from '@/utils/date'
  import { useClockForm } from '@/composables/useClockForm'

  const currentYear = ref(new Date().getFullYear())
  const currentMonth = ref(new Date().getMonth() + 1)
  const records = ref<ClockRecord[]>([])
  const showModal = ref(false)
  const showLeave = ref(true)
  const editingRecordId = ref('')
  const leaveTypeOptions = LEAVE_TYPES

  const {
    clockIn,
    clockOut,
    isLeave,
    leaveType,
    onClockInChange,
    onClockOutChange,
    onLeaveChange,
    onLeaveTypeChange,
    loadFromRecord,
  } = useClockForm()

  function loadRecords() {
    showLeave.value = getShowLeave()
    records.value = getRecordsByMonth(currentYear.value, currentMonth.value).sort((a, b) =>
      b.date.localeCompare(a.date),
    )
  }

  function handlePrevMonth() {
    const m = prevMonth(currentYear.value, currentMonth.value)
    currentYear.value = m.year
    currentMonth.value = m.month
    loadRecords()
  }

  function handleNextMonth() {
    const m = nextMonth(currentYear.value, currentMonth.value)
    currentYear.value = m.year
    currentMonth.value = m.month
    loadRecords()
  }

  function editRecord(r: ClockRecord) {
    editingRecordId.value = r.id
    loadFromRecord(r)
    showModal.value = true
  }

  function confirmDelete(r: ClockRecord) {
    uni.showModal({
      title: '确认删除',
      content: `删除 ${r.date} 的记录？`,
      confirmColor: '#2563EB',
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
    const rec: ClockRecord = {
      id: editingRecordId.value,
      date: '',
      clockIn: clockIn.value,
      clockOut: clockOut.value,
      isLeave: isLeave.value,
      leaveType: isLeave.value ? leaveType.value : undefined,
    }
    // preserve original date from existing record
    const original = records.value.find((r) => r.id === editingRecordId.value)
    if (original) rec.date = original.date
    updateRecord(rec)
    showModal.value = false
    loadRecords()
    uni.showToast({ title: '已保存', icon: 'success' })
  }

  onShow(() => {
    loadRecords()
  })

  function goStats() {
    uni.navigateTo({ url: '/pages/stats/stats' })
  }

  function handleExport() {
    if (records.value.length === 0) {
      uni.showToast({ title: '暂无记录', icon: 'none' })
      return
    }

    const header = '日期\t上班\t下班\t工时(h)\t请假\t请假类型'
    const rows = records.value.map((r) => {
      const hours = r.clockIn && r.clockOut ? formatHours(r.clockIn, r.clockOut) : ''
      const leave = r.isLeave ? '是' : '否'
      const leaveType = r.isLeave ? (r.leaveType === 'half' ? '半天' : '全天') : ''
      return [r.date, r.clockIn || '', r.clockOut || '', hours, leave, leaveType].join('\t')
    })
    const tsvContent = [header, ...rows].join('\n')

    const textHeader = '日期\t上班\t下班\t工时\t请假'
    const textRows = records.value.map((r) => {
      const leave = r.isLeave ? (r.leaveType === 'half' ? '半天假' : '全天假') : ''
      const clockIn = r.isLeave ? '--:--' : r.clockIn || '--:--'
      const clockOut = r.isLeave ? '--:--' : r.clockOut || '--:--'
      const hours = r.isLeave
        ? '0h'
        : r.clockIn && r.clockOut
          ? formatHours(r.clockIn, r.clockOut) + 'h'
          : '0h'
      return [r.date, clockIn, clockOut, hours, leave].join('\t')
    })
    const textContent = [textHeader, ...textRows].join('\n')

    const fileName = `打卡记录_${currentYear.value}_${String(currentMonth.value).padStart(2, '0')}.csv`

    uni.showActionSheet({
      itemList: ['导出为文件', '复制文本'],
      success(res) {
        if (res.tapIndex === 0) {
          exportAsFile(tsvContent, fileName)
        } else {
          uni.setClipboardData({
            data: textContent,
            success() {
              uni.showToast({ title: '已复制', icon: 'success' })
            },
          })
        }
      },
    })
  }

  function exportAsFile(content: string, fileName: string) {
    const fs = uni.getFileSystemManager()
    // @ts-expect-error wx.env only exists in WeChat MP
    const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`
    try {
      fs.writeFileSync(filePath, '\uFEFF' + content, 'utf8')
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
  }

  function fallbackCopy(content: string) {
    uni.setClipboardData({
      data: content,
      success() {
        uni.showToast({ title: '已复制到剪贴板', icon: 'success' })
      },
    })
  }

  // function handleImport() {
  //   uni.chooseMessageFile({
  //     count: 1,
  //     type: 'file',
  //     extension: ['.csv', '.tsv', '.txt'],
  //     success(res) {
  //       const file = res.tempFiles[0]
  //       const fs = uni.getFileSystemManager()
  //       try {
  //         const content = fs.readFileSync(file.path, 'utf8') as string
  //         const parsed = parseCSVContent(content)
  //         if (parsed.length === 0) {
  //           uni.showToast({ title: '未识别到有效记录', icon: 'none' })
  //           return
  //         }
  //         uni.showModal({
  //           title: '导入确认',
  //           content: `识别到 ${parsed.length} 条记录，将覆盖相同日期的已有数据，是否继续？`,
  //           confirmColor: '#2563EB',
  //           success(modalRes) {
  //             if (modalRes.confirm) {
  //               doImport(parsed)
  //             }
  //           },
  //         })
  //       } catch {
  //         uni.showToast({ title: '读取文件失败', icon: 'none' })
  //       }
  //     },
  //     fail() {
  //       // 用户取消选择，不做提示
  //     },
  //   })
  // }

  // function parseCSVContent(content: string): Omit<ClockRecord, 'id'>[] {
  //   // 去掉 BOM
  //   const text = content.replace(/^\uFEFF/, '').trim()
  //   const lines = text.split(/\r?\n/).filter((l) => l.trim())
  //   if (lines.length < 2) return []

  //   const header = lines[0].split(/[\t,]/)
  //   // 查找各列索引
  //   const dateIdx = header.findIndex((h) => h.includes('日期'))
  //   const clockInIdx = header.findIndex((h) => h.includes('上班'))
  //   const clockOutIdx = header.findIndex((h) => h.includes('下班'))
  //   const leaveIdx = header.findIndex((h) => h.includes('请假') && !h.includes('类型'))
  //   const leaveTypeIdx = header.findIndex((h) => h.includes('请假类型'))

  //   if (dateIdx === -1) return []

  //   const records: Omit<ClockRecord, 'id'>[] = []
  //   for (let i = 1; i < lines.length; i++) {
  //     const cols = lines[i].split(/[\t,]/)
  //     const date = (cols[dateIdx] || '').trim()
  //     if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue

  //     let clockIn = clockInIdx !== -1 ? (cols[clockInIdx] || '').trim() : ''
  //     let clockOut = clockOutIdx !== -1 ? (cols[clockOutIdx] || '').trim() : ''
  //     // 过滤无效时间
  //     if (!/^\d{2}:\d{2}$/.test(clockIn)) clockIn = ''
  //     if (!/^\d{2}:\d{2}$/.test(clockOut)) clockOut = ''

  //     const leaveVal = leaveIdx !== -1 ? (cols[leaveIdx] || '').trim() : ''
  //     const leaveTypeVal = leaveTypeIdx !== -1 ? (cols[leaveTypeIdx] || '').trim() : ''
  //     const isLeave = leaveVal === '是' || leaveVal.includes('假')
  //     let leaveType: 'full' | 'half' | undefined
  //     if (isLeave) {
  //       leaveType = leaveTypeVal.includes('半') || leaveVal.includes('半') ? 'half' : 'full'
  //     }

  //     records.push({
  //       date,
  //       clockIn: clockIn || undefined,
  //       clockOut: clockOut || undefined,
  //       isLeave,
  //       leaveType,
  //     })
  //   }
  //   return records
  // }

  // function doImport(parsed: Omit<ClockRecord, 'id'>[]) {
  //   const existing = getRecords()
  //   const existingMap = new Map(existing.map((r) => [r.date, r]))

  //   for (const rec of parsed) {
  //     const old = existingMap.get(rec.date)
  //     if (old) {
  //       // 覆盖已有记录
  //       old.clockIn = rec.clockIn
  //       old.clockOut = rec.clockOut
  //       old.isLeave = rec.isLeave
  //       old.leaveType = rec.leaveType
  //     } else {
  //       const newRec: ClockRecord = { ...rec, id: generateId() }
  //       existing.push(newRec)
  //       existingMap.set(rec.date, newRec)
  //     }
  //   }

  //   saveRecords(existing)
  //   loadRecords()
  //   uni.showToast({ title: `已导入 ${parsed.length} 条`, icon: 'success' })
  // }
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

  .month-title {
    font-size: 32rpx;
    font-weight: 700;
    color: $gray-900;
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

  .import-btn {
    width: 56rpx;
    height: 56rpx;
    border-radius: 50%;
    background: $blue-bg;
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    left: 24rpx;
  }

  .import-icon {
    font-size: 24rpx;
    color: $blue;
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
    background: #fef3c7;
    padding: 8rpx 20rpx;
    border-radius: 8rpx;
    display: inline-block;
  }

  .leave-text {
    font-size: 24rpx;
    color: #d97706;
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
    background: #fef2f2;
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
