<template>
  <div class="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-serif text-3xl text-text mb-2">{{ t('messages.title') }}</h1>
        <p class="text-sm text-text-muted">{{ t('messages.subtitle') }}</p>
      </div>
      <div class="flex items-center gap-3">
        <el-badge :value="unreadCount" :hidden="unreadCount === 0">
          <button class="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-text transition-colors">
            <component :is="Bell" class="w-5 h-5" />
          </button>
        </el-badge>
        <button
          @click="showNotifPrefs = true"
          class="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-text transition-colors"
          :title="t('messages.notifPrefs')"
        >
          <component :is="Settings" class="w-5 h-5" />
        </button>
        <button
          @click="markAllRead"
          :disabled="unreadCount === 0"
          class="px-4 py-2 text-sm font-medium text-wealth hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ t('messages.markAllRead') }}
        </button>
      </div>
    </div>

    <div class="flex border-b border-white/5">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="handleTabChange(tab.id)"
        class="bg-transparent px-6 py-3 text-sm font-medium border-b-2 transition-colors relative"
        :class="activeTab === tab.id ? 'text-wealth border-wealth bg-white/5' : 'text-text-muted border-transparent hover:text-text hover:bg-white/5'"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-loading="loading" class="min-h-[400px]">
      <div v-if="messages && messages.length > 0" class="space-y-3">
        <div
          v-for="msg in (messages || [])"
          :key="msg.id"
          class="group p-5 rounded-xl border transition-all duration-200 cursor-pointer"
          :class="!msg.isRead ? 'bg-glass/30 border-wealth/30' : 'bg-glass/10 border-white/5 hover:bg-glass/20'"
          @click="openMessage(msg)"
        >
          <div class="flex items-start gap-4">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-white/5"
              :class="getTypeColor(msg.type)"
            >
              <component :is="getIcon(msg.type)" class="w-5 h-5" />
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-start mb-1">
                <h3 class="font-medium text-text truncate pr-4" :class="{'font-bold': !msg.isRead}">
                  {{ msg.title || t('messages.noTitle') }}
                </h3>
                <span class="text-xs text-text-muted whitespace-nowrap">{{ formatTime(msg.createdAt) }}</span>
              </div>

              <p class="text-sm text-text-muted line-clamp-2 mb-2">{{ msg.content || t('messages.noContent') }}</p>

              <div class="flex items-center gap-3 text-xs">
                <span v-if="msg.sender" class="text-text-secondary">{{ t('messages.from') }} {{ msg.sender.name || t('messages.system') }}</span>
                <span v-if="msg.project" class="px-2 py-0.5 rounded bg-white/5 text-text-muted border border-white/10">
                  {{ msg.project.title }}
                </span>
              </div>
            </div>

            <div v-if="!msg.isRead" class="w-2 h-2 rounded-full bg-wealth shrink-0 mt-2"></div>
          </div>
        </div>
      </div>

      <div v-else class="py-16 text-center">
        <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
          <component :is="Bell" class="w-8 h-8 text-text-muted/50" />
        </div>
        <p class="text-text-muted mb-2">{{ activeTab === 'unread' ? t('messages.noUnread') : t('messages.noMessages') }}</p>
        <p class="text-xs text-text-muted/50 mb-6">{{ activeTab === 'unread' ? t('messages.allReadCongrats') : t('messages.notificationHint') }}</p>
        <button
          v-if="activeTab !== 'unread'"
          @click="$router.push('/projects')"
          class="inline-flex items-center gap-2 px-6 py-2.5 bg-wealth hover:bg-[#B49248] text-obsidian rounded font-bold text-sm transition-all active:scale-95"
        >
          <component :is="Folder" class="w-4 h-4" />
          {{ t('messages.viewMyProjects') }}
        </button>
      </div>

      <div v-if="total > limit" class="flex justify-center mt-8">
        <el-pagination
          v-model:current-page="page"
          :page-size="limit"
          :total="total"
          layout="prev, pager, next"
          @current-change="loadMessages"
          class="!bg-transparent"
        />
      </div>
    </div>

    <el-dialog v-model="showDetail" :title="selectedMessage?.title" width="600px" class="!bg-obsidian !border-white/10 !text-text rounded-xl">
      <div v-if="selectedMessage" class="space-y-6">
        <div class="flex items-center gap-4 pb-4 border-b border-white/10">
          <el-avatar :size="40" class="ring-2 ring-white/10">{{ selectedMessage.sender?.name?.[0] }}</el-avatar>
          <div class="flex-1">
            <div class="font-medium text-text">{{ selectedMessage.sender?.name || t('messages.system') }}</div>
            <div class="text-xs text-text-muted">{{ formatDateTime(selectedMessage.createdAt) }}</div>
          </div>
          <span class="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider bg-white/5 text-text-muted border border-white/10">
            {{ getTypeLabel(selectedMessage.type) }}
          </span>
        </div>

        <div class="text-sm text-text leading-relaxed whitespace-pre-line">
          {{ selectedMessage.content }}
        </div>

        <div v-if="selectedMessage.project" class="pt-4 border-t border-white/10">
          <button @click="goToProject(selectedMessage.project.id)" class="flex items-center gap-2 text-sm text-wealth hover:text-white transition-colors">
            <component :is="Folder" class="w-4 h-4" /> {{ t('messages.viewProject') }} {{ selectedMessage.project.title }}
          </button>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3 pt-4 border-t border-white/5">
          <button
            @click="deleteMessage"
            class="px-5 py-2.5 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded transition-colors"
          >
            {{ t('common.delete') }}
          </button>
          <button
            @click="showDetail = false"
            class="px-6 py-2.5 bg-wealth hover:bg-[#B49248] text-obsidian rounded font-bold text-sm transition-all active:scale-95"
          >
            {{ t('common.cancel') }}
          </button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="showNotifPrefs" :title="t('messages.notifPrefsTitle')" width="480px" class="!bg-obsidian !border-white/10 !text-text rounded-xl">
      <div class="space-y-6">
        <div class="p-4 rounded-xl bg-glass/20 border border-white/5">
          <div class="flex items-center justify-between mb-3">
            <div>
              <div class="text-sm font-medium text-text">{{ t('messages.browserPush') }}</div>
              <div class="text-xs text-text-muted">{{ t('messages.browserPushDesc') }}</div>
            </div>
            <el-switch v-model="notifPrefs.browserPush" active-color="#D6B56E" @change="handleBrowserNotifToggle" />
          </div>
          <div v-if="browserNotifStatus === 'denied'" class="text-xs text-red-400 mt-2">
            {{ t('messages.browserNotifDenied') }}
          </div>
          <div v-else-if="browserNotifStatus === 'default'" class="text-xs text-text-muted mt-2">
            {{ t('messages.browserNotifDefault') }}
          </div>
        </div>

        <div class="space-y-4">
          <h3 class="text-sm font-bold text-text uppercase tracking-wider">{{ t('messages.notifTypeBreakdown') }}</h3>

          <div class="flex items-center justify-between py-2">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center">
                <component :is="Folder" class="w-4 h-4" />
              </div>
              <div>
                <div class="text-sm text-text">{{ t('messages.projectUpdate') }}</div>
                <div class="text-xs text-text-muted">{{ t('messages.projectUpdateDesc') }}</div>
              </div>
            </div>
            <el-switch v-model="notifPrefs.projectUpdate" active-color="#D6B56E" @change="saveNotifPrefs" />
          </div>

          <div class="flex items-center justify-between py-2">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
                <component :is="Document" class="w-4 h-4" />
              </div>
              <div>
                <div class="text-sm text-text">{{ t('messages.documentReminder') }}</div>
                <div class="text-xs text-text-muted">{{ t('messages.documentReminderDesc') }}</div>
              </div>
            </div>
            <el-switch v-model="notifPrefs.documentReminder" active-color="#D6B56E" @change="saveNotifPrefs" />
          </div>

          <div class="flex items-center justify-between py-2">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
                <component :is="CreditCard" class="w-4 h-4" />
              </div>
              <div>
                <div class="text-sm text-text">{{ t('messages.paymentReminder') }}</div>
                <div class="text-xs text-text-muted">{{ t('messages.paymentReminderDesc') }}</div>
              </div>
            </div>
            <el-switch v-model="notifPrefs.paymentReminder" active-color="#D6B56E" @change="saveNotifPrefs" />
          </div>

          <div class="flex items-center justify-between py-2">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <component :is="Bell" class="w-4 h-4" />
              </div>
              <div>
                <div class="text-sm text-text">{{ t('messages.systemNotif') }}</div>
                <div class="text-xs text-text-muted">{{ t('messages.systemNotifDesc') }}</div>
              </div>
            </div>
            <el-switch v-model="notifPrefs.systemNotif" active-color="#D6B56E" @change="saveNotifPrefs" />
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end pt-4 border-t border-white/5">
          <button @click="showNotifPrefs = false" class="px-6 py-2.5 bg-wealth hover:bg-[#B49248] text-obsidian rounded font-bold text-sm transition-all active:scale-95">
            {{ t('messages.done') }}
          </button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="showHistory" :title="t('messages.notifHistory')" width="600px" class="!bg-obsidian !border-white/10 !text-text rounded-xl">
      <div class="space-y-3 max-h-[60vh] overflow-y-auto">
        <div v-if="notifHistory.length === 0" class="py-8 text-center text-text-muted text-sm">
          {{ t('messages.noNotifHistory') }}
        </div>
        <div
          v-for="item in notifHistory"
          :key="item.id"
          class="p-3 rounded-lg bg-white/5 border border-white/5"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-medium text-text">{{ item.title }}</span>
            <span class="text-[10px] text-text-muted">{{ formatTime(item.timestamp) }}</span>
          </div>
          <p class="text-xs text-text-muted">{{ item.body }}</p>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-between pt-4 border-t border-white/5">
          <button @click="clearHistory" :disabled="notifHistory.length === 0" class="px-4 py-2 text-sm text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded transition-colors disabled:opacity-50">
            {{ t('messages.clearHistory') }}
          </button>
          <button @click="showHistory = false" class="px-6 py-2.5 bg-wealth hover:bg-[#B49248] text-obsidian rounded font-bold text-sm transition-all active:scale-95">
            {{ t('common.cancel') }}
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import type { Component } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Bell, Folder, FileText as Document, CreditCard, MessageSquare as ChatLineRound, Settings } from 'lucide-vue-next'
import { portalApi } from '@/api'
import type { PortalMessage } from '@tonghai/shared'

