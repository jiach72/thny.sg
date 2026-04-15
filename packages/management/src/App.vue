<template>
  <ErrorBoundary>
    <router-view />
  </ErrorBoundary>
  <CookieConsent />
</template>

<script setup lang="ts">
// CRM 管理端根组件
import ErrorBoundary from './components/ErrorBoundary.vue'
import CookieConsent from './components/CookieConsent.vue'
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

/* Element Plus Global Overrides for Dark Mode */
.el-card {
  --el-card-bg-color: var(--color-surface);
  --el-card-border-color: var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  border: 1px solid var(--color-border) !important;
}

.el-button--primary {
  --el-button-bg-color: var(--color-primary);
  --el-button-border-color: var(--color-primary);
  --el-button-hover-bg-color: var(--color-secondary);
  --el-button-hover-border-color: var(--color-secondary);
  font-weight: 600;
  border-radius: var(--radius-sm);
}
</style>
