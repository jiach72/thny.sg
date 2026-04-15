<template>
  <Transition name="slide-up">
    <div v-if="!hasConsented" class="cookie-consent">
      <div class="cookie-content">
        <p>我们使用 Cookie 来提升您的浏览体验和分析网站流量。继续使用本网站即表示您同意我们的<a href="/privacy-policy" target="_blank">隐私政策</a>。</p>
        <div class="cookie-actions">
          <button @click="acceptAll" class="btn-accept">全部接受</button>
          <button @click="acceptNecessary" class="btn-necessary">仅必要 Cookie</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const hasConsented = ref(true)
const STORAGE_KEY = 'cookie_consent'

onMounted(() => {
  const stored = localStorage.getItem(STORAGE_KEY)
  hasConsented.value = !!stored
})

function acceptAll() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ analytics: true, necessary: true, timestamp: Date.now() }))
  hasConsented.value = true
}

function acceptNecessary() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ analytics: false, necessary: true, timestamp: Date.now() }))
  hasConsented.value = true
}
</script>

<style scoped>
.cookie-consent {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(8px);
  color: white;
  padding: 1rem 1.5rem;
  z-index: 9999;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.cookie-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}
.cookie-content p {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
}
.cookie-content a {
  color: #60a5fa;
  text-decoration: underline;
}
.cookie-actions {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
}
.btn-accept {
  padding: 0.5rem 1.25rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background 0.2s;
}
.btn-accept:hover { background: #2563eb; }
.btn-necessary {
  padding: 0.5rem 1.25rem;
  background: transparent;
  color: #94a3b8;
  border: 1px solid #475569;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}
.btn-necessary:hover { color: white; border-color: #64748b; }
.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); }

@media (max-width: 768px) {
  .cookie-content { flex-direction: column; text-align: center; }
  .cookie-actions { width: 100%; justify-content: center; }
}
</style>
