<template>
  <div class="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
    <div>
      <h1 class="font-serif text-3xl text-text mb-2">{{ $t('resources.title') }}</h1>
      <p class="text-sm text-text-muted">{{ $t('resources.subtitle') }}</p>
    </div>

    <div class="relative max-w-xl">
      <component :is="Search" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
      <input v-model="keyword" type="text" :placeholder="$t('resources.searchPlaceholder')" class="w-full pl-12 pr-4 py-3 bg-glass/20 border border-white/10 rounded-xl text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-wealth/30 transition-colors" @keyup.enter="loadResources" />
    </div>

    <div class="flex gap-2 overflow-x-auto pb-2">
      <button
        v-for="cat in categories"
        :key="cat.value"
        @click="activeCategory = cat.value"
        class="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
        :class="activeCategory === cat.value ? 'bg-wealth text-obsidian shadow-lg shadow-wealth/20' : 'bg-glass/20 border border-white/10 text-text-muted hover:bg-glass/30 hover:text-text'"
      >
        {{ cat.label }}
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2">
        <LoadingState v-if="isLoading" :text="$t('common.loading')" />

        <div v-else-if="resources.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="item in resources"
            :key="item.id"
            class="group p-5 rounded-xl bg-glass/20 border border-white/5 hover:bg-glass/30 hover:border-wealth/30 transition-all duration-300 cursor-pointer"
            @click="openDetail(item)"
          >
            <div class="flex items-center gap-2 mb-3">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" :class="getTypeClass(item.type)">{{ getTypeLabel(item.type) }}</span>
              <span class="text-[10px] text-text-muted">{{ item.views }} {{ $t('resources.views') }}</span>
            </div>
            <h3 class="font-serif text-lg text-text group-hover:text-wealth transition-colors mb-2 line-clamp-1">{{ item.title }}</h3>
            <p class="text-sm text-text-muted line-clamp-2">{{ item.summary }}</p>
          </div>
        </div>

        <EmptyState v-else icon="book" :title="$t('resources.emptyTitle')" :description="$t('resources.emptyDesc')" />
      </div>

      <div class="space-y-6">
        <div class="rounded-xl bg-glass/20 border border-white/5 p-6">
          <h3 class="font-serif text-lg text-text mb-4 flex items-center gap-2">
            <component :is="Flame" class="w-5 h-5 text-wealth" />
            {{ $t('resources.popular') }}
          </h3>
          <div class="space-y-3">
            <div
              v-for="(item, idx) in popularResources"
              :key="item.id"
              class="flex items-start gap-3 cursor-pointer group"
              @click="openDetail(item)"
            >
              <span class="text-lg font-serif font-bold text-wealth/40 shrink-0">{{ idx + 1 }}</span>
              <div class="min-w-0">
                <p class="text-sm text-text group-hover:text-wealth transition-colors truncate">{{ item.title }}</p>
                <p class="text-[10px] text-text-muted">{{ item.views }} {{ $t('resources.views') }}</p>
              </div>
            </div>
          </div>
          <div v-if="popularResources.length === 0" class="text-center py-4">
            <p class="text-xs text-text-muted">{{ $t('resources.noPopular') }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showDetail" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-obsidian/80 backdrop-blur-sm" @click="showDetail = false"></div>
      <div class="relative w-full max-w-3xl max-h-[85vh] bg-[#1c1c1c] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div class="p-6 border-b border-white/5 flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" :class="getTypeClass(selectedResource?.type || '')">{{ getTypeLabel(selectedResource?.type || '') }}</span>
            </div>
            <h2 class="font-serif text-xl text-text">{{ selectedResource?.title }}</h2>
          </div>
          <button @click="showDetail = false" class="p-2 rounded-lg hover:bg-white/5 transition-colors shrink-0">
            <component :is="X" class="w-5 h-5 text-text-muted" />
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <div class="prose prose-invert prose-sm max-w-none text-text-muted leading-relaxed" v-html="sanitizeHtml(selectedResource?.content || '')"></div>
          <div v-if="selectedResource?.attachments && selectedResource.attachments.length > 0" class="border-t border-white/5 pt-4">
            <h4 class="text-sm font-bold text-text mb-3">{{ $t('resources.attachments') }}</h4>
            <div class="space-y-2">
              <a
                v-for="att in selectedResource.attachments"
                :key="att.name"
                :href="att.url"
                class="flex items-center gap-3 p-3 rounded-lg bg-glass/20 border border-white/5 hover:border-wealth/30 transition-all"
              >
                <component :is="Download" class="w-4 h-4 text-wealth" />
                <span class="text-sm text-text">{{ att.name }}</span>
              </a>
            </div>
          </div>
          <div v-if="selectedResource?.related && selectedResource.related.length > 0" class="border-t border-white/5 pt-4">
            <h4 class="text-sm font-bold text-text mb-3">{{ $t('resources.related') }}</h4>
            <div class="space-y-2">
              <div
                v-for="rel in selectedResource.related"
                :key="rel.id"
                class="p-3 rounded-lg bg-glass/20 border border-white/5 hover:border-wealth/30 transition-all cursor-pointer"
                @click="openDetail(rel)"
              >
                <span class="text-sm text-text">{{ rel.title }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Flame, X, Download } from 'lucide-vue-next'
import { portalApi } from '@/api'
import { sanitizeHtml } from '@/utils/sanitize'
import LoadingState from '@/components/LoadingState.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface ResourceAttachment {
  name: string
  url: string
}

