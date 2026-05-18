<script setup lang="ts">
  import { onLaunch } from '@dcloudio/uni-app'
  import {
    cleanOldData,
    // getRecords,
    // saveRecords,
    // generateId
  } from '@/utils/storage'
  // import type { ClockRecord } from '@/types/clock'

  onLaunch(() => {
    cleanOldData()

    // 临时种子数据，运行一次后可删除
    // const SEED_KEY = 'seed_20260518'
    // if (!uni.getStorageSync(SEED_KEY)) {
    //   const seeds: Omit<ClockRecord, 'id'>[] = [
    //     { date: '2026-05-06', clockIn: '08:21', clockOut: '19:01', isLeave: false },
    //     { date: '2026-05-07', clockIn: '08:22', clockOut: '18:39', isLeave: false },
    //     { date: '2026-05-08', clockIn: '08:37', clockOut: '19:15', isLeave: false },
    //     { date: '2026-05-09', clockIn: '08:34', clockOut: '19:10', isLeave: false },
    //     { date: '2026-05-11', clockIn: '08:40', clockOut: '19:20', isLeave: false },
    //     { date: '2026-05-12', clockIn: '08:27', clockOut: '20:23', isLeave: false },
    //     { date: '2026-05-13', clockIn: '09:07', clockOut: '19:47', isLeave: false },
    //     { date: '2026-05-14', clockIn: '09:22', clockOut: '18:31', isLeave: false },
    //     { date: '2026-05-18', clockIn: '08:47', clockOut: '19:40', isLeave: false },
    //   ]
    //   const existing = getRecords()
    //   const existingDates = new Set(existing.map((r) => r.date))
    //   const newRecords = seeds
    //     .filter((s) => !existingDates.has(s.date))
    //     .map((s) => ({ ...s, id: generateId() }))
    //   saveRecords([...existing, ...newRecords])
    //   uni.setStorageSync(SEED_KEY, true)
    // }
  })
</script>
