<script setup lang="ts">
  import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
  import { cleanOldData } from '@/utils/storage'
  onLaunch(() => {
    cleanOldData()
  })
  onShow(() => {})
  onHide(() => {})
</script>
