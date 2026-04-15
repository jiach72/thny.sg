<template>
  <view class="base-layout">
    <!-- 将包裹的子页面或者内容渲染在此 -->
    <slot></slot>
    <!-- 全局挂载 AI 客服球 (通过 unplugin-vue-components 会被自动解析) -->
    <AIDriftBall />
    <!-- 伴随全局挂载的对话舱界面 -->
    <AIChatSheet />
  </view>
</template>

<script setup lang="ts">
// 无需手动 import，全交给 vite 插件解析
</script>

<style lang="scss">
.base-layout {
  min-height: 100vh;
  width: 100%;
  position: relative;
}
</style>
