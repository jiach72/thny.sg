<template>
  <router-view />
  <!-- 全局聊天机器人组件 -->
  <ChatWidget />
</template>

<script setup lang="ts">
import ChatWidget from './components/ChatWidget.vue'
</script>

<style>
/* 全局样式已在main.ts中导入 */
</style>

