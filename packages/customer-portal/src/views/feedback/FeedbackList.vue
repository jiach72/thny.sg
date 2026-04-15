<template>
  <div class="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
    <div>
      <h1 class="font-serif text-3xl text-text mb-2">{{ $t('feedback.title') }}</h1>
      <p class="text-sm text-text-muted">{{ $t('feedback.subtitle') }}</p>
    </div>

    <div v-if="stats" class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="p-5 rounded-xl bg-glass/20 border border-white/5 text-center">
        <div class="text-2xl font-serif text-wealth mb-1">{{ stats.averageScore }}</div>
        <div class="text-[10px] uppercase tracking-wider text-text-muted">{{ $t('feedback.avgScore') }}</div>
      </div>
      <div class="p-5 rounded-xl bg-glass/20 border border-white/5 text-center">
        <div class="text-2xl font-serif text-text mb-1">{{ stats.totalCount }}</div>
        <div class="text-[10px] uppercase tracking-wider text-text-muted">{{ $t('feedback.totalCount') }}</div>
      </div>
      <div class="p-5 rounded-xl bg-glass/20 border border-white/5 text-center">
        <div class="text-2xl font-serif text-emerald-400 mb-1">{{ stats.npsScore }}</div>
        <div class="text-[10px] uppercase tracking-wider text-text-muted">NPS</div>
      </div>
      <div class="p-5 rounded-xl bg-glass/20 border border-white/5 flex items-center justify-center">
        <div class="radar-chart">
          <svg viewBox="0 0 200 200" class="w-full h-full max-w-[120px]">
            <polygon :points="radarBackground" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
            <polygon :points="radarData" fill="rgba(214,181,110,0.15)" stroke="#D6B56E" stroke-width="2" />
            <text v-for="(label, i) in radarLabels" :key="i" :x="radarLabelPositions[i].x" :y="radarLabelPositions[i].y" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="9">{{ label }}</text>
          </svg>
        </div>
      </div>
    </div>

    <LoadingState v-if="isLoading" :text="$t('common.loading')" />

    <div v-else class="space-y-4">
      <div
        v-for="item in feedbackList"
        :key="item.projectId"
        class="p-6 rounded-xl bg-glass/20 border border-white/5 hover:border-wealth/30 transition-all"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <h3 class="font-serif text-lg text-text mb-1">{{ item.projectTitle }}</h3>
            <p class="text-xs text-text-muted">{{ $t('feedback.completedAt') }}: {{ formatDate(item.completedAt) }}</p>
          </div>
          <div v-if="item.feedback" class="text-right shrink-0">
            <div class="flex gap-0.5 justify-end mb-1">
              <span v-for="star in 5" :key="star" class="text-sm" :class="star <= item.feedback.overallScore ? 'text-wealth' : 'text-white/20'">★</span>
            </div>
            <span class="text-xs text-text-muted">{{ item.feedback.overallScore }}/5</span>
          </div>
          <button v-else @click="openFeedbackDialog(item)" class="px-4 py-2 bg-gradient-to-r from-wealth to-[#B49248] text-obsidian text-sm font-bold rounded-lg shadow-lg shadow-wealth/20 hover:shadow-wealth/40 transition-all active:scale-95">
            {{ $t('feedback.rateNow') }}
          </button>
        </div>

        <div v-if="item.feedback" class="mt-4 pt-4 border-t border-white/5">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div v-for="dim in dimensionKeys" :key="dim.key" class="text-center">
              <div class="text-sm font-medium text-text">{{ item.feedback[dim.key] }}/5</div>
              <div class="text-[10px] text-text-muted">{{ dim.label }}</div>
            </div>
          </div>
          <p v-if="item.feedback.comment" class="text-sm text-text-muted italic">"{{ item.feedback.comment }}"</p>
          <div v-if="item.feedback.nps !== undefined" class="mt-2 flex items-center gap-2">
            <span class="text-xs text-text-muted">NPS:</span>
            <span class="text-sm font-bold" :class="item.feedback.nps >= 9 ? 'text-emerald-400' : item.feedback.nps >= 7 ? 'text-amber-400' : 'text-red-400'">{{ item.feedback.nps }}</span>
            <span class="text-[10px] text-text-muted">/10</span>
          </div>
        </div>
      </div>

      <EmptyState v-if="feedbackList.length === 0" icon="star" :title="$t('feedback.emptyTitle')" :description="$t('feedback.emptyDesc')" />
    </div>

    <div v-if="showDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-obsidian/80 backdrop-blur-sm" @click="showDialog = false"></div>
      <div class="relative w-full max-w-lg bg-[#1c1c1c] border border-white/10 rounded-xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <h2 class="font-serif text-xl text-text">{{ $t('feedback.rateProject') }}</h2>
        <p class="text-sm text-text-muted">{{ selectedItem?.projectTitle }}</p>

        <div>
          <label class="block text-xs text-text-muted mb-2">{{ $t('feedback.overallScore') }}</label>
          <div class="flex gap-2">
            <button v-for="star in 5" :key="star" @click="form.overallScore = star" class="text-3xl transition-all" :class="star <= form.overallScore ? 'text-wealth scale-110' : 'text-white/20 hover:text-wealth/50'">★</button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div v-for="dim in dimensionKeys" :key="dim.key">
            <label class="block text-xs text-text-muted mb-1.5">{{ dim.label }}</label>
            <div class="flex gap-1">
              <button v-for="star in 5" :key="star" @click="(form as any)[dim.key] = star" class="text-lg transition-all" :class="star <= (form as any)[dim.key] ? 'text-wealth' : 'text-white/20 hover:text-wealth/50'">★</button>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-xs text-text-muted mb-1.5">{{ $t('feedback.npsLabel') }}</label>
          <div class="flex gap-1 flex-wrap">
            <button v-for="n in 11" :key="n - 1" @click="form.nps = n - 1" class="w-8 h-8 rounded text-xs font-bold transition-all" :class="form.nps === n - 1 ? (n - 1 >= 9 ? 'bg-emerald-500 text-white' : n - 1 >= 7 ? 'bg-amber-500 text-white' : 'bg-red-500 text-white') : 'bg-white/5 text-text-muted hover:bg-white/10'">
              {{ n - 1 }}
            </button>
          </div>
          <div class="flex justify-between text-[10px] text-text-muted mt-1">
            <span>{{ $t('feedback.npsLow') }}</span>
            <span>{{ $t('feedback.npsHigh') }}</span>
          </div>
        </div>

        <div>
          <label class="block text-xs text-text-muted mb-1.5">{{ $t('feedback.commentLabel') }}</label>
          <textarea v-model="form.comment" rows="3" class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-wealth/50 transition-colors resize-none" :placeholder="$t('feedback.commentPlaceholder')"></textarea>
        </div>

        <div class="flex gap-3 justify-end pt-2">
          <button @click="showDialog = false" class="px-4 py-2 bg-transparent rounded-lg text-sm text-text-muted hover:text-text hover:bg-white/5 transition-colors">{{ $t('common.cancel') }}</button>
          <button @click="handleSubmit" :disabled="isSubmitting || form.overallScore === 0" class="px-6 py-2 bg-gradient-to-r from-wealth to-[#B49248] text-obsidian text-sm font-bold rounded-lg shadow-lg shadow-wealth/20 transition-all disabled:opacity-50 disabled:grayscale">{{ $t('common.confirm') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { portalApi } from '@/api'
import { formatDate } from '@/utils/formatters'
import LoadingState from '@/components/LoadingState.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface FeedbackData {
  overallScore: number
  professionalism: number
  responsiveness: number
  communication: number
  valueForMoney: number
  nps: number
  comment: string
}

interface FeedbackItem {
  projectId: string
  projectTitle: string
  completedAt: string
  feedback: FeedbackData | null
}

interface FeedbackStats {
  averageScore: number
  totalCount: number
  npsScore: number
  professionalism: number
  responsiveness: number
  communication: number
  valueForMoney: number
}

const isLoading = ref(true)
const isSubmitting = ref(false)
const feedbackList = ref<FeedbackItem[]>([])
const stats = ref<FeedbackStats | null>(null)
const showDialog = ref(false)
const selectedItem = ref<FeedbackItem | null>(null)

const form = ref<FeedbackData>({
  overallScore: 0,
  professionalism: 0,
  responsiveness: 0,
  communication: 0,
  valueForMoney: 0,
  nps: 0,
  comment: '',
})

const dimensionKeys = computed(() => [
  { key: 'professionalism' as const, label: t('feedback.dimProfessionalism') },
  { key: 'responsiveness' as const, label: t('feedback.dimResponsiveness') },
  { key: 'communication' as const, label: t('feedback.dimCommunication') },
  { key: 'valueForMoney' as const, label: t('feedback.dimValue') },
])

const radarLabels = computed(() => dimensionKeys.value.map(d => d.label))

const radarBackground = computed(() => {
  const cx = 100, cy = 100, r = 70
  return Array.from({ length: 4 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
  }).join(' ')
})

const radarData = computed(() => {
  if (!stats.value) return radarBackground.value
  const cx = 100, cy = 100, r = 70
  const dims = [stats.value.professionalism, stats.value.responsiveness, stats.value.communication, stats.value.valueForMoney]
  return Array.from({ length: 4 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2
    const val = (dims[i] || 0) / 5
    return `${cx + r * val * Math.cos(angle)},${cy + r * val * Math.sin(angle)}`
  }).join(' ')
})

const radarLabelPositions = computed(() => {
  const cx = 100, cy = 100, r = 90
  return Array.from({ length: 4 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) + 3 }
  })
})

