<template>
  <button 
    @click="configStore.togglePrivacy"
    class="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 group bg-white/5 border border-white/10 hover:bg-white/10 hover:border-wealth/50 active:scale-95 shadow-sm"
    :class="configStore.isPrivacyMode ? 'text-wealth' : 'text-text-muted hover:text-text'"
    title="Toggle Privacy Mode"
  >
    <component 
      :is="configStore.isPrivacyMode ? EyeOff : Eye" 
      class="w-4 h-4 transition-transform group-hover:scale-110" 
    />
    <span class="text-xs font-medium tracking-wide">
      {{ configStore.isPrivacyMode ? 'HIDDEN' : 'VISIBLE' }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next'
import { useConfigStore } from '@/stores/configStore'

const configStore = useConfigStore()
</script>
