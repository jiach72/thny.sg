<template>
  <slot v-if="!hasError" />
  <div v-else class="error-boundary">
    <div class="error-boundary__content">
      <div class="error-boundary__icon">⚠️</div>
      <h2 class="error-boundary__title">页面加载出错</h2>
      <p class="error-boundary__message">抱歉，该页面发生了意外错误。请尝试刷新或返回首页。</p>
      <div class="error-boundary__actions">
        <button class="error-boundary__btn error-boundary__btn--primary" @click="retry">
          刷新页面
        </button>
        <button class="error-boundary__btn error-boundary__btn--secondary" @click="goHome">
          返回首页
        </button>
      </div>
      <details v-if="errorInfo" class="error-boundary__details">
        <summary>技术详情</summary>
        <pre>{{ errorInfo }}</pre>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const hasError = ref(false)
const errorInfo = ref('')

onErrorCaptured((err: Error, _instance, info) => {
  hasError.value = true
  errorInfo.value = `${err.message}\n\n组件: ${info}`

  // 生产环境可接入错误上报（如 Sentry）
  if (import.meta.env.DEV) {
    console.error('[ErrorBoundary]', err, info)
  }

  // 返回 false 阻止错误继续向上传播
  return false
})

function retry(): void {
  hasError.value = false
  errorInfo.value = ''
  window.location.reload()
}

function goHome(): void {
  window.location.href = '/'
}
</script>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
  font-family: system-ui, -apple-system, sans-serif;
}

.error-boundary__content {
  text-align: center;
  max-width: 480px;
}

.error-boundary__icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-boundary__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.error-boundary__message {
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.error-boundary__actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

.error-boundary__btn {
  padding: 0.625rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.error-boundary__btn--primary {
  background: #2563eb;
  color: white;
}

.error-boundary__btn--primary:hover {
  background: #1d4ed8;
}

.error-boundary__btn--secondary {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.error-boundary__btn--secondary:hover {
  background: #e2e8f0;
}

.error-boundary__details {
  margin-top: 1.5rem;
  text-align: left;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.75rem;
}

.error-boundary__details summary {
  cursor: pointer;
  color: #94a3b8;
  font-size: 0.75rem;
}

.error-boundary__details pre {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #ef4444;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