interface ResourceItem {
  id: string
  title: string
  summary: string
  content?: string
  type: 'article' | 'video' | 'template'
  category: string
  views: number
  attachments?: ResourceAttachment[]
  related?: ResourceItem[]
}

const isLoading = ref(true)
const resources = ref<ResourceItem[]>([])
const popularResources = ref<ResourceItem[]>([])
const keyword = ref('')
const activeCategory = ref('entry')
const showDetail = ref(false)
const selectedResource = ref<ResourceItem | null>(null)

const categories = computed(() => [
  { value: 'entry', label: t('resources.catEntry') },
  { value: 'visa', label: t('resources.catVisa') },
  { value: 'life', label: t('resources.catLife') },
  { value: 'legal', label: t('resources.catLegal') },
  { value: 'tax', label: t('resources.catTax') },
])

onMounted(() => {
  loadResources()
  loadPopular()
})

watch(activeCategory, () => {
  loadResources()
})

async function loadResources() {
  isLoading.value = true
  try {
    const res = await portalApi.getResources({ category: activeCategory.value, keyword: keyword.value || undefined })
    resources.value = (res as any).resources || (res as any) || []
  } catch {
    ElMessage.error(t('resources.loadError'))
  } finally {
    isLoading.value = false
  }
}

async function loadPopular() {
  try {
    const res = await portalApi.getResources({ keyword: undefined })
    const all = (res as any).resources || (res as any) || []
    popularResources.value = all.sort((a: ResourceItem, b: ResourceItem) => b.views - a.views).slice(0, 5)
  } catch {
    popularResources.value = []
  }
}

async function openDetail(item: ResourceItem) {
  try {
    const res = await portalApi.getResource(item.id)
    selectedResource.value = (res as any).resource || (res as any) || item
    showDetail.value = true
  } catch {
    selectedResource.value = item
    showDetail.value = true
  }
}

function getTypeLabel(type: string): string {
  const map: Record<string, string> = { article: t('resources.typeArticle'), video: t('resources.typeVideo'), template: t('resources.typeTemplate') }
  return map[type] || type
}

function getTypeClass(type: string): string {
  const map: Record<string, string> = { article: 'bg-blue-500/10 text-blue-400', video: 'bg-purple-500/10 text-purple-400', template: 'bg-emerald-500/10 text-emerald-400' }
  return map[type] || 'bg-gray-500/10 text-gray-400'
}
</script>
