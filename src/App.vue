<script setup lang="ts">
  import { onLaunch } from '@dcloudio/uni-app'
  import { cleanOldData } from '@/utils/storage'
  onLaunch(() => {
    cleanOldData()
  })
</script>
