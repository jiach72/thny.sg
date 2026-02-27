<template>
  <div class="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
    <!-- Header -->
    <div>
      <h1 class="font-serif text-3xl text-text mb-2 animate-slide-in-left">我的项目</h1>
      <p class="text-sm text-text-muted animate-slide-in-left delay-100">查看和追踪您所有服务项目的进度</p>
    </div>

    <!-- Project Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" v-loading="isLoading">
      <div 
        v-for="(project, index) in ((projects as any[]) || [])" 
        :key="(project as any).id" 
        class="group relative flex flex-col p-6 rounded-2xl bg-[#0B0F19]/60 backdrop-blur-xl border border-white/5 hover:border-wealth/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] cursor-pointer overflow-hidden"
        @click="$router.push(`/projects/${project.id}`)"
        :style="{ animationDelay: `${index * 100}ms` }"
      >
        <!-- Hover Gradient Background -->
        <div class="absolute inset-0 bg-gradient-to-br from-wealth/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <!-- Card Header -->
        <div class="relative z-10 flex items-start justify-between mb-6">
          <div class="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:bg-wealth/10 group-hover:border-wealth/20 transition-colors duration-300">
            <component :is="getTypeIcon((project as any).projectType)" class="w-6 h-6 text-wealth" />
          </div>
          <span 
            class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
            :class="getStatusClasses((project as any).status)"
          >
            {{ getStatusLabel((project as any).status) }}
          </span>
        </div>

        <!-- Project Info -->
        <div class="relative z-10 flex-1 mb-6">
          <h3 class="font-serif text-xl text-text mb-2 group-hover:text-wealth transition-colors duration-300 line-clamp-1">{{ (project as any).title || '无标题项目' }}</h3>
          <p class="text-sm text-text-muted line-clamp-2 h-10">{{ (project as any).description || '暂无详细描述...' }}</p>
        </div>

        <!-- Date & Progress -->
        <div class="relative z-10 space-y-4">
          <div class="flex items-center gap-2 text-xs text-text-muted">
            <component :is="Calendar" class="w-3.5 h-3.5" />
            <span>开始日期: {{ formatDate((project as any).startDate) }}</span>
          </div>

          <!-- Progress Bar -->
          <div class="space-y-2">
            <div class="flex justify-between text-[10px] uppercase font-bold tracking-wider text-text-muted">
              <span>完成进度</span>
              <span class="text-wealth">{{ (project as any).completionPercentage || 0 }}%</span>
            </div>
            <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div 
                class="h-full bg-gradient-to-r from-wealth to-[#f59e0b] shadow-[0_0_10px_rgba(214,181,110,0.4)] transition-all duration-1000 ease-out"
                :style="{ width: `${(project as any).completionPercentage || 0}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Footer (Consultant) -->
        <div class="relative z-10 mt-6 pt-4 border-t border-white/5 flex items-center gap-3">
          <div class="w-6 h-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 ring-1 ring-white/10 flex items-center justify-center text-[10px] font-medium text-text">
            {{ (project as any).consultant?.name?.[0] || '管' }}
          </div>
          <span class="text-xs text-text-muted group-hover:text-text transition-colors">
            负责人: {{ (project as any).consultant?.name || '指派中' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!isLoading && (!projects || projects.length === 0)" class="flex flex-col items-center justify-center py-20 rounded-3xl bg-glass/10 border border-white/5 border-dashed">
      <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
        <component :is="FolderOpen" class="w-8 h-8 text-text-muted" />
      </div>
      <p class="text-text-muted">暂无相关项目</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import type { Component } from 'vue'
import { storeToRefs } from 'pinia'
import { 
  Building2, 
  Stamp, 
  FileText, 
  FolderOpen, // Default 
  Calendar
} from 'lucide-vue-next'
import { useProjectStore } from '@/stores/projectStore'

const projectStore = useProjectStore()
const { projects, isLoading } = storeToRefs(projectStore)

onMounted(() => {
  projectStore.fetchMyProjects()
})

function getTypeIcon(type: string): Component {
  const map: Record<string, Component> = {
    'Enterprise Setup': Building2,
    'EP Application': Stamp,
    'Tax Planning': FileText,
  }
  return map[type] || FolderOpen
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PLANNING: '规划中',
    ACTIVE: '进行中',
    ON_HOLD: '暂停',
    COMPLETED: '已完成',
    ARCHIVED: '归档'
  }
  return map[status] || status
}

function getStatusClasses(status: string): string {
  const map: Record<string, string> = {
    PLANNING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    ON_HOLD: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    COMPLETED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    ARCHIVED: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
  }
  return map[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
</script>

<style scoped>
/* No custom CSS needed, pure Tailwind */
</style>
