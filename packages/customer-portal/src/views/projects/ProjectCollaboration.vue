<template>
  <div class="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
    <div class="flex items-end justify-between">
      <div>
        <h1 class="font-serif text-3xl text-text mb-2">{{ $t('collaboration.title') }}</h1>
        <p class="text-sm text-text-muted">{{ $t('collaboration.subtitle') }}</p>
      </div>
      <select v-model="projectId" @change="loadAll" class="bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-text text-sm focus:outline-none focus:border-wealth/50 transition-colors min-w-[200px]">
        <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.title }}</option>
      </select>
    </div>

    <LoadingState v-if="isLoading" :text="$t('common.loading')" />

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm uppercase tracking-wider text-text-muted font-bold flex items-center gap-2">
            <component :is="MessageSquare" class="w-4 h-4 text-wealth" />
            {{ $t('collaboration.discussion') }}
          </h3>
        </div>
        <div class="rounded-xl bg-glass/20 border border-white/5 p-4 flex flex-col" style="height: 600px">
          <div class="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
            <div
              v-for="msg in discussions"
              :key="msg.id"
              class="p-3 rounded-lg bg-glass/20 border border-white/5"
            >
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-medium text-wealth">{{ msg.senderName }}</span>
                <span class="text-[10px] text-text-muted">{{ formatTime(msg.createdAt) }}</span>
              </div>
              <p class="text-sm text-text leading-relaxed" v-html="renderMentions(msg.content)"></p>
              <div v-if="msg.attachments && msg.attachments.length > 0" class="mt-2 flex flex-wrap gap-2">
                <a v-for="att in msg.attachments" :key="att.name" :href="att.url" class="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/5 text-xs text-wealth hover:bg-white/10 transition-colors">
                  <component :is="Paperclip" class="w-3 h-3" />
                  {{ att.name }}
                </a>
              </div>
            </div>
            <div v-if="discussions.length === 0" class="flex items-center justify-center h-full">
              <p class="text-xs text-text-muted">{{ $t('collaboration.noDiscussion') }}</p>
            </div>
          </div>
          <div class="flex gap-2">
            <input
              v-model="discussionInput"
              type="text"
              class="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-wealth/50 transition-colors"
              :placeholder="$t('collaboration.discussionPlaceholder')"
              @keyup.enter="sendDiscussion"
            />
            <button @click="sendDiscussion" :disabled="isSendingMsg || !discussionInput.trim()" class="px-4 py-2 bg-gradient-to-r from-wealth to-[#B49248] text-obsidian text-sm font-bold rounded-lg shadow-lg shadow-wealth/20 transition-all disabled:opacity-50 disabled:grayscale">
              {{ $t('collaboration.send') }}
            </button>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm uppercase tracking-wider text-text-muted font-bold flex items-center gap-2">
            <component :is="FolderOpen" class="w-4 h-4 text-wealth" />
            {{ $t('collaboration.files') }}
          </h3>
          <label class="px-3 py-1.5 bg-wealth/10 border border-wealth/20 text-wealth text-xs font-medium rounded-lg hover:bg-wealth/20 transition-colors cursor-pointer">
            + {{ $t('collaboration.upload') }}
            <input type="file" class="hidden" @change="handleUpload" :disabled="isUploading" />
          </label>
        </div>
        <div class="rounded-xl bg-glass/20 border border-white/5 p-4 space-y-2" style="height: 600px; overflow-y: auto">
          <div
            v-for="file in files"
            :key="file.id"
            class="flex items-center gap-3 p-3 rounded-lg bg-glass/20 border border-white/5 hover:border-wealth/30 transition-all"
          >
            <div class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
              <component :is="FileIcon" class="w-4 h-4 text-wealth" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-text truncate">{{ file.name }}</p>
              <p class="text-[10px] text-text-muted">{{ file.uploaderName }} · {{ formatTime(file.createdAt) }} · {{ formatSize(file.size) }}</p>
            </div>
            <button @click="downloadFile(file)" class="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
              <component :is="Download" class="w-4 h-4 text-text-muted hover:text-wealth" />
            </button>
          </div>
          <div v-if="files.length === 0" class="flex items-center justify-center h-32">
            <p class="text-xs text-text-muted">{{ $t('collaboration.noFiles') }}</p>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm uppercase tracking-wider text-text-muted font-bold flex items-center gap-2">
            <component :is="CheckCircle" class="w-4 h-4 text-wealth" />
            {{ $t('collaboration.approvals') }}
          </h3>
        </div>
        <div class="rounded-xl bg-glass/20 border border-white/5 p-4 space-y-3" style="height: 600px; overflow-y: auto">
          <div
            v-for="approval in approvals"
            :key="approval.id"
            class="p-4 rounded-lg bg-glass/20 border border-white/5"
          >
            <div class="flex items-start justify-between gap-2 mb-2">
              <h4 class="text-sm font-medium text-text">{{ approval.title }}</h4>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0" :class="getApprovalStatusClass(approval.status)">{{ getApprovalStatusLabel(approval.status) }}</span>
            </div>
            <p class="text-xs text-text-muted mb-2">{{ approval.approverName }} · {{ formatTime(approval.createdAt) }}</p>
            <div v-if="approval.status === 'pending'" class="flex gap-2">
              <button @click="submitApproval(approval.id, 'approve')" :disabled="approval.submitting" class="flex-1 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium rounded-lg hover:bg-emerald-500/20 transition-all disabled:opacity-50">
                {{ $t('collaboration.approve') }}
              </button>
              <button @click="showRejectDialog(approval.id)" :disabled="approval.submitting" class="flex-1 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-50">
                {{ $t('collaboration.reject') }}
              </button>
            </div>
            <p v-if="approval.comment" class="text-xs text-text-muted mt-2 italic">"{{ approval.comment }}"</p>
          </div>
          <div v-if="approvals.length === 0" class="flex items-center justify-center h-32">
            <p class="text-xs text-text-muted">{{ $t('collaboration.noApprovals') }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="rejectDialogVisible" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-obsidian/80 backdrop-blur-sm" @click="rejectDialogVisible = false"></div>
      <div class="relative w-full max-w-sm bg-[#1c1c1c] border border-white/10 rounded-xl shadow-2xl p-6 space-y-4">
        <h3 class="font-serif text-lg text-text">{{ $t('collaboration.rejectReason') }}</h3>
        <textarea v-model="rejectComment" rows="3" class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-wealth/50 transition-colors resize-none" :placeholder="$t('collaboration.rejectPlaceholder')"></textarea>
        <div class="flex gap-3 justify-end">
          <button @click="rejectDialogVisible = false" class="px-4 py-2 bg-transparent rounded-lg text-sm text-text-muted hover:text-text hover:bg-white/5 transition-colors">{{ $t('common.cancel') }}</button>
          <button @click="confirmReject" class="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium rounded-lg hover:bg-red-500/30 transition-all">{{ $t('collaboration.reject') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { MessageSquare, FolderOpen, CheckCircle, Paperclip, Download, FileText as FileIcon } from 'lucide-vue-next'
import { portalApi } from '@/api'
import LoadingState from '@/components/LoadingState.vue'
import { useI18n } from 'vue-i18n'
import { sanitizeHtml } from '@/utils/sanitize'

const { t } = useI18n()
const route = useRoute()

interface DiscussionMessage {
  id: string
  content: string
  senderName: string
  createdAt: string
  attachments?: { name: string; url: string }[]
}

interface SharedFile {
  id: string
  name: string
  uploaderName: string
  createdAt: string
  size: number
  url?: string
}

interface ApprovalItem {
  id: string
  title: string
  approverName: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  comment?: string
  submitting?: boolean
}

interface ProjectOption {
  id: string
  title: string
}

const isLoading = ref(true)
const isSendingMsg = ref(false)
const isUploading = ref(false)
const projects = ref<ProjectOption[]>([])
const projectId = ref('')
const discussions = ref<DiscussionMessage[]>([])
const files = ref<SharedFile[]>([])
const approvals = ref<ApprovalItem[]>([])
const discussionInput = ref('')
const rejectDialogVisible = ref(false)
const rejectComment = ref('')
const rejectingApprovalId = ref('')

onMounted(async () => {
  try {
    const res = await portalApi.getMyProjects()
    const list = (res as any) || []
    projects.value = list.map((p: any) => ({ id: p.id, title: p.title }))
    const routeId = route.params.id as string
    if (routeId) {
      projectId.value = routeId
    } else if (projects.value.length > 0) {
      projectId.value = projects.value[0].id
    }
    if (projectId.value) {
      await loadAll()
    }
  } catch {
    ElMessage.error(t('collaboration.loadError'))
  } finally {
    isLoading.value = false
  }
})

async function loadAll() {
  if (!projectId.value) return
  isLoading.value = true
  try {
    const [discRes, fileRes, apprRes] = await Promise.all([
      portalApi.getProjectDiscussions(projectId.value),
      portalApi.getProjectFiles(projectId.value),
      portalApi.getProjectApprovals(projectId.value),
    ])
    discussions.value = (discRes as any).messages || (discRes as any) || []
    files.value = (fileRes as any).files || (fileRes as any) || []
    approvals.value = ((apprRes as any).approvals || (apprRes as any) || []).map((a: any) => ({ ...a, submitting: false }))
  } catch {
    ElMessage.error(t('collaboration.loadError'))
  } finally {
    isLoading.value = false
  }
}

async function sendDiscussion() {
  if (!discussionInput.value.trim() || !projectId.value) return
  isSendingMsg.value = true
  try {
    const res = await portalApi.sendDiscussionMessage(projectId.value, { content: discussionInput.value })
    const msg = (res as any).message || { id: Date.now().toString(), content: discussionInput.value, senderName: '我', createdAt: new Date().toISOString() }
    discussions.value.push(msg)
    discussionInput.value = ''
  } catch {
    ElMessage.error(t('collaboration.sendError'))
  } finally {
    isSendingMsg.value = false
  }
}

async function handleUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || !projectId.value) return
  isUploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    await portalApi.uploadProjectFile(projectId.value, formData)
    ElMessage.success(t('collaboration.uploadSuccess'))
    const fileRes = await portalApi.getProjectFiles(projectId.value)
    files.value = (fileRes as any).files || (fileRes as any) || []
  } catch {
    ElMessage.error(t('collaboration.uploadError'))
  } finally {
    isUploading.value = false
    target.value = ''
  }
}

