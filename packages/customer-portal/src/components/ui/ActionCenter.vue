<template>
  <div class="rounded-xl bg-glass/20 border border-white/5 overflow-hidden">
    <!-- 头部 -->
    <div class="p-6 border-b border-white/5 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-lg bg-orange-500/10 text-orange-400">
          <component :is="Zap" class="w-5 h-5" />
        </div>
        <div>
          <h3 class="font-serif text-lg text-text">行动中心</h3>
          <p class="text-xs text-text-muted">需要您处理的待办事项</p>
        </div>
      </div>
      <span v-if="items.length > 0" class="px-2 py-1 rounded bg-orange-500/20 text-orange-400 text-xs font-bold">{{ items.length }} 待处理</span>
    </div>

    <!-- 列表 -->
    <div v-if="items.length > 0" class="divide-y divide-white/5">
      <div 
        v-for="item in items" 
        :key="item.id"
        class="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors group cursor-pointer"
        @click="handleAction(item)"
      >
        <!-- 状态图标 -->
        <div class="w-2 h-2 rounded-full bg-orange-500 ring-4 ring-orange-500/20 group-hover:bg-orange-400 transition-colors"></div>
        
        <div class="flex-1">
          <h4 class="text-sm font-medium text-text group-hover:text-wealth transition-colors">{{ item.title }}</h4>
          <p class="text-xs text-text-muted mt-0.5">{{ item.description }}</p>
        </div>

        <component :is="ChevronRight" class="w-4 h-4 text-text-muted group-hover:text-text group-hover:translate-x-1 transition-all" />
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="p-8 text-center">
      <div class="w-12 h-12 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center mx-auto mb-3">
        <component :is="CheckCircle2" class="w-6 h-6" />
      </div>
      <p class="text-sm text-text font-medium">一切就绪</p>
      <p class="text-xs text-text-muted mt-1">暂无待处理事项</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Zap, ChevronRight, CheckCircle2 } from 'lucide-vue-next'

interface ActionItem {
  id: string
  title: string
  description: string
  type: string
  createdAt: string
  projectId?: string
  documentId?: string
  messageId?: string
}

defineProps<{
  items: ActionItem[]
}>()

const emit = defineEmits<{
  (e: 'action', item: ActionItem): void
}>()

const router = useRouter()

function handleAction(item: ActionItem): void {
  // 触发事件供父组件处理
  emit('action', item)
  
  // 根据类型跳转到对应页面
  switch (item.type) {
    case 'document':
      router.push('/documents')
      break
    case 'project':
      if (item.projectId) {
        router.push(`/projects/${item.projectId}`)
      } else {
        router.push('/projects')
      }
      break
    case 'invoice':
      router.push('/invoices')
      break
    case 'message':
      router.push('/messages')
      break
    default:
      // 其他类型默认跳转消息页面
      router.push('/messages')
  }
}
</script>
