<template>
  <view class="group">
    <text class="group-title"> 请假功能 </text>
    <view class="cell">
      <text class="cell-label"> 展示请假按钮 </text>
      <switch :checked="showLeave" :color="PRIMARY_COLOR" @change="onToggle" />
    </view>
    <text class="group-desc"> 关闭后，记录、历史、日历页面将隐藏请假相关操作 </text>
  </view>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { onShow } from '@dcloudio/uni-app'
  import { getShowLeave, setShowLeave } from '@/utils/storage'
  import { getUniEventValue } from '@/types/event'
  import { PRIMARY_COLOR } from '@/utils/theme'

  // v-if 延迟挂载时需在 setup 读存储
  const showLeave = ref(getShowLeave())

  function onToggle(e: Event) {
    const val = getUniEventValue<boolean>(e)
    showLeave.value = val
    setShowLeave(val)
    uni.showToast({ title: '已保存', icon: 'success' })
  }

  onShow(() => {
    showLeave.value = getShowLeave()
  })
</script>

<style lang="scss">
  @use '@/styles/settings.scss' as st;

  // 本页有说明文字，但 cell 是「标题 + switch」结构，无右侧值/箭头
  @include st.group-block;
  @include st.group-desc;
  @include st.cell-base;
</style>
