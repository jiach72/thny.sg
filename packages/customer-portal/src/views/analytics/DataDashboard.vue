<template>
  <div class="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
    <div class="flex items-end justify-between">
      <div>
        <h1 class="font-serif text-3xl text-text mb-2">{{ $t('analytics.title') }}</h1>
        <p class="text-sm text-text-muted">{{ $t('analytics.subtitle') }}</p>
      </div>
      <div class="flex gap-2">
        <button
          v-for="p in periods"
          :key="p.value"
          @click="activePeriod = p.value"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          :class="activePeriod === p.value ? 'bg-wealth text-obsidian shadow-lg shadow-wealth/20' : 'bg-glass/20 border border-white/10 text-text-muted hover:bg-glass/30 hover:text-text'"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <LoadingState v-if="isLoading" :text="$t('common.loading')" />

    <div v-else class="space-y-8">
      <div class="rounded-xl bg-glass/20 border border-white/5 p-6">
        <h3 class="text-sm uppercase tracking-wider text-text-muted font-bold mb-6">{{ $t('analytics.expenseTrend') }}</h3>
        <div class="relative h-64">
          <svg class="w-full h-full" :viewBox="`0 0 ${chartWidth} ${chartHeight}`" preserveAspectRatio="none">
            <line v-for="i in 5" :key="'grid-' + i" :x1="chartPadding" :y1="chartPadding + (chartHeight - 2 * chartPadding) * (i - 1) / 4" :x2="chartWidth - chartPadding" :y2="chartPadding + (chartHeight - 2 * chartPadding) * (i - 1) / 4" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
            <polyline
              :points="expenseLinePoints"
              fill="none"
              stroke="#D6B56E"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <polygon
              :points="expenseAreaPoints"
              fill="url(#wealthGradient)"
            />
            <defs>
              <linearGradient id="wealthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="rgba(214,181,110,0.3)" />
                <stop offset="100%" stop-color="rgba(214,181,110,0)" />
              </linearGradient>
            </defs>
            <circle
              v-for="(pt, idx) in expensePoints"
              :key="'dot-' + idx"
              :cx="pt.x"
              :cy="pt.y"
              r="4"
              fill="#D6B56E"
              stroke="#1c1c1c"
              stroke-width="2"
              class="cursor-pointer"
            />
          </svg>
          <div class="flex justify-between mt-2 px-2">
            <span v-for="(label, idx) in expenseLabels" :key="'label-' + idx" class="text-[10px] text-text-muted">{{ label }}</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="rounded-xl bg-glass/20 border border-white/5 p-6">
          <h3 class="text-sm uppercase tracking-wider text-text-muted font-bold mb-6">{{ $t('analytics.projectProgress') }}</h3>
          <div class="space-y-4">
            <div v-for="proj in projectProgress" :key="proj.id">
              <div class="flex justify-between text-sm mb-1.5">
                <span class="text-text truncate">{{ proj.title }}</span>
                <span class="text-wealth font-medium shrink-0 ml-2">{{ proj.percentage }}%</span>
              </div>
              <div class="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div class="h-full bg-gradient-to-r from-wealth to-[#f59e0b] shadow-[0_0_10px_rgba(214,181,110,0.4)] transition-all duration-1000 ease-out" :style="{ width: `${proj.percentage}%` }"></div>
              </div>
            </div>
            <div v-if="projectProgress.length === 0" class="text-center py-6">
              <p class="text-xs text-text-muted">{{ $t('analytics.noData') }}</p>
            </div>
          </div>
        </div>

        <div class="space-y-8">
          <div class="rounded-xl bg-glass/20 border border-white/5 p-6">
            <h3 class="text-sm uppercase tracking-wider text-text-muted font-bold mb-4">{{ $t('analytics.documentStats') }}</h3>
            <div class="grid grid-cols-3 gap-4">
              <div class="text-center">
                <div class="text-2xl font-serif text-wealth">{{ docStats.uploaded }}</div>
                <div class="text-[10px] uppercase tracking-wider text-text-muted">{{ $t('analytics.uploaded') }}</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-serif text-amber-400">{{ docStats.pending }}</div>
                <div class="text-[10px] uppercase tracking-wider text-text-muted">{{ $t('analytics.pending') }}</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-serif text-emerald-400">{{ docStats.signRate }}%</div>
                <div class="text-[10px] uppercase tracking-wider text-text-muted">{{ $t('analytics.signRate') }}</div>
              </div>
            </div>
          </div>

          <div class="rounded-xl bg-glass/20 border border-white/5 p-6">
            <h3 class="text-sm uppercase tracking-wider text-text-muted font-bold mb-4">{{ $t('analytics.invoiceStats') }}</h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="p-3 rounded-lg bg-white/5">
                <div class="text-xs text-text-muted mb-1">{{ $t('analytics.totalAmount') }}</div>
                <div class="text-lg font-serif text-text">{{ formatCurrency(invoiceStats.total) }}</div>
              </div>
              <div class="p-3 rounded-lg bg-emerald-500/5">
                <div class="text-xs text-text-muted mb-1">{{ $t('analytics.paid') }}</div>
                <div class="text-lg font-serif text-emerald-400">{{ formatCurrency(invoiceStats.paid) }}</div>
              </div>
              <div class="p-3 rounded-lg bg-amber-500/5">
                <div class="text-xs text-text-muted mb-1">{{ $t('analytics.unpaid') }}</div>
                <div class="text-lg font-serif text-amber-400">{{ formatCurrency(invoiceStats.unpaid) }}</div>
              </div>
              <div class="p-3 rounded-lg bg-red-500/5">
                <div class="text-xs text-text-muted mb-1">{{ $t('analytics.overdue') }}</div>
                <div class="text-lg font-serif text-red-400">{{ formatCurrency(invoiceStats.overdue) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-xl bg-glass/20 border border-white/5 p-6">
        <h3 class="text-sm uppercase tracking-wider text-text-muted font-bold mb-4">{{ $t('analytics.activityHeatmap') }}</h3>
        <div class="grid gap-1" style="grid-template-columns: repeat(7, 1fr); grid-template-rows: repeat(5, 1fr);">
          <div
            v-for="(cell, idx) in heatmapCells"
            :key="idx"
            class="aspect-square rounded-sm transition-colors"
            :class="getHeatmapColor(cell.count)"
            :title="`${cell.date}: ${cell.count} ${$t('analytics.activities')}`"
          ></div>
        </div>
        <div class="flex items-center gap-2 mt-3 justify-end">
          <span class="text-[10px] text-text-muted">{{ $t('analytics.less') }}</span>
          <div class="w-3 h-3 rounded-sm bg-white/5"></div>
          <div class="w-3 h-3 rounded-sm bg-wealth/20"></div>
          <div class="w-3 h-3 rounded-sm bg-wealth/40"></div>
          <div class="w-3 h-3 rounded-sm bg-wealth/70"></div>
          <div class="w-3 h-3 rounded-sm bg-wealth"></div>
          <span class="text-[10px] text-text-muted">{{ $t('analytics.more') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { portalApi } from '@/api'
import LoadingState from '@/components/LoadingState.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface ExpensePoint {
  label: string
  value: number
}

interface ProjectProgressItem {
  id: string
  title: string
  percentage: number
}

interface HeatmapCell {
  date: string
  count: number
}

const isLoading = ref(true)
const activePeriod = ref('30d')
const expenseData = ref<ExpensePoint[]>([])
const projectProgress = ref<ProjectProgressItem[]>([])
const docStats = ref({ uploaded: 0, pending: 0, signRate: 0 })
const invoiceStats = ref({ total: 0, paid: 0, unpaid: 0, overdue: 0 })
const heatmapCells = ref<HeatmapCell[]>([])

const chartWidth = 800
const chartHeight = 256
const chartPadding = 40

const periods = computed(() => [
  { value: '30d', label: t('analytics.period30d') },
  { value: '3m', label: t('analytics.period3m') },
  { value: '1y', label: t('analytics.period1y') },
  { value: 'all', label: t('analytics.periodAll') },
])

const expenseLabels = computed(() => expenseData.value.map(d => d.label))

const expensePoints = computed(() => {
  if (expenseData.value.length === 0) return []
  const maxVal = Math.max(...expenseData.value.map(d => d.value), 1)
  const plotW = chartWidth - 2 * chartPadding
  const plotH = chartHeight - 2 * chartPadding
  return expenseData.value.map((d, i) => ({
    x: chartPadding + (plotW * i) / Math.max(expenseData.value.length - 1, 1),
    y: chartPadding + plotH - (plotH * d.value) / maxVal,
  }))
})

const expenseLinePoints = computed(() => expensePoints.value.map(p => `${p.x},${p.y}`).join(' '))

const expenseAreaPoints = computed(() => {
  if (expensePoints.value.length === 0) return ''
  const plotH = chartHeight - 2 * chartPadding
  const line = expenseLinePoints.value
  const lastPt = expensePoints.value[expensePoints.value.length - 1]
  const firstPt = expensePoints.value[0]
  return `${line} ${lastPt.x},${chartPadding + plotH} ${firstPt.x},${chartPadding + plotH}`
})

onMounted(() => {
  loadAll()
})

watch(activePeriod, () => {
  loadAll()
})

async function loadAll() {
  isLoading.value = true
  try {
    const [overviewRes, expenseRes, progressRes, docRes, invoiceRes] = await Promise.all([
      portalApi.getAnalyticsOverview({ period: activePeriod.value }),
      portalApi.getExpenseTrend({ period: activePeriod.value }),
      portalApi.getProjectProgress(),
      portalApi.getDocumentStats(),
      portalApi.getInvoiceStats(),
    ])
    const overview = (overviewRes as any) || {}
    expenseData.value = (expenseRes as any).trend || (expenseRes as any) || []
    projectProgress.value = (progressRes as any).projects || (progressRes as any) || []
    docStats.value = (docRes as any) || { uploaded: 0, pending: 0, signRate: 0 }
    invoiceStats.value = (invoiceRes as any) || { total: 0, paid: 0, unpaid: 0, overdue: 0 }
    heatmapCells.value = buildHeatmap(overview.activities || [])
  } catch {
    ElMessage.error(t('analytics.loadError'))
  } finally {
    isLoading.value = false
  }
}

function buildHeatmap(activities: { date: string; count: number }[]): HeatmapCell[] {
  const cells: HeatmapCell[] = []
  const now = new Date()
  for (let i = 34; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const found = activities.find(a => a.date === dateStr)
    cells.push({ date: dateStr, count: found?.count || 0 })
  }
  return cells
}

function getHeatmapColor(count: number): string {
  if (count === 0) return 'bg-white/5'
  if (count <= 2) return 'bg-wealth/20'
  if (count <= 5) return 'bg-wealth/40'
  if (count <= 10) return 'bg-wealth/70'
  return 'bg-wealth'
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-SG', { style: 'currency', currency: 'SGD', minimumFractionDigits: 0 }).format(amount)
}
</script>
