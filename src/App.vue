<script setup lang="ts">
  import { onLaunch } from '@dcloudio/uni-app'
  import { cleanOldData, getGuideCompleted, setGuideCompleted, getRecords } from '@/utils/storage'

  onLaunch(() => {
    cleanOldData()

    // 老用户已有打卡数据：不强制弹出蒙层引导
    if (!getGuideCompleted() && getRecords().length > 0) {
      setGuideCompleted(true)
    }
  })
</script>