async function downloadFile(file: SharedFile) {
  try {
    const res = await portalApi.downloadDocument(file.id)
    const blob = res as unknown as Blob
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    a.click()
    window.URL.revokeObjectURL(url)
  } catch {
    ElMessage.error(t('collaboration.downloadError'))
  }
}

function showRejectDialog(approvalId: string) {
  rejectingApprovalId.value = approvalId
  rejectComment.value = ''
  rejectDialogVisible.value = true
}

async function confirmReject() {
  await submitApproval(rejectingApprovalId.value, 'reject', rejectComment.value)
  rejectDialogVisible.value = false
}

async function submitApproval(approvalId: string, action: 'approve' | 'reject', comment?: string) {
  const item = approvals.value.find(a => a.id === approvalId)
  if (item) item.submitting = true
  try {
    await portalApi.submitApproval(approvalId, action, comment || '')
    if (item) {
      item.status = action === 'approve' ? 'approved' : 'rejected'
      item.comment = comment || ''
    }
    ElMessage.success(action === 'approve' ? t('collaboration.approveSuccess') : t('collaboration.rejectSuccess'))
  } catch {
    ElMessage.error(t('collaboration.approvalError'))
  } finally {
    if (item) item.submitting = false
  }
}

function renderMentions(content: string): string {
  // 先对原始内容进行 HTML 转义，防止 XSS 注入
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
  // 在转义后的内容中替换 @提及 为高亮标签
  const withMentions = escaped.replace(/@(\S+)/g, '<span class="text-wealth font-medium">@$1</span>')
  // 通过 DOMPurify 消毒，仅允许安全标签
  return sanitizeHtml(withMentions, { allowedTags: ['span'], allowedAttr: ['class'] })
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function getApprovalStatusLabel(status: string): string {
  const map: Record<string, string> = { pending: t('collaboration.statusPending'), approved: t('collaboration.statusApproved'), rejected: t('collaboration.statusRejected') }
  return map[status] || status
}

function getApprovalStatusClass(status: string): string {
  const map: Record<string, string> = { pending: 'bg-amber-500/10 text-amber-400', approved: 'bg-emerald-500/10 text-emerald-400', rejected: 'bg-red-500/10 text-red-400' }
  return map[status] || 'bg-gray-500/10 text-gray-400'
}
</script>
