<template>
  <div class="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
    <div class="flex items-center gap-4">
      <button @click="$router.push('/support')" class="p-2 rounded-lg bg-glass/20 border border-white/10 hover:bg-glass/30 hover:border-wealth/30 transition-all">
        <component :is="ArrowLeft" class="w-5 h-5 text-text-muted" />
      </button>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-3 mb-1">
          <span class="text-xs font-mono text-wealth">{{ ticket?.ticketNo }}</span>
          <span v-if="ticket" class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border" :class="getStatusClass(ticket.status)">{{ getStatusLabel(ticket.status) }}</span>
        </div>
        <h1 class="font-serif text-2xl text-text truncate">{{ ticket?.title }}</h1>
      </div>
      <button v-if="ticket && ticket.status !== 'closed'" @click="handleClose" :disabled="isClosing" class="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-50">
        {{ $t('support.closeTicket') }}
      </button>
    </div>

    <LoadingState v-if="isLoading" :text="$t('common.loading')" />

    <div v-else-if="ticket" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-6">
        <div class="rounded-xl bg-glass/20 border border-white/5 p-6 space-y-4">
          <div class="flex items-center gap-4 text-sm">
            <span class="text-text-muted">{{ $t('support.formType') }}:</span>
            <span class="text-text">{{ getTypeLabel(ticket.type) }}</span>
            <span class="text-text-muted ml-4">{{ $t('support.formPriority') }}:</span>
            <span class="text-text">{{ getPriorityLabel(ticket.priority) }}</span>
            <span class="text-text-muted ml-4">{{ $t('support.createdAt') }}:</span>
            <span class="text-text">{{ formatDate(ticket.createdAt) }}</span>
          </div>
          <div class="border-t border-white/5 pt-4">
            <p class="text-sm text-text-muted leading-relaxed">{{ ticket.description }}</p>
          </div>
        </div>

        <div class="space-y-4">
          <h3 class="text-sm uppercase tracking-wider text-text-muted font-bold">{{ $t('support.conversation') }}</h3>
          <div class="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            <div
              v-for="msg in messages"
              :key="msg.id"
              class="flex gap-3"
              :class="msg.isCustomer ? 'flex-row' : 'flex-row-reverse'"
            >
              <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                :class="msg.isCustomer ? 'bg-wealth/20 text-wealth' : 'bg-blue-500/20 text-blue-400'">
                {{ msg.isCustomer ? t('support.me') : t('support.agent') }}
              </div>
              <div class="max-w-[70%] rounded-xl p-4"
                :class="msg.isCustomer ? 'bg-wealth/10 border border-wealth/20' : 'bg-blue-500/10 border border-blue-500/20'">
                <p class="text-sm text-text leading-relaxed">{{ msg.content }}</p>
                <span class="text-[10px] text-text-muted mt-2 block">{{ formatMessageTime(msg.createdAt) }}</span>
              </div>
            </div>
          </div>

          <div v-if="ticket.status !== 'closed'" class="flex gap-3">
            <input
              v-model="replyContent"
              type="text"
              class="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-text text-sm focus:outline-none focus:border-wealth/50 transition-colors"
              :placeholder="$t('support.replyPlaceholder')"
              @keyup.enter="handleReply"
            />
            <button @click="handleReply" :disabled="isReplying || !replyContent.trim()" class="px-5 py-2.5 bg-gradient-to-r from-wealth to-[#B49248] text-obsidian text-sm font-bold rounded-lg shadow-lg shadow-wealth/20 transition-all disabled:opacity-50 disabled:grayscale">
              {{ $t('support.send') }}
            </button>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="rounded-xl bg-glass/20 border border-white/5 p-6">
          <h3 class="font-serif text-lg text-text mb-4">{{ $t('support.ticketInfo') }}</h3>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-text-muted">{{ $t('support.formType') }}</span>
              <span class="text-text">{{ getTypeLabel(ticket.type) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-text-muted">{{ $t('support.formPriority') }}</span>
              <span class="text-text">{{ getPriorityLabel(ticket.priority) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-text-muted">{{ $t('support.status') }}</span>
              <span class="text-text">{{ getStatusLabel(ticket.status) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-text-muted">{{ $t('support.createdAt') }}</span>
              <span class="text-text">{{ formatDate(ticket.createdAt) }}</span>
            </div>
            <div v-if="ticket.resolvedAt" class="flex justify-between">
              <span class="text-text-muted">{{ $t('support.resolvedAt') }}</span>
              <span class="text-text">{{ formatDate(ticket.resolvedAt) }}</span>
            </div>
          </div>
        </div>

        <div v-if="ticket.status === 'resolved' && !ticket.rating" class="rounded-xl bg-glass/20 border border-wealth/20 p-6">
          <h3 class="font-serif text-lg text-text mb-4">{{ $t('support.rateTitle') }}</h3>
          <div class="flex gap-2 mb-4 justify-center">
            <button
              v-for="star in 5"
              :key="star"
              @click="rating = star"
              class="text-2xl transition-all"
              :class="star <= rating ? 'text-wealth scale-110' : 'text-white/20 hover:text-wealth/50'"
            >
              ★
            </button>
          </div>
          <textarea v-model="ratingComment" rows="3" class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-wealth/50 transition-colors resize-none mb-3" :placeholder="$t('support.rateCommentPlaceholder')"></textarea>
          <button @click="handleRate" :disabled="isRating || rating === 0" class="w-full py-2 bg-gradient-to-r from-wealth to-[#B49248] text-obsidian text-sm font-bold rounded-lg shadow-lg shadow-wealth/20 transition-all disabled:opacity-50 disabled:grayscale">
            {{ $t('support.submitRating') }}
          </button>
        </div>

        <div v-if="ticket.rating" class="rounded-xl bg-glass/20 border border-white/5 p-6">
          <h3 class="font-serif text-lg text-text mb-3">{{ $t('support.yourRating') }}</h3>
          <div class="flex gap-1 mb-2 justify-center">
            <span v-for="star in 5" :key="star" class="text-xl" :class="star <= ticket.rating ? 'text-wealth' : 'text-white/20'">★</span>
          </div>
          <p v-if="ticket.ratingComment" class="text-sm text-text-muted text-center italic">"{{ ticket.ratingComment }}"</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from 'lucide-vue-next'
import { portalApi } from '@/api'
import { formatDate } from '@/utils/formatters'
import LoadingState from '@/components/LoadingState.vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
const route = useRoute()

interface TicketMessage {
  id: string
  content: string
  isCustomer: boolean
  createdAt: string
}

interface TicketDetail {
  id: string
  ticketNo: string
  title: string
  type: string
  priority: string
  status: string
  description: string
  createdAt: string
  resolvedAt?: string
  rating?: number
  ratingComment?: string
}

const isLoading = ref(true)
const isReplying = ref(false)
const isClosing = ref(false)
const isRating = ref(false)
const ticket = ref<TicketDetail | null>(null)
const messages = ref<TicketMessage[]>([])
const replyContent = ref('')
const rating = ref(0)
const ratingComment = ref('')

onMounted(async () => {
  const id = route.params.id as string
  try {
    const ticketRes = await portalApi.getTicket(id)
    const data = ticketRes as any
    ticket.value = data.ticket || data
    messages.value = data.messages || []
  } catch {
    ElMessage.error(t('support.loadError'))
  } finally {
    isLoading.value = false
  }
})

async function handleReply() {
  if (!replyContent.value.trim() || !ticket.value) return
  isReplying.value = true
  try {
    const res = await portalApi.replyTicket(ticket.value.id, replyContent.value)
    const msg = (res as any).message || { id: Date.now().toString(), content: replyContent.value, isCustomer: true, createdAt: new Date().toISOString() }
    messages.value.push(msg)
    replyContent.value = ''
  } catch {
    ElMessage.error(t('support.replyError'))
  } finally {
    isReplying.value = false
  }
}

async function handleClose() {
  if (!ticket.value) return
  isClosing.value = true
  try {
    await portalApi.closeTicket(ticket.value.id)
    ticket.value.status = 'closed'
    ElMessage.success(t('support.closeSuccess'))
  } catch {
    ElMessage.error(t('support.closeError'))
  } finally {
    isClosing.value = false
  }
}

async function handleRate() {
  if (!ticket.value || rating.value === 0) return
  isRating.value = true
  try {
    await portalApi.rateTicket(ticket.value.id, rating.value, ratingComment.value)
    ticket.value.rating = rating.value
    ticket.value.ratingComment = ratingComment.value
    ElMessage.success(t('support.rateSuccess'))
  } catch {
    ElMessage.error(t('support.rateError'))
  } finally {
    isRating.value = false
  }
}

function getTypeLabel(type: string): string {
  const map: Record<string, string> = { technical: t('support.typeTechnical'), account: t('support.typeAccount'), consultation: t('support.typeConsultation'), other: t('support.typeOther') }
  return map[type] || type
}

function getPriorityLabel(priority: string): string {
  const map: Record<string, string> = { low: t('support.priorityLow'), medium: t('support.priorityMedium'), high: t('support.priorityHigh'), urgent: t('support.priorityUrgent') }
  return map[priority] || priority
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = { pending: t('support.filterPending'), processing: t('support.filterProcessing'), resolved: t('support.filterResolved'), closed: t('support.filterClosed') }
  return map[status] || status
}

function getStatusClass(status: string): string {
  const map: Record<string, string> = { pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20', processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20', resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', closed: 'bg-gray-500/10 text-gray-400 border-gray-500/20' }
  return map[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'
}

function formatMessageTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleString(locale.value, { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}
</script>
