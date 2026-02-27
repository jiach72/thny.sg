<template>
  <el-config-provider :locale="elementLocale">
    <ErrorBoundary>
      <router-view />
    </ErrorBoundary>
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
// Element Plus 语言包
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'

// 客户门户根组件
import ErrorBoundary from './components/ErrorBoundary.vue'

const { locale } = useI18n()

// 映射 vue-i18n 的 locale 到 element-plus 的 locale
const elementLocale = computed(() => {
  return locale.value === 'zh' ? zhCn : en
})
</script>

<style>
@import './styles/design-system.css';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Source Sans 3', sans-serif;
  background-color: var(--color-background);
  color: var(--color-text);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
}

/* Element Plus Customization for Portal */
.el-card {
  --el-card-bg-color: var(--color-surface);
  --el-card-border-color: var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  border: 1px solid var(--color-border) !important;
}

.el-button--primary {
  --el-button-bg-color: var(--color-primary);
  --el-button-border-color: var(--color-primary);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: var(--radius-sm);
}
</style>
