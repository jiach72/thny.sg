<template>
  <div class="theme-switcher">
    <el-tooltip :content="isDark ? '切换到浅色模式' : '切换到深色模式'" placement="bottom">
      <el-button 
        class="theme-btn" 
        circle 
        @click="toggleTheme"
      >
        <Transition name="rotate" mode="out-in">
          <el-icon :size="18" :key="isDark ? 'dark' : 'light'">
            <Moon v-if="isDark" />
            <Sunny v-else />
          </el-icon>
        </Transition>
      </el-button>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Moon, Sunny } from '@element-plus/icons-vue'

const THEME_KEY = 'crm-theme'

// 主题状态
const isDark = ref(false)

// 切换主题
function toggleTheme() {
  isDark.value = !isDark.value
  applyTheme()
}

// 应用主题
function applyTheme() {
  const root = document.documentElement
  
  if (isDark.value) {
    root.classList.add('dark')
    root.setAttribute('data-theme', 'dark')
  } else {
    root.classList.remove('dark')
    root.setAttribute('data-theme', 'light')
  }
  
  // 持久化存储
  localStorage.setItem(THEME_KEY, isDark.value ? 'dark' : 'light')
}

// 初始化主题
function initTheme() {
  // 优先读取本地存储
  const savedTheme = localStorage.getItem(THEME_KEY)
  
  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
  } else {
    // 否则跟随系统偏好
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  
  applyTheme()
}

// 监听系统主题变化
function watchSystemTheme() {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  
  mediaQuery.addEventListener('change', (e) => {
    // 只有在没有手动设置时才跟随系统
    if (!localStorage.getItem(THEME_KEY)) {
      isDark.value = e.matches
      applyTheme()
    }
  })
}

onMounted(() => {
  initTheme()
  watchSystemTheme()
})

// 暴露状态给父组件
defineExpose({ isDark, toggleTheme })
</script>

<style scoped>
.theme-btn {
  background: transparent;
  border: none;
  color: var(--color-text-muted, #64748b);
  transition: all 0.3s ease;
}

.theme-btn:hover {
  color: var(--color-primary, #0891b2);
  background: var(--color-primary-light, rgba(8, 145, 178, 0.1));
}

/* 图标切换动画 */
.rotate-enter-active,
.rotate-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.rotate-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.5);
}

.rotate-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.5);
}
</style>
