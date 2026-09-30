<script setup lang="ts">
  import { onLaunch } from '@dcloudio/uni-app'
  import {
    cleanOldData,
    dedupeRecordsByDate,
    getGuideCompleted,
    setGuideCompleted,
    getRecords,
  } from '@/utils/storage'

  onLaunch(() => {
    // 清理 10 年前旧数据（内部已按天节流，不会每次冷启都全量读写）
    cleanOldData()

    // 历史数据可能已有同日重复记录（旧版 addRecord 不查重）。
    // 所有读取路径都只取每天第一条，重复项会被静默忽略，因此启动时合并一次。
    dedupeRecordsByDate()

    // 老用户已有打卡数据：不强制弹出蒙层引导
    if (!getGuideCompleted() && getRecords().length > 0) {
      setGuideCompleted(true)
    }
  })
</script>
