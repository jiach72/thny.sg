<template>
  <div class="relative overflow-hidden rounded-xl bg-glass/40 border border-white/5 p-6 group transition-all duration-300 hover:bg-glass/60 hover:border-wealth/30 hover:shadow-lg hover:shadow-wealth/5">
    <!-- 背景装饰 -->
    <div class="absolute top-0 right-0 w-32 h-32 bg-wealth/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-wealth/10 transition-colors"></div>

    <div class="relative z-10 flex items-start gap-4">
      <!-- 头像 -->
      <div class="relative">
        <el-avatar 
          :size="56" 
          :src="consultant?.avatarUrl || defaultAvatar" 
          class="ring-2 ring-white/10 group-hover:ring-wealth transition-all"
        >
          {{ initials }}
        </el-avatar>
        <div 
          v-if="showOnlineStatus"
          class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-obsidian rounded-full" 
          title="在线"
        ></div>
      </div>

      <!-- 信息 -->
      <div class="flex-1">
        <p class="text-[10px] uppercase tracking-wider text-wealth mb-1">{{ roleLabel }}</p>
        <h3 class="text-lg font-serif text-text font-medium mb-1">{{ displayName }}</h3>
        <p class="text-xs text-text-muted mb-4">{{ displayTitle }}</p>

        <!-- 操作按钮 -->
        <div class="flex items-center gap-2">
          <a 
            v-if="whatsappUrl"
            :href="whatsappUrl" 
            target="_blank"
            class="flex-1 h-8 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs text-text transition-colors cursor-pointer"
          >
            <component :is="MessageCircle" class="w-3.5 h-3.5" />
            WhatsApp
          </a>
          <button 
            v-else
            disabled
            class="flex-1 h-8 flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded text-xs text-text-muted opacity-50 cursor-not-allowed"
          >
            <component :is="MessageCircle" class="w-3.5 h-3.5" />
            WhatsApp
          </button>
          <button 
            @click="$emit('schedule-meeting')"
            class="flex-1 h-8 flex items-center justify-center gap-2 bg-wealth hover:bg-[#B49248] border border-transparent rounded text-xs text-obsidian font-bold transition-colors cursor-pointer"
          >
            <component :is="Calendar" class="w-3.5 h-3.5" />
            预约
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MessageCircle, Calendar } from 'lucide-vue-next'

// 顾问信息类型
interface Consultant {
  id?: string
  name?: string
  email?: string
  phone?: string
  avatarUrl?: string
  title?: string
}

const props = withDefaults(defineProps<{
  consultant?: Consultant | null
  roleLabel?: string
  showOnlineStatus?: boolean
}>(), {
  consultant: null,
  roleLabel: '您的专属顾问',
  showOnlineStatus: true
})

defineEmits<{
  (e: 'schedule-meeting'): void
}>()

// 默认头像（移除 Unsplash 外部依赖，使用 el-avatar 的 initials 回退显示）
const defaultAvatar = ''

// 计算属性
const displayName = computed(() => props.consultant?.name || '待指派')
const displayTitle = computed(() => props.consultant?.title || '高级顾问')
const initials = computed(() => {
  const name = props.consultant?.name || ''
  return name.charAt(0).toUpperCase() || '?'
})

const whatsappUrl = computed(() => {
  const phone = props.consultant?.phone
  if (!phone) return null
  // 移除所有非数字字符
  const cleanPhone = phone.replace(/\D/g, '')
  return `https://wa.me/${cleanPhone}`
})
</script>