interface NotifHistoryItem {
  id: string
  title: string
  body: string
  timestamp: string
  type?: string
}

const router = useRouter()
const { t } = useI18n()

const loading = ref(false)
const activeTab = ref('all')
const messages = ref<PortalMessage[]>([])
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const unreadCount = ref(0)

const showDetail = ref(false)
const selectedMessage = ref<PortalMessage | null>(null)
const showNotifPrefs = ref(false)
const showHistory = ref(false)
const browserNotifStatus = ref<NotificationPermission>('default')

const notifPrefs = reactive({
  browserPush: false,
  projectUpdate: true,
  documentReminder: true,
  paymentReminder: true,
  systemNotif: true,
})

const notifHistory = ref<NotifHistoryItem[]>([])
let pollTimer: ReturnType<typeof setInterval> | null = null

const tabs = computed(() => [
  { id: 'all', label: t('messages.tabAll') },
  { id: 'unread', label: t('messages.tabUnread') },
  { id: 'PROJECT', label: t('messages.tabProject') },
  { id: 'DOCUMENT', label: t('messages.tabDocument') },
  { id: 'PAYMENT', label: t('messages.tabPayment') },
  { id: 'SYSTEM', label: t('messages.tabSystem') }
])

async function loadMessages(): Promise<void> {
  loading.value = true
  try {
    const params: Record<string, string | number | boolean> = { page: page.value, limit: limit.value }

    if (activeTab.value === 'unread') {
      params.isRead = false
    } else if (['PROJECT', 'SYSTEM', 'DOCUMENT', 'PAYMENT'].includes(activeTab.value)) {
      params.type = activeTab.value
    }

    const result = await portalApi.getMessages(params as Parameters<typeof portalApi.getMessages>[0])
    messages.value = result.messages || []
    total.value = result.total || 0
  } catch (error: unknown) {
    ElMessage.error((error as Error).message || t('messages.loadError'))
  } finally {
    loading.value = false
  }
}

