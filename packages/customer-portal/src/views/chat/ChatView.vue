<template>
  <div class="h-full flex animate-fade-in-up">
    <div class="w-72 shrink-0 border-r border-white/5 flex flex-col">
      <div class="p-4 border-b border-white/5">
        <h2 class="font-serif text-lg text-text">{{ t('chat.title') }}</h2>
      </div>
      <div class="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        <div v-if="loadingRooms" class="p-4 text-center text-text-muted text-sm">{{ t('common.loading') }}</div>
        <div v-else-if="rooms.length === 0" class="p-4 text-center text-text-muted text-sm">{{ t('chat.noRecords') }}</div>
        <div
          v-for="room in rooms"
          :key="room.id"
          class="px-4 py-3 cursor-pointer transition-colors border-l-2"
          :class="selectedRoomId === room.id ? 'bg-white/10 border-wealth' : 'border-transparent hover:bg-white/5'"
          @click="selectRoom(room)"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-text truncate">{{ room.visitorName || t('chat.consultationSession') }}</span>
            <span class="text-xs text-text-muted">{{ formatTime(room.createdAt) }}</span>
          </div>
          <p class="text-xs text-text-muted mt-1 truncate">{{ room.source === 'portal' ? t('chat.portalConsultation') : t('chat.websiteConsultation') }}</p>
        </div>
      </div>
      <div class="p-4 border-t border-white/5">
        <button
          @click="createNewRoom"
          class="w-full py-2.5 rounded-xl bg-wealth/20 hover:bg-wealth/30 text-wealth text-sm font-medium transition-colors border border-wealth/30"
        >
          {{ t('chat.newConsultation') }}
        </button>
      </div>
    </div>

    <div class="flex-1 flex flex-col min-w-0">
      <div v-if="!selectedRoomId" class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <component :is="MessageCircle" class="w-16 h-16 text-text-muted/30 mx-auto mb-4" />
          <p class="text-text-muted">{{ t('chat.selectConversation') }}</p>
        </div>
      </div>

      <template v-else>
        <div class="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 class="font-medium text-text">{{ currentRoom?.visitorName || t('chat.consultationSession') }}</h3>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full" :class="wsConnected ? 'bg-green-400' : 'bg-red-400'"></span>
              <p class="text-xs text-text-muted">{{ wsConnected ? t('chat.connected') : t('chat.disconnected') }}</p>
            </div>
          </div>
        </div>

        <div ref="messagesContainer" class="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
          <div v-if="loadingMessages" class="text-center text-text-muted text-sm py-8">{{ t('common.loading') }}</div>
          <template v-else>
            <div
              v-for="msg in messages"
              :key="msg.id"
              class="flex"
              :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[70%] px-4 py-2.5 rounded-2xl text-sm"
                :class="msg.role === 'user'
                  ? 'bg-wealth/20 text-text border border-wealth/20 rounded-br-md'
                  : 'bg-white/5 text-text border border-white/10 rounded-bl-md'"
              >
                <p class="whitespace-pre-wrap">{{ msg.content }}</p>
                <span class="block text-[10px] text-text-muted mt-1">{{ formatTime(msg.createdAt) }}</span>
              </div>
            </div>
          </template>
        </div>

        <div class="px-6 py-4 border-t border-white/5">
          <div class="flex items-center gap-3">
            <input
              v-model="inputMessage"
              @keyup.enter="sendMessage"
              :disabled="sending || currentRoom?.status !== 'active'"
              type="text"
              :placeholder="currentRoom?.status !== 'active' ? t('chat.sessionClosed') : t('chat.inputPlaceholder')"
              class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text placeholder-text-muted focus:outline-none focus:border-wealth/50 transition-colors disabled:opacity-50"
            />
            <button
              @click="sendMessage"
              :disabled="!inputMessage.trim() || sending || currentRoom?.status !== 'active'"
              class="p-2.5 rounded-xl bg-wealth/20 hover:bg-wealth/30 text-wealth border border-wealth/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <component :is="Send" class="w-5 h-5" />
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { portalApi } from '@/api'
import { useWebSocket } from '@/composables/useWebSocket'
import type { ChatMessageData } from '@/composables/useWebSocket'
import { MessageCircle, Send } from 'lucide-vue-next'

interface ChatRoom {
  id: string
  visitorId: string | null
  visitorName: string | null
  source: string
  status: string
  createdAt: string
}

interface ChatMsg {
  id: string
  content: string
  role: string
  createdAt: string
}

const { t } = useI18n()
const rooms = ref<ChatRoom[]>([])
const selectedRoomId = ref<string | null>(null)
const currentRoom = ref<ChatRoom | null>(null)
const messages = ref<ChatMsg[]>([])
const inputMessage = ref('')
const loadingRooms = ref(false)
const loadingMessages = ref(false)
const sending = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)

const { isConnected: wsConnected, lastMessage, sendMessage: wsSendMessage } = useWebSocket()

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const loadRooms = async () => {
  loadingRooms.value = true
  try {
    const res = await portalApi.getChatRooms()
    rooms.value = (res as any) || []
  } catch {
    rooms.value = []
  } finally {
    loadingRooms.value = false
  }
}

const loadMessages = async (roomId: string) => {
  loadingMessages.value = true
  try {
    const res = await portalApi.getChatMessages(roomId, { page: 1, limit: 50 })
    messages.value = (res as any)?.messages || []
    await scrollToBottom()
  } catch {
    messages.value = []
  } finally {
    loadingMessages.value = false
  }
}

const selectRoom = (room: ChatRoom) => {
  selectedRoomId.value = room.id
  currentRoom.value = room
  loadMessages(room.id)
}

const createNewRoom = async () => {
  try {
    const res = await portalApi.sendChatMessage('', t('chat.newConsultation'))
    const newRoom = { id: (res as any)?.sessionId || '', visitorName: null, source: 'portal', status: 'active', createdAt: new Date().toISOString(), visitorId: null }
    rooms.value.unshift(newRoom as ChatRoom)
    selectRoom(newRoom as ChatRoom)
  } catch {
    // ignore
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || !selectedRoomId.value || sending.value) return

  const content = inputMessage.value.trim()
  inputMessage.value = ''
  sending.value = true

  const optimisticMsg: ChatMsg = {
    id: `temp-${Date.now()}`,
    content,
    role: 'user',
    createdAt: new Date().toISOString(),
  }
  messages.value.push(optimisticMsg)
  await scrollToBottom()

  const sent = wsSendMessage(content)

  if (!sent) {
    try {
      const res = await portalApi.sendChatMessage(selectedRoomId.value!, content)
      if ((res as any)?.message) {
        messages.value.push({
          id: (res as any).id || `ai-${Date.now()}`,
          content: (res as any).message,
          role: 'assistant',
          createdAt: new Date().toISOString(),
        })
      }
      await scrollToBottom()
    } catch {
      // ignore
    }
  }

  sending.value = false
}

watch(lastMessage, (msg) => {
  if (!msg || !selectedRoomId.value) return

  if (msg.type === 'message' && msg.data) {
    const data = msg.data as ChatMessageData
    const exists = messages.value.some(m => m.id === data.id)
    if (!exists) {
      messages.value.push({
        id: data.id || `ws-${Date.now()}`,
        content: data.content || '',
        role: 'assistant',
        createdAt: data.createdAt || new Date().toISOString(),
      })
      scrollToBottom()
    }
  }
})

watch(selectedRoomId, () => {
  if (selectedRoomId.value) {
    loadMessages(selectedRoomId.value)
  }
})

onMounted(() => {
  loadRooms()
})
</script>
