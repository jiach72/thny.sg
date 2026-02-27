<template>
  <div class="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-serif text-3xl text-text mb-2">消息中心</h1>
        <p class="text-sm text-text-muted">来自顾问团队的通知消息</p>
      </div>
      <div class="flex items-center gap-3">
        <el-badge :value="unreadCount" :hidden="unreadCount === 0">
          <button class="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-text transition-colors">
            <component :is="Bell" class="w-5 h-5" />
          </button>
        </el-badge>
        <button 
          @click="markAllRead" 
          :disabled="unreadCount === 0"
          class="px-4 py-2 text-sm font-medium text-wealth hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          全部标为已读
        </button>
      </div>
    </div>

    <!-- 标签页 -->
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

    <!-- 消息列表 -->
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
            <!-- 图标 -->
            <div 
              class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-white/5"
              :class="getTypeColor(msg.type)"
            >
              <component :is="getIcon(msg.type)" class="w-5 h-5" />
            </div>

            <!-- 内容 -->
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-start mb-1">
                <h3 class="font-medium text-text truncate pr-4" :class="{'font-bold': !msg.isRead}">
                  {{ msg.title || '无标题' }}
                </h3>
                <span class="text-xs text-text-muted whitespace-nowrap">{{ formatTime(msg.createdAt) }}</span>
              </div>
              
              <p class="text-sm text-text-muted line-clamp-2 mb-2">{{ msg.content || '无内容' }}</p>
              
              <div class="flex items-center gap-3 text-xs">
                <span v-if="msg.sender" class="text-text-secondary">来自: {{ msg.sender.name || '系统' }}</span>
                <span v-if="msg.project" class="px-2 py-0.5 rounded bg-white/5 text-text-muted border border-white/10">
                  {{ msg.project.title }}
                </span>
              </div>
            </div>

            <!-- 未读标记 -->
            <div v-if="!msg.isRead" class="w-2 h-2 rounded-full bg-wealth shrink-0 mt-2"></div>
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-else class="py-16 text-center">
        <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
          <component :is="Bell" class="w-8 h-8 text-text-muted/50" />
        </div>
        <p class="text-text-muted mb-2">{{ activeTab === 'unread' ? '没有未读消息' : '暂无消息' }}</p>
        <p class="text-xs text-text-muted/50 mb-6">{{ activeTab === 'unread' ? '所有消息已阅读，做得好！' : '顾问团队发送的通知将显示在这里' }}</p>
        <button 
          v-if="activeTab !== 'unread'"
          @click="$router.push('/projects')"
          class="inline-flex items-center gap-2 px-6 py-2.5 bg-wealth hover:bg-[#B49248] text-obsidian rounded font-bold text-sm transition-all active:scale-95"
        >
          <component :is="Folder" class="w-4 h-4" />
          查看我的项目
        </button>
      </div>

      <!-- 分页 -->
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

    <!-- 消息详情对话框 -->
    <el-dialog v-model="showDetail" :title="selectedMessage?.title" width="600px" class="!bg-obsidian !border-white/10 !text-text rounded-xl">
      <div v-if="selectedMessage" class="space-y-6">
        <div class="flex items-center gap-4 pb-4 border-b border-white/10">
          <el-avatar :size="40" class="ring-2 ring-white/10">{{ selectedMessage.sender?.name?.[0] }}</el-avatar>
          <div class="flex-1">
            <div class="font-medium text-text">{{ selectedMessage.sender?.name || '系统' }}</div>
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
            <component :is="Folder" class="w-4 h-4" /> 查看项目: {{ selectedMessage.project.title }}
          </button>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3 pt-4 border-t border-white/5">
          <button 
            @click="deleteMessage" 
            class="px-5 py-2.5 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded transition-colors"
          >
            删除
          </button>
          <button 
            @click="showDetail = false" 
            class="px-6 py-2.5 bg-wealth hover:bg-[#B49248] text-obsidian rounded font-bold text-sm transition-all active:scale-95"
          >
            关闭
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Component } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Bell, Folder, FileText as Document, CreditCard, MessageSquare as ChatLineRound } from 'lucide-vue-next'
import { portalApi } from '@/api'
import type { PortalMessage } from '@tonghai/shared'

const router = useRouter()

const loading = ref(false)
const activeTab = ref('all')
const messages = ref<PortalMessage[]>([])
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const unreadCount = ref(0)

const showDetail = ref(false)
const selectedMessage = ref<PortalMessage | null>(null)

const tabs = [
  { id: 'all', label: '全部消息' },
  { id: 'unread', label: '未读' },
  { id: 'PROJECT', label: '项目' },
  { id: 'SYSTEM', label: '系统' }
]

// 加载消息
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
    messages.value = result.data || []
    total.value = result.pagination?.total || 0
  } catch (error: unknown) {
    ElMessage.error((error as Error).message || '加载消息失败')
  } finally {
    loading.value = false
  }
}

// 加载未读数量
async function loadUnreadCount(): Promise<void> {
  try {
    const result = await portalApi.getUnreadCount()
    unreadCount.value = result.count || 0
  } catch {
    // 忽略
  }
}

function handleTabChange(tabId: string): void {
  activeTab.value = tabId
  page.value = 1
  loadMessages()
}

// 打开消息
async function openMessage(msg: PortalMessage): Promise<void> {
  selectedMessage.value = msg
  showDetail.value = true

  if (!msg.isRead) {
    try {
      await portalApi.markMessageAsRead(msg.id)
      msg.isRead = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch {
      // 忽略
    }
  }
}

// 全部标为已读
async function markAllRead(): Promise<void> {
  try {
    await portalApi.markAllMessagesAsRead()
    messages.value.forEach(m => m.isRead = true)
    unreadCount.value = 0
    ElMessage.success('已全部标为已读')
  } catch (error: unknown) {
    ElMessage.error((error as Error).message || '操作失败')
  }
}

// 删除消息
async function deleteMessage(): Promise<void> {
  if (!selectedMessage.value) return

  try {
    await ElMessageBox.confirm('确定要删除这条消息吗？', '确认删除', { 
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      confirmButtonClass: '!bg-red-500 !border-red-500',
      cancelButtonClass: '!text-text-muted hover:!text-text'
    })
    await portalApi.deleteMessage(selectedMessage.value.id)
    messages.value = messages.value.filter(m => m.id !== selectedMessage.value?.id)
    showDetail.value = false
    ElMessage.success('消息已删除')
  } catch (error: unknown) {
    if (error !== 'cancel') {
      ElMessage.error((error as Error).message || '删除失败')
    }
  }
}

function goToProject(projectId: string): void {
  showDetail.value = false
  router.push(`/projects/${projectId}`)
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`
  
  return date.toLocaleDateString('zh-CN')
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN')
}

function getTypeLabel(type: string): string {
  const map: Record<string, string> = {
    SYSTEM: '系统',
    PROJECT: '项目',
    DOCUMENT: '文档',
    PAYMENT: '付款',
    REMINDER: '提醒',
    ANNOUNCEMENT: '公告',
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
})
</script>
