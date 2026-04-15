<template>
  <div class="flex flex-col items-center justify-center py-12 px-4">
    <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
      <component :is="iconComponent" class="w-8 h-8 text-text-muted" />
    </div>
    <h3 class="text-lg font-medium text-text mb-2">{{ title }}</h3>
    <p class="text-sm text-text-muted text-center max-w-xs mb-6">{{ description }}</p>
    <button v-if="actionText" @click="$emit('action')" class="px-6 py-2.5 bg-wealth/20 hover:bg-wealth/30 text-wealth border border-wealth/30 rounded-xl text-sm font-medium transition-colors">
      {{ actionText }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { FolderOpen, FileText, Receipt, MessageSquare, Calendar, Bell, HelpCircle } from 'lucide-vue-next'

const props = defineProps<{
  icon?: string
  title: string
  description: string
  actionText?: string
}>()

defineEmits<{
  action: []
}>()

const iconMap: Record<string, any> = {
  folder: FolderOpen,
  document: FileText,
  invoice: Receipt,
  message: MessageSquare,
  calendar: Calendar,
  notification: Bell,
  help: HelpCircle,
}

const iconComponent = computed(() => iconMap[props.icon || 'folder'] || FolderOpen)
</script>