async function loadUnreadCount(): Promise<void> {
  try {
    const result = await portalApi.getUnreadCount()
    const newCount = result.count || 0
    if (newCount > unreadCount.value && unreadCount.value > 0) {
      const diff = newCount - unreadCount.value
      const latestMsgs = messages.value.filter(m => !m.isRead).slice(0, diff)
      for (const msg of latestMsgs) {
        pushBrowserNotification(msg.title || t('messages.noTitle'), msg.content || '', msg.type)
        addToHistory(msg.title || t('messages.noTitle'), msg.content || '', msg.type)
      }
    }
    unreadCount.value = newCount
  } catch {
    // ignore
  }
}

function handleTabChange(tabId: string): void {
  activeTab.value = tabId
  page.value = 1
  loadMessages()
}

async function openMessage(msg: PortalMessage): Promise<void> {
  selectedMessage.value = msg
  showDetail.value = true

  if (!msg.isRead) {
    try {
      await portalApi.markMessageAsRead(msg.id)
      msg.isRead = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch {
      // ignore
    }
  }
}

async function markAllRead(): Promise<void> {
  try {
    await portalApi.markAllMessagesAsRead()
    messages.value.forEach(m => m.isRead = true)
    unreadCount.value = 0
    ElMessage.success(t('messages.markAllReadSuccess'))
  } catch (error: unknown) {
    ElMessage.error((error as Error).message || t('messages.operationError'))
  }
}

async function deleteMessage(): Promise<void> {
  if (!selectedMessage.value) return

  try {
    await ElMessageBox.confirm(t('messages.deleteConfirmMsg'), t('messages.deleteConfirmTitle'), {
      type: 'warning',
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel'),
      confirmButtonClass: '!bg-red-500 !border-red-500',
      cancelButtonClass: '!text-text-muted hover:!text-text'
    })
    await portalApi.deleteMessage(selectedMessage.value.id)
    messages.value = messages.value.filter(m => m.id !== selectedMessage.value?.id)
    showDetail.value = false
    ElMessage.success(t('messages.deleteSuccess'))
  } catch (error: unknown) {
    if (error !== 'cancel') {
      ElMessage.error((error as Error).message || t('messages.deleteError'))
    }
  }
}

function goToProject(projectId: string): void {
  showDetail.value = false
  router.push(`/projects/${projectId}`)
}

function pushBrowserNotification(title: string, body: string, type?: string): void {
  if (!notifPrefs.browserPush || browserNotifStatus.value !== 'granted') return
  if (type === 'PROJECT' && !notifPrefs.projectUpdate) return
  if (type === 'DOCUMENT' && !notifPrefs.documentReminder) return
  if (type === 'PAYMENT' && !notifPrefs.paymentReminder) return
  if (type === 'SYSTEM' && !notifPrefs.systemNotif) return

  try {
    const notif = new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: `thny-msg-${Date.now()}`,
    })
    notif.onclick = () => {
      window.focus()
      notif.close()
    }
  } catch {
    // ignore
  }
}

