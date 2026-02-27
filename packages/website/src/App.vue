<template>
  <ErrorBoundary>
    <router-view />
  </ErrorBoundary>
  <!-- 全局聊天机器人组件（仅客户端渲染） -->
  <client-only>
    <ChatWidget />
  </client-only>
  <!-- WhatsApp 浮动咨询按钮 -->
  <WhatsAppFab />
</template>

<script setup lang="ts">
import { useHead } from '@unhead/vue'
import ChatWidget from './components/ChatWidget.vue'
import ErrorBoundary from './components/ErrorBoundary.vue'
import WhatsAppFab from './components/WhatsAppFab.vue'

// 全局 SEO 和 Title 模板设定
useHead({
  titleTemplate: (title) => title ? `${title} - 同海咨询 TongHai` : '同海咨询 TongHai | 稳健出海 · 传承未来',
  meta: [
    { name: 'description', content: '同海(TongHai)专注于为大中华及亚太地区的高净值人群和实体企业提供新加坡落地、跨境企业出海、顶层财富架构配置、教育规划与移民签证的一站式专业解决方案。' },
    { name: 'keywords', content: '同海咨询,TongHai,新加坡移民,新加坡注册公司,企业出海,顶层财富架构,家族办公室,新加坡教育' },
    { property: 'og:title', content: '同海咨询 TongHai - 稳健出海 · 传承未来' },
    { property: 'og:description', content: '同海为您连接全球机遇。商业、移民与教育的多维全栈定制化架构服务。' },
    { property: 'og:image', content: '/logo-light.svg' },
    { property: 'og:type', content: 'website' }
  ]
})
</script>

<style>
/* 全局样式已在main.ts中导入 */
</style>

