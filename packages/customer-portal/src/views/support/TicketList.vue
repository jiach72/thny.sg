<template>
  <div class="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
    <div class="flex items-end justify-between">
      <div>
        <h1 class="font-serif text-3xl text-text mb-2">{{ $t('support.title') }}</h1>
        <p class="text-sm text-text-muted">{{ $t('support.subtitle') }}</p>
      </div>
      <button @click="showCreateDialog = true" class="px-6 py-2.5 bg-gradient-to-r from-wealth to-[#B49248] text-obsidian font-bold rounded-lg shadow-lg shadow-wealth/20 hover:shadow-wealth/40 transition-all active:scale-95">
        + {{ $t('support.createTicket') }}
      </button>
    </div>

    <div class="flex gap-2 overflow-x-auto pb-2">
      <button
        v-for="s in statusFilters"
        :key="s.value"
        @click="activeFilter = s.value"
        class="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
        :class="activeFilter === s.value ? 'bg-wealth text-obsidian shadow-lg shadow-wealth/20' : 'bg-glass/20 border border-white/10 text-text-muted hover:bg-glass/30 hover:text-text'"
      >
        {{ s.label }}
      </button>
    </div>

    <LoadingState v-if="isLoading" :text="$t('common.loading')" />

    <div v-else-if="filteredTickets.length > 0" class="space-y-4">
      <div
        v-for="ticket in filteredTickets"
        :key="ticket.id"
        class="group p-5 rounded-xl bg-glass/20 border border-white/5 hover:bg-glass/30 hover:border-wealth/30 transition-all duration-300 cursor-pointer"
        @click="$router.push(`/support/${ticket.id}`)"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3 mb-2">
              <span class="text-xs font-mono text-wealth">{{ ticket.ticketNo }}</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" :class="getTypeClass(ticket.type)">{{ getTypeLabel(ticket.type) }}</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" :class="getPriorityClass(ticket.priority)">{{ getPriorityLabel(ticket.priority) }}</span>
            </div>
            <h3 class="font-serif text-lg text-text group-hover:text-wealth transition-colors truncate">{{ ticket.title }}</h3>
          </div>
          <div class="flex flex-col items-end gap-2 shrink-0">
            <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border" :class="getStatusClass(ticket.status)">{{ getStatusLabel(ticket.status) }}</span>
            <span class="text-[10px] text-text-muted">{{ formatDate(ticket.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <EmptyState v-else icon="ticket" :title="$t('support.emptyTitle')" :description="$t('support.emptyDesc')" />

    <div v-if="showCreateDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-obsidian/80 backdrop-blur-sm" @click="showCreateDialog = false"></div>
      <div class="relative w-full max-w-lg bg-[#1c1c1c] border border-white/10 rounded-xl shadow-2xl p-6 space-y-5">
        <h2 class="font-serif text-xl text-text">{{ $t('support.createTicket') }}</h2>

        <div>
          <label class="block text-xs text-text-muted mb-1.5">{{ $t('support.formTitle') }}</label>
          <input v-model="form.title" type="text" class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-wealth/50 transition-colors" :placeholder="$t('support.formTitlePlaceholder')" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-text-muted mb-1.5">{{ $t('support.formType') }}</label>
            <select v-model="form.type" class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-wealth/50 transition-colors">
              <option value="technical">{{ $t('support.typeTechnical') }}</option>
              <option value="account">{{ $t('support.typeAccount') }}</option>
              <option value="consultation">{{ $t('support.typeConsultation') }}</option>
              <option value="other">{{ $t('support.typeOther') }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-text-muted mb-1.5">{{ $t('support.formPriority') }}</label>
            <select v-model="form.priority" class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-wealth/50 transition-colors">
              <option value="low">{{ $t('support.priorityLow') }}</option>
              <option value="medium">{{ $t('support.priorityMedium') }}</option>
              <option value="high">{{ $t('support.priorityHigh') }}</option>
              <option value="urgent">{{ $t('support.priorityUrgent') }}</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs text-text-muted mb-1.5">{{ $t('support.formDescription') }}</label>
          <textarea v-model="form.description" rows="4" class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-wealth/50 transition-colors resize-none" :placeholder="$t('support.formDescPlaceholder')"></textarea>
        </div>

        <div class="flex gap-3 justify-end pt-2">
          <button @click="showCreateDialog = false" class="px-4 py-2 bg-transparent rounded-lg text-sm text-text-muted hover:text-text hover:bg-white/5 transition-colors">{{ $t('common.cancel') }}</button>
          <button @click="handleCreate" :disabled="isCreating || !form.title.trim()" class="px-6 py-2 bg-gradient-to-r from-wealth to-[#B49248] text-obsidian text-sm font-bold rounded-lg shadow-lg shadow-wealth/20 transition-all disabled:opacity-50 disabled:grayscale">{{ $t('common.confirm') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { portalApi } from '@/api'
import { formatDate } from '@/utils/formatters'
import LoadingState from '@/components/LoadingState.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()

interface Ticket {
  id: string
  ticketNo: string
  title: string
  type: 'technical' | 'account' | 'consultation' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'processing' | 'resolved' | 'closed'
  createdAt: string
}

const isLoading = ref(true)
const isCreating = ref(false)
const tickets = ref<Ticket[]>([])
const activeFilter = ref('all')
const showCreateDialog = ref(false)

const form = ref({
  title: '',
  type: 'technical' as Ticket['type'],
  priority: 'medium' as Ticket['priority'],
  description: '',
})

const statusFilters = computed(() => [
  { value: 'all', label: t('support.filterAll') },
  { value: 'pending', label: t('support.filterPending') },
  { value: 'processing', label: t('support.filterProcessing') },
  { value: 'resolved', label: t('support.filterResolved') },
  { value: 'closed', label: t('support.filterClosed') },
])

const filteredTickets = computed(() => {
  if (activeFilter.value === 'all') return tickets.value
  return tickets.value.filter(t => t.status === activeFilter.value)
})

onMounted(async () => {
  try {
    const res = await portalApi.getTickets({ page: 1, limit: 50 })
    tickets.value = (res as any).tickets || (res as any) || []
  } catch {
    ElMessage.error(t('support.loadError'))
  } finally {
    isLoading.value = false
  }
})

async function handleCreate() {
  if (!form.value.title.trim()) return
  isCreating.value = true
  try {
    const res = await portalApi.createTicket(form.value)
    ElMessage.success(t('support.createSuccess'))
    showCreateDialog.value = false
    form.value = { title: '', type: 'technical', priority: 'medium', description: '' }
    const newTicket = (res as any).ticket || (res as any)
    if (newTicket?.id) {
      router.push(`/support/${newTicket.id}`)
    } else {
      const res2 = await portalApi.getTickets({ page: 1, limit: 50 })
      tickets.value = (res2 as any).tickets || (res2 as any) || []
    }
  } catch {
    ElMessage.error(t('support.createError'))
  } finally {
    isCreating.value = false
  }
}

function getTypeLabel(type: string): string {
  const map: Record<string, string> = {
    technical: t('support.typeTechnical'),
    account: t('support.typeAccount'),
    consultation: t('support.typeConsultation'),
    other: t('support.typeOther'),
  }
  return map[type] || type
}

function getTypeClass(type: string): string {
  const map: Record<string, string> = {
    technical: 'bg-blue-500/10 text-blue-400',
    account: 'bg-purple-500/10 text-purple-400',
    consultation: 'bg-emerald-500/10 text-emerald-400',
    other: 'bg-gray-500/10 text-gray-400',
  }
  return map[type] || 'bg-gray-500/10 text-gray-400'
}

function getPriorityLabel(priority: string): string {
  const map: Record<string, string> = {
    low: t('support.priorityLow'),
    medium: t('support.priorityMedium'),
    high: t('support.priorityHigh'),
    urgent: t('support.priorityUrgent'),
  }
  return map[priority] || priority
}

function getPriorityClass(priority: string): string {
  const map: Record<string, string> = {
    low: 'bg-gray-500/10 text-gray-400',
    medium: 'bg-blue-500/10 text-blue-400',
    high: 'bg-amber-500/10 text-amber-400',
    urgent: 'bg-red-500/10 text-red-400',
  }
  return map[priority] || 'bg-gray-500/10 text-gray-400'
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: t('support.filterPending'),
    processing: t('support.filterProcessing'),
    resolved: t('support.filterResolved'),
    closed: t('support.filterClosed'),
  }
  return map[status] || status
}

function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    closed: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  }
  return map[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'
}
</script>
