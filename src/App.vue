<script setup lang="ts">
  import { onLaunch, onShow } from '@dcloudio/uni-app'
  import {
    cleanOldData,
    dedupeRecordsByDate,
    getGuideCompleted,
    setGuideCompleted,
    getRecords,
  } from '@/utils/storage'
  import { runAutoClockOnLaunch, runAutoClockOnShow } from '@/composables/useAutoClock'

  onLaunch(() => {
    // 清理 10 年前旧数据（内部已按天节流，不会每次冷启都全量读写）
    cleanOldData()

    // 历史数据可能已有同日重复记录（旧版 addRecord 不查重）。
    // 所有读取路径都只取每天第一条，重复项会被静默忽略，因此启动时合并一次。
    // 必须在自动打卡之前：补卡依赖「当天是否已有记录」的判断。
    dedupeRecordsByDate()

    // 自动打卡：进入补卡（已过设置时间且当天为工作日时写入设置时间）
    runAutoClockOnLaunch()

    // 老用户已有打卡数据：不强制弹出蒙层引导
    if (!getGuideCompleted() && getRecords().length > 0) {
      setGuideCompleted(true)
    }
  })

  onShow(() => {
    // 回到前台：重启到点打卡定时器；应用开着跨过零点时对新的今天补卡
    runAutoClockOnShow()
  })
</script>
