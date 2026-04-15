<template>
  <div class="flex flex-col items-center justify-center py-12 px-4">
    <div class="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
      <AlertTriangle class="w-8 h-8 text-red-400" />
    </div>
    <h3 class="text-lg font-medium text-text mb-2">{{ title }}</h3>
    <p class="text-sm text-text-muted text-center max-w-xs mb-6">{{ description }}</p>
    <button @click="$emit('retry')" class="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-text border border-white/10 rounded-xl text-sm font-medium transition-colors">
      重新加载
    </button>
  </div>
</template>

<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'

withDefaults(defineProps<{
  title?: string
  description?: string
}>(), {
  title: '加载失败',
  description: '请检查网络连接后重试'
})

defineEmits<{
  retry: []
}>()
</script>
