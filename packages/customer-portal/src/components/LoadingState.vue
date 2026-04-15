<template>
  <div class="flex flex-col items-center justify-center py-12 px-4">
    <div class="w-8 h-8 border-2 border-wealth/30 border-t-wealth rounded-full animate-spin mb-4"></div>
    <p class="text-sm text-text-muted">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  text?: string
}>(), {
  text: '正在加载...'
})
</script>
