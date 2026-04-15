<template>
  <div class="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
    <!-- Header -->
    <div>
      <h1 class="font-serif text-3xl text-text mb-2 animate-slide-in-left">{{ $t('projects.title') }}</h1>
      <p class="text-sm text-text-muted animate-slide-in-left delay-100">{{ $t('projects.subtitle') }}</p>
      <div class="flex items-center gap-4 mt-4">
        <div class="relative flex-1 max-w-xs">
          <component :is="Search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input v-model="searchQuery" type="text" :placeholder="$t('projects.searchPlaceholder')" 
            class="w-full pl-10 pr-4 py-2 bg-glass/20 border border-white/10 rounded-xl text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-wealth/30 transition-colors" />
        </div>
      </div>
    </div>

    <LoadingState v-if="isLoading" :text="$t('projects.loading')" />

    <div v-else-if="filteredProjects && filteredProjects.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="(project, index) in filteredProjects" 
        :key="project.id" 
        class="group relative flex flex-col p-6 rounded-2xl bg-[#0B0F19]/60 backdrop-blur-xl border border-white/5 hover:border-wealth/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] cursor-pointer overflow-hidden"
        @click="$router.push(`/projects/${project.id}`)"
        :style="{ animationDelay: `${index * 100}ms` }"
      >
        <!-- Hover Gradient Background -->
        <div class="absolute inset-0 bg-gradient-to-br from-wealth/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <!-- Card Header -->
        <div class="relative z-10 flex items-start justify-between mb-6">
          <div class="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:bg-wealth/10 group-hover:border-wealth/20 transition-colors duration-300">
            <component :is="getTypeIcon(project.projectType)" class="w-6 h-6 text-wealth" />
          </div>
          <span 
            class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
            :class="getStatusClasses(project.status)"
          >
            {{ getStatusLabel(project.status) }}
          </span>
        </div>

        <!-- Project Info -->
        <div class="relative z-10 flex-1 mb-6">
          <h3 class="font-serif text-xl text-text mb-2 group-hover:text-wealth transition-colors duration-300 line-clamp-1">{{ project.title || $t('projects.untitled') }}</h3>
          <p class="text-sm text-text-muted line-clamp-2 h-10">{{ project.description || $t('projects.noDescription') }}</p>
        </div>

        <!-- Date & Progress -->
        <div class="relative z-10 space-y-4">
          <div class="flex items-center gap-2 text-xs text-text-muted">
            <component :is="Calendar" class="w-3.5 h-3.5" />
            <span>{{ $t('projects.startDate') }}: {{ formatDate(project.startDate) }}</span>
          </div>

          <!-- Progress Bar -->
          <div class="space-y-2">
            <div class="flex justify-between text-[10px] uppercase font-bold tracking-wider text-text-muted">
              <span>{{ $t('projects.completionProgress') }}</span>
              <span class="text-wealth">{{ project.completionPercentage || 0 }}%</span>
            </div>
            <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div 
                class="h-full bg-gradient-to-r from-wealth to-[#f59e0b] shadow-[0_0_10px_rgba(214,181,110,0.4)] transition-all duration-1000 ease-out"
                :style="{ width: `${project.completionPercentage || 0}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Footer (Consultant) -->
        <div class="relative z-10 mt-6 pt-4 border-t border-white/5 flex items-center gap-3">
          <div class="w-6 h-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 ring-1 ring-white/10 flex items-center justify-center text-[10px] font-medium text-text">
            {{ project.consultant?.name?.[0] || $t('projects.manager')[0] }}
          </div>
          <span class="text-xs text-text-muted group-hover:text-text transition-colors">
            {{ $t('projects.manager') }}: {{ project.consultant?.name || $t('projects.assigning') }}
          </span>
        </div>
      </div>
    </div>

    <EmptyState v-else-if="!isLoading && (!filteredProjects || filteredProjects.length === 0)" icon="folder" :title="$t('projects.emptyTitle')" :description="$t('projects.emptyDesc')" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Component } from 'vue'
import { storeToRefs } from 'pinia'
import { 
  Building2, 
  Stamp, 
  FileText, 
  FolderOpen,
  Calendar,
  Search
} from 'lucide-vue-next'
import { useProjectStore } from '@/stores/projectStore'
import { formatDate, getStatusLabel } from '@/utils/formatters'
import EmptyState from '@/components/EmptyState.vue'
import LoadingState from '@/components/LoadingState.vue'

const projectStore = useProjectStore()
const { projects, isLoading } = storeToRefs(projectStore)

const searchQuery = ref('')
const filteredProjects = computed(() => {
  if (!searchQuery.value) return projects.value
  const q = searchQuery.value.toLowerCase()
  return projects.value?.filter((p: any) => 
    p.title?.toLowerCase().includes(q) || 
    p.projectType?.toLowerCase().includes(q)
  )
})

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
</script>

<style scoped>
/* No custom CSS needed, pure Tailwind */
</style>
