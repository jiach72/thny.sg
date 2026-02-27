<template>
  <div class="not-found">
    <div class="not-found__content">
      <h1 class="not-found__code">404</h1>
      <h2 class="not-found__title">页面未找到</h2>
      <p class="not-found__message">抱歉，您访问的页面不存在或已被移除。</p>
      <div class="not-found__actions">
        <button class="not-found__btn not-found__btn--primary" @click="goHome">
          返回首页
        </button>
        <button class="not-found__btn not-found__btn--secondary" @click="goBack">
          返回上页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome(): void {
  router.push('/')
}

function goBack(): void {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  padding: 2rem;
  text-align: center;
}

.not-found__code {
  font-size: 8rem;
  font-weight: 900;
  background: linear-gradient(135deg, #1e3a5f 0%, #f59e0b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.not-found__title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.75rem;
}

.not-found__message {
  color: #64748b;
  font-size: 1.125rem;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.not-found__actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.not-found__btn {
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.not-found__btn--primary {
  background: linear-gradient(135deg, #1e3a5f, #2d5a87);
  color: white;
}

.not-found__btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(30, 58, 95, 0.3);
}

.not-found__btn--secondary {
  background: #f1f5f9;
  color: #475569;
}

.not-found__btn--secondary:hover {
  background: #e2e8f0;
}
</style>