function addToHistory(title: string, body: string, type?: string): void {
  notifHistory.value.unshift({
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    body,
    timestamp: new Date().toISOString(),
    type,
  })
  if (notifHistory.value.length > 50) {
    notifHistory.value = notifHistory.value.slice(0, 50)
  }
  try {
    localStorage.setItem('thny_notif_history', JSON.stringify(notifHistory.value))
  } catch {
    // ignore
  }
}

function loadHistory(): void {
  try {
    const saved = localStorage.getItem('thny_notif_history')
    if (saved) {
      notifHistory.value = JSON.parse(saved)
    }
  } catch {
    // ignore
  }
}

function clearHistory(): void {
  notifHistory.value = []
  localStorage.removeItem('thny_notif_history')
}

async function handleBrowserNotifToggle(enabled: boolean): Promise<void> {
  if (enabled) {
    if (!('Notification' in window)) {
      ElMessage.warning(t('messages.browserNotifUnsupported'))
      notifPrefs.browserPush = false
      return
    }
    const permission = await Notification.requestPermission()
    browserNotifStatus.value = permission
    if (permission !== 'granted') {
      notifPrefs.browserPush = false
      ElMessage.warning(t('messages.browserNotifDenied2'))
      return
    }
  }
  saveNotifPrefs()
}