onMounted(async () => {
  try {
    const [listRes, statsRes] = await Promise.all([
      portalApi.getFeedbackList(),
      portalApi.getFeedbackStats(),
    ])
    feedbackList.value = (listRes as any).projects || (listRes as any) || []
    stats.value = (statsRes as any).stats || (statsRes as any) || null
  } catch {
    ElMessage.error(t('feedback.loadError'))
  } finally {
    isLoading.value = false
  }
})

function openFeedbackDialog(item: FeedbackItem) {
  selectedItem.value = item
  form.value = { overallScore: 0, professionalism: 0, responsiveness: 0, communication: 0, valueForMoney: 0, nps: 0, comment: '' }
  showDialog.value = true
}

async function handleSubmit() {
  if (!selectedItem.value || form.value.overallScore === 0) return
  isSubmitting.value = true
  try {
    await portalApi.submitFeedback(selectedItem.value.projectId, form.value)
    ElMessage.success(t('feedback.submitSuccess'))
    showDialog.value = false
    const idx = feedbackList.value.findIndex(f => f.projectId === selectedItem.value!.projectId)
    if (idx !== -1) {
      feedbackList.value[idx].feedback = { ...form.value }
    }
    const statsRes = await portalApi.getFeedbackStats()
    stats.value = (statsRes as any).stats || (statsRes as any) || null
  } catch {
    ElMessage.error(t('feedback.submitError'))
  } finally {
    isSubmitting.value = false
  }
}
</script>
