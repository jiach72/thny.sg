<template>
  <div class="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
    <div>
      <h1 class="font-serif text-3xl text-text mb-2">{{ t('help.title') }}</h1>
      <p class="text-sm text-text-muted">{{ t('help.subtitle') }}</p>
    </div>

    <div class="p-6 rounded-xl bg-gradient-to-r from-wealth/10 to-wealth/5 border border-wealth/20">
      <h2 class="font-serif text-xl text-text mb-2">{{ t('help.needMoreHelp') }}</h2>
      <p class="text-sm text-text-muted mb-4">{{ t('help.needMoreHelpDesc') }}</p>
      <div class="flex flex-wrap gap-3">
        <button @click="showConsultDialog = true" class="px-5 py-2.5 text-sm font-bold text-obsidian bg-wealth rounded shadow-lg shadow-wealth/20 hover:shadow-wealth/40 transition-all flex items-center gap-2">
          <component :is="MessageCircle" class="w-4 h-4" />
          {{ t('help.startConsultation') }}
        </button>
        <button @click="$router.push('/appointments')" class="px-5 py-2.5 text-sm font-medium text-wealth bg-wealth/10 border border-wealth/30 rounded hover:bg-wealth/20 transition-colors flex items-center gap-2">
          <component :is="Video" class="w-4 h-4" />
          {{ t('help.bookVideoMeeting') }}
        </button>
      </div>
    </div>

    <div class="relative">
      <component :is="Search" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="t('help.searchPlaceholder')"
        class="w-full pl-12 pr-4 py-3.5 bg-glass/20 border border-white/10 rounded-xl text-text placeholder:text-text-muted/50 focus:outline-none focus:border-wealth/50 transition-colors"
      />
    </div>

    <div v-if="loading" class="py-12 text-center">
      <p class="text-text-muted animate-pulse">{{ t('help.loading') }}</p>
    </div>

    <div v-else-if="filteredArticles.length === 0 && searchQuery" class="py-12 text-center">
      <component :is="SearchX" class="w-12 h-12 text-text-muted/30 mx-auto mb-3" />
      <p class="text-text-muted mb-2">{{ t('help.noResults') }}</p>
      <p class="text-xs text-text-muted/50 mb-4">{{ t('help.noResultsDesc') }}</p>
      <button @click="showConsultDialog = true" class="px-5 py-2.5 text-sm font-bold text-obsidian bg-wealth rounded shadow-lg shadow-wealth/20 hover:shadow-wealth/40 transition-all">
        {{ t('help.contactAgent') }}
      </button>
    </div>

    <div v-else-if="filteredArticles.length === 0" class="py-12 text-center">
      <p class="text-text-muted">{{ t('help.noArticles') }}</p>
    </div>

    <div v-else class="space-y-4">
      <p v-if="searchQuery" class="text-sm text-text-muted">{{ t('help.searchResultCount', { n: filteredArticles.length }) }}</p>
      <div
        v-for="article in filteredArticles"
        :key="article.id"
        class="p-5 rounded-xl bg-glass/20 border border-white/5 hover:border-wealth/30 transition-all cursor-pointer group"
        @click="toggleArticle(article.id)"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <h3 class="font-serif text-lg text-text group-hover:text-wealth transition-colors mb-2">{{ article.title }}</h3>
            <p class="text-sm text-text-muted line-clamp-2">{{ article.summary }}</p>
          </div>
          <component :is="expandedArticle === article.id ? ChevronUp : ChevronDown" class="w-5 h-5 text-text-muted shrink-0 ml-4" />
        </div>

        <div v-if="expandedArticle === article.id" class="mt-4 pt-4 border-t border-white/5">
          <div class="prose prose-invert prose-sm max-w-none text-text-muted" v-html="sanitizeHtml(article.content)"></div>

          <div class="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
            <div class="flex items-center gap-4 text-xs text-text-muted">
              <span>{{ article.viewCount || 0 }} {{ t('help.views') }}</span>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click.stop="feedbackArticle(article.id, true)"
                class="px-3 py-1.5 text-xs rounded-lg border transition-colors"
                :class="article.userFeedback === 'helpful' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-white/5 border-white/10 text-text-muted hover:text-text'"
              >
                {{ t('help.helpful') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="space-y-4">
      <h2 class="font-serif text-xl text-text">{{ t('help.moreServices') }}</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <router-link
          to="/resources"
          class="p-6 rounded-xl bg-glass/20 border border-white/5 hover:border-wealth/30 transition-all group flex items-center gap-4"
        >
          <div class="w-12 h-12 rounded-lg bg-wealth/10 text-wealth flex items-center justify-center border border-wealth/20 group-hover:bg-wealth/20 transition-colors">
            <component :is="BookOpen" class="w-6 h-6" />
          </div>
          <div>
            <h3 class="font-serif text-base text-text group-hover:text-wealth transition-colors">{{ t('help.resourceCenter') }}</h3>
            <p class="text-xs text-text-muted mt-0.5">{{ t('help.subtitle') }}</p>
          </div>
        </router-link>
        <router-link
          to="/feedback"
          class="p-6 rounded-xl bg-glass/20 border border-white/5 hover:border-wealth/30 transition-all group flex items-center gap-4"
        >
          <div class="w-12 h-12 rounded-lg bg-wealth/10 text-wealth flex items-center justify-center border border-wealth/20 group-hover:bg-wealth/20 transition-colors">
            <component :is="Star" class="w-6 h-6" />
          </div>
          <div>
            <h3 class="font-serif text-base text-text group-hover:text-wealth transition-colors">{{ t('help.serviceFeedback') }}</h3>
            <p class="text-xs text-text-muted mt-0.5">{{ t('help.subtitle') }}</p>
          </div>
        </router-link>
      </div>
    </div>

    <el-dialog v-model="showConsultDialog" :title="t('help.onlineConsultation')" width="480px" custom-class="bg-obsidian border border-white/10">
      <div class="space-y-4">
        <div class="space-y-2">
          <label class="block text-xs font-bold uppercase tracking-wider text-text-muted">{{ t('help.consultTopic') }}</label>
          <input v-model="consultForm.topic" type="text" class="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-text text-sm focus:outline-none focus:border-wealth/50 transition-colors" :placeholder="t('help.consultTopicPlaceholder')">
        </div>
        <div class="space-y-2">
          <label class="block text-xs font-bold uppercase tracking-wider text-text-muted">{{ t('help.detailedDesc') }}</label>
          <textarea v-model="consultForm.description" rows="4" class="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-text text-sm focus:outline-none focus:border-wealth/50 transition-colors resize-none" :placeholder="t('help.detailedDescPlaceholder')"></textarea>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3 pt-4 border-t border-white/10">
          <button @click="showConsultDialog = false" class="px-4 py-2 text-sm text-text-muted hover:text-text transition-colors">{{ t('common.cancel') }}</button>
          <button @click="submitConsultation" :disabled="isSubmitting || !consultForm.topic.trim()" class="px-6 py-2 bg-wealth text-obsidian text-sm font-bold rounded hover:bg-[#B49248] transition-colors disabled:opacity-50 flex items-center gap-2">
            <component v-if="isSubmitting" :is="Loader2" class="w-4 h-4 animate-spin" />
            {{ t('help.submitConsultation') }}
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { portalApi } from '@/api'
import { sanitizeHtml } from '@/utils/sanitize'
import { ElMessage } from 'element-plus'
import { Search, SearchX, MessageCircle, Video, ChevronDown, ChevronUp, Loader2, BookOpen, Star } from 'lucide-vue-next'

interface HelpArticle {
  id: string
  title: string
  summary: string
  content: string
  viewCount?: number
  userFeedback?: 'helpful' | 'not_helpful' | null
}

const { t } = useI18n()
const loading = ref(true)
const articles = ref<HelpArticle[]>([])
const searchQuery = ref('')
const expandedArticle = ref<string | null>(null)
const showConsultDialog = ref(false)
const isSubmitting = ref(false)

const consultForm = ref({
  topic: '',
  description: '',
})

const filteredArticles = computed(() => {
  if (!searchQuery.value.trim()) return articles.value
  const q = searchQuery.value.trim().toLowerCase()
  return articles.value.filter(
    a => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q)
  )
})

onMounted(() => {
  fetchArticles()
})

async function fetchArticles(): Promise<void> {
  loading.value = true
  try {
    const res = await portalApi.getFaqs()
    articles.value = (res as any)?.articles || []
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : t('help.loadError')
    ElMessage.error(msg)
  } finally {
    loading.value = false
  }
}

function toggleArticle(id: string): void {
  expandedArticle.value = expandedArticle.value === id ? null : id
}

async function feedbackArticle(articleId: string, helpful: boolean): Promise<void> {
  const article = articles.value.find(a => a.id === articleId)
  if (article) {
    try {
      await portalApi.markFaqHelpful(articleId)
      article.userFeedback = helpful ? 'helpful' : 'not_helpful'
      ElMessage.success(t('help.thanksForFeedback'))
    } catch {
      ElMessage.error(t('help.submitError'))
    }
  }
}

async function submitConsultation(): Promise<void> {
  if (!consultForm.value.topic.trim()) return
  isSubmitting.value = true
  try {
    await portalApi.sendChatMessage('', consultForm.value.topic)
    ElMessage.success(t('help.consultSuccess'))
    showConsultDialog.value = false
    consultForm.value = { topic: '', description: '' }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : t('help.submitError')
    ElMessage.error(msg)
  } finally {
    isSubmitting.value = false
  }
}
</script>