async function saveNotifPrefs(): Promise<void> {
  try {
    await portalApi.updatePreferences({
      email: notifPrefs.projectUpdate,
      sms: notifPrefs.paymentReminder,
      projectUpdate: notifPrefs.projectUpdate,
      documentReminder: notifPrefs.documentReminder,
    } as any)
    localStorage.setItem('thny_notif_prefs', JSON.stringify(notifPrefs))
  } catch {
    // ignore
  }
}

function loadNotifPrefs(): void {
  try {
    const saved = localStorage.getItem('thny_notif_prefs')
    if (saved) {
      Object.assign(notifPrefs, JSON.parse(saved))
    }
  } catch {
    // ignore
  }
  if ('Notification' in window) {
    browserNotifStatus.value = Notification.permission
    notifPrefs.browserPush = Notification.permission === 'granted'
  }
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return t('messages.justNow')
  if (diff < 3600000) return t('messages.minutesAgo', { n: Math.floor(diff / 60000) })
  if (diff < 86400000) return t('messages.hoursAgo', { n: Math.floor(diff / 3600000) })
  if (diff < 604800000) return t('messages.daysAgo', { n: Math.floor(diff / 86400000) })

  return date.toLocaleDateString('zh-CN')
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN')
}

function getTypeLabel(type: string): string {
  const map: Record<string, string> = {
    SYSTEM: t('messages.typeSystem'),
    PROJECT: t('messages.typeProject'),
    DOCUMENT: t('messages.typeDocument'),
    PAYMENT: t('messages.typePayment'),
    REMINDER: t('messages.typeReminder'),
    ANNOUNCEMENT: t('messages.typeAnnouncement'),
  }
  return map[type] || type
}

function getIcon(type: string): Component {
  const map: Record<string, Component> = {
    SYSTEM: Bell,
    PROJECT: Folder,
    DOCUMENT: Document,
    PAYMENT: CreditCard,
  }
  return map[type] || ChatLineRound
}

function getTypeColor(type: string): string {
  const map: Record<string, string> = {
    SYSTEM: 'bg-blue-500/10 text-blue-400',
    PROJECT: 'bg-green-500/10 text-green-400',
    DOCUMENT: 'bg-orange-500/10 text-orange-400',
    PAYMENT: 'bg-red-500/10 text-red-400',
  }
  return map[type] || 'bg-white/5 text-text-muted'
}

onMounted(() => {
  loadMessages()
  loadUnreadCount()
  loadNotifPrefs()
  loadHistory()

  pollTimer = setInterval(() => {
    loadUnreadCount()
  }, 30000)
})

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
})
</script>
