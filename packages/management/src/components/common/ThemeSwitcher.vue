<template>
  <div style="display: none;"><!-- 暗色模式已应要求停用 --></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isDark = ref(false)

function applyTheme() {
  const root = document.documentElement
  root.classList.remove('dark')
  root.setAttribute('data-theme', 'light')
  localStorage.setItem('crm-theme', 'light')
}

onMounted(() => {
  applyTheme()
})

// 保留原暴露状态防止外部调用出错
const toggleTheme = () => { applyTheme() }
defineExpose({ isDark, toggleTheme })
</script>
