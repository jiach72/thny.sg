<template>
  <div class="max-w-5xl mx-auto space-y-8 animate-fade-in-up" v-if="project">
    <button @click="$router.push('/projects')" class="flex items-center gap-2 text-text-muted hover:text-wealth transition-colors text-sm bg-transparent outline-none">
      <component :is="ArrowLeft" class="w-4 h-4" /> {{ $t('projects.backToList') }}
    </button>

    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a2333] to-[#0f1621] border border-white/5 p-8">
      <div class="absolute top-0 right-0 w-64 h-64 bg-wealth/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div class="flex items-center gap-3 mb-2" v-if="project.projectType">
            <span class="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] uppercase tracking-wider text-text-muted">
              {{ getProjectTypeLabel(project.projectType as string) }}
            </span>
            <span
              class="px-2 py-1 rounded text-[10px] uppercase tracking-wider font-bold"
              :class="getStatusClass(project.status)"
            >
              {{ getStatusLabel(project.status) }}
            </span>
          </div>
          <h1 class="font-serif text-3xl text-text mb-2">{{ project.title }}</h1>
          <div class="flex items-center gap-4 text-sm text-text-muted">
            <span class="flex items-center gap-1.5" v-if="project.startDate">
              <component :is="Calendar" class="w-3.5 h-3.5" /> {{ $t('dashboard.startedAt') }} {{ formatDate(project.startDate) }}
            </span>
            <span class="flex items-center gap-1.5" v-if="project.estimatedEndDate">
              <component :is="Clock" class="w-3.5 h-3.5" /> {{ $t('projects.estimatedCompletion') }} {{ formatDate(project.estimatedEndDate) }}
            </span>
          </div>
        </div>
        <button @click="showContactDialog = true" class="flex items-center gap-2 px-6 py-3 bg-wealth hover:bg-[#B49248] rounded text-obsidian font-bold transition-all shadow-lg shadow-wealth/20 active:scale-95">
          <component :is="MessageCircle" class="w-4 h-4" />
          {{ $t('projects.contactTeam') }}
        </button>
      </div>
    </div>

    <div class="flex items-center gap-1 p-1 rounded-xl bg-glass/20 border border-white/5 w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        class="px-5 py-2.5 text-sm rounded-lg transition-all flex items-center gap-2"
        :class="activeTab === tab.key ? 'bg-wealth text-obsidian font-bold shadow-lg shadow-wealth/20' : 'text-text-muted hover:text-text hover:bg-white/5'"
      >
        <component :is="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
      </button>
    </div>

    <!-- 概览Tab -->
    <div v-if="activeTab === 'overview'" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="p-6 rounded-xl bg-glass/20 border border-white/5">
          <h3 class="font-serif text-lg text-text mb-4">{{ $t('projects.projectInfo') }}</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-text-muted">{{ $t('projects.projectStatus') }}</span>
              <span class="px-2 py-1 rounded text-xs font-bold" :class="getStatusClass(project.status)">{{ getStatusLabel(project.status) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-text-muted">{{ $t('projects.projectType') }}</span>
              <span class="text-sm text-text">{{ getProjectTypeLabel(project.projectType as string) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-text-muted">{{ $t('projects.startDate') }}</span>
              <span class="text-sm text-text">{{ project.startDate ? formatDate(project.startDate) : '-' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-text-muted">{{ $t('projects.estimatedCompletion') }}</span>
              <span class="text-sm text-text">{{ project.estimatedEndDate ? formatDate(project.estimatedEndDate) : '-' }}</span>
            </div>
          </div>
        </div>

        <div class="p-6 rounded-xl bg-glass/20 border border-white/5">
          <h3 class="font-serif text-lg text-text mb-4">{{ $t('projects.progress') }}</h3>
          <div class="space-y-4">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-text-muted">{{ $t('projects.overallProgress') }}</span>
                <span class="text-sm font-bold text-wealth">{{ progressPercent }}%</span>
              </div>
              <div class="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-wealth to-wealth/70 rounded-full transition-all duration-500" :style="{ width: `${progressPercent}%` }"></div>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-3 pt-2">
              <div class="text-center p-3 rounded-lg bg-white/5">
                <p class="text-lg font-bold text-text">{{ taskStats.pending }}</p>
                <p class="text-[10px] text-text-muted uppercase tracking-wider">{{ $t('projects.todo') }}</p>
              </div>
              <div class="text-center p-3 rounded-lg bg-wealth/10">
                <p class="text-lg font-bold text-wealth">{{ taskStats.inProgress }}</p>
                <p class="text-[10px] text-text-muted uppercase tracking-wider">{{ $t('projects.inProgress') }}</p>
              </div>
              <div class="text-center p-3 rounded-lg bg-green-500/10">
                <p class="text-lg font-bold text-green-400">{{ taskStats.done }}</p>
                <p class="text-[10px] text-text-muted uppercase tracking-wider">{{ $t('projects.completed') }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="p-6 rounded-xl bg-glass/20 border border-white/5">
        <h3 class="font-serif text-lg text-text mb-6">{{ $t('projects.caseTimeline') }}</h3>
        <CaseTracker :steps="steps" />
      </div>

      <div>
        <h3 class="font-serif text-lg text-text mb-4">{{ $t('projects.leadConsultant') }}</h3>
        <ConsultantCard
          :consultant="project.consultant"
          :role-label="t('projects.projectLeader')"
          @schedule-meeting="handleScheduleMeeting"
        />
      </div>
    </div>

    <!-- 文档Tab -->
    <div v-if="activeTab === 'documents'" class="space-y-4">
      <div v-if="projectDocuments.length > 0" class="rounded-xl bg-glass/20 border border-white/5 overflow-hidden">
        <div class="divide-y divide-white/5">
          <div
            v-for="doc in projectDocuments"
            :key="doc.id"
            class="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group"
          >
            <div class="flex items-center gap-4">
              <div class="p-2 rounded bg-obsidian border border-white/10 text-text-muted group-hover:text-wealth transition-colors">
                <component :is="FileText" class="w-5 h-5" />
              </div>
              <div>
                <div class="text-sm font-medium text-text">{{ doc.fileName }}</div>
                <div class="text-xs text-text-muted">{{ formatDate(doc.createdAt) }}</div>
              </div>
            </div>
            <button
              @click="handleDownload(doc)"
              :disabled="downloadingId === doc.id"
              class="flex items-center gap-2 text-sm text-wealth hover:text-white transition-colors disabled:opacity-50"
            >
              <component :is="downloadingId === doc.id ? Loader2 : Download" :class="downloadingId === doc.id ? 'animate-spin w-4 h-4' : 'w-4 h-4'" />
              {{ downloadingId === doc.id ? $t('projects.downloading') : $t('projects.download') }}
            </button>
          </div>
        </div>
      </div>
      <div v-else class="p-8 text-center bg-glass/10 border border-white/5 border-dashed rounded-xl">
        <component :is="FileText" class="w-12 h-12 mx-auto mb-3 text-text-muted/40" />
        <p class="text-text-muted">{{ $t('projects.noDocuments') }}</p>
      </div>
      <div class="text-center">
        <button @click="$router.push('/documents')" class="text-xs text-wealth hover:text-white transition-colors border-b border-wealth/30 hover:border-wealth pb-0.5">{{ $t('projects.goToVault') }} &rarr;</button>
      </div>
    </div>

    <!-- 活动Tab -->
    <div v-if="activeTab === 'activity'" class="space-y-4">
      <div v-if="activityLog.length > 0" class="relative pl-8">
        <div class="absolute left-3 top-0 bottom-0 w-px bg-white/10"></div>
        <div v-for="(activity, idx) in activityLog" :key="idx" class="relative mb-6 last:mb-0">
          <div class="absolute -left-5 w-4 h-4 rounded-full border-2 flex items-center justify-center"
               :class="getActivityDotClass(activity.type)">
            <div class="w-1.5 h-1.5 rounded-full" :class="getActivityDotInnerClass(activity.type)"></div>
          </div>
          <div class="p-4 rounded-xl bg-glass/20 border border-white/5">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium text-text">{{ activity.title }}</span>
              <span class="text-xs text-text-muted">{{ activity.time }}</span>
            </div>
            <p class="text-xs text-text-muted">{{ activity.description }}</p>
          </div>
        </div>
      </div>
      <div v-else class="p-8 text-center bg-glass/10 border border-white/5 border-dashed rounded-xl">
        <component :is="Activity" class="w-12 h-12 mx-auto mb-3 text-text-muted/40" />
        <p class="text-text-muted">{{ $t('projects.noActivities') }}</p>
      </div>
    </div>

    <!-- 任务Tab -->
    <div v-if="activeTab === 'tasks'" class="space-y-4">
      <div v-if="project.tasks && project.tasks.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="rounded-xl bg-glass/20 border border-white/5 overflow-hidden">
          <div class="p-4 border-b border-white/5 bg-white/5">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-text-muted"></div>
              <h4 class="text-sm font-bold text-text">{{ $t('projects.todo') }}</h4>
              <span class="text-xs text-text-muted ml-auto">{{ todoTasks.length }}</span>
            </div>
          </div>
          <div class="p-3 space-y-2">
            <div v-for="task in todoTasks" :key="task.id" class="p-3 rounded-lg bg-black/20 border border-white/5 hover:border-wealth/20 transition-all">
              <p class="text-sm text-text mb-1">{{ task.title }}</p>
              <p v-if="(task as any).dueDate" class="text-[10px] text-text-muted">{{ $t('projects.deadline') }} {{ formatDate((task as any).dueDate) }}</p>
            </div>
            <p v-if="todoTasks.length === 0" class="text-xs text-text-muted/50 text-center py-4">{{ $t('projects.noTodoTasks') }}</p>
          </div>
        </div>

        <div class="rounded-xl bg-glass/20 border border-wealth/10 overflow-hidden">
          <div class="p-4 border-b border-wealth/10 bg-wealth/5">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-wealth"></div>
              <h4 class="text-sm font-bold text-wealth">{{ $t('projects.inProgress') }}</h4>
              <span class="text-xs text-text-muted ml-auto">{{ inProgressTasks.length }}</span>
            </div>
          </div>
          <div class="p-3 space-y-2">
            <div v-for="task in inProgressTasks" :key="task.id" class="p-3 rounded-lg bg-black/20 border border-wealth/10 hover:border-wealth/30 transition-all">
              <p class="text-sm text-text mb-1">{{ task.title }}</p>
              <p v-if="(task as any).dueDate" class="text-[10px] text-text-muted">{{ $t('projects.deadline') }} {{ formatDate((task as any).dueDate) }}</p>
            </div>
            <p v-if="inProgressTasks.length === 0" class="text-xs text-text-muted/50 text-center py-4">{{ $t('projects.noInProgressTasks') }}</p>
          </div>
        </div>

        <div class="rounded-xl bg-glass/20 border border-green-500/10 overflow-hidden">
          <div class="p-4 border-b border-green-500/10 bg-green-500/5">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-green-400"></div>
              <h4 class="text-sm font-bold text-green-400">{{ $t('projects.completed') }}</h4>
              <span class="text-xs text-text-muted ml-auto">{{ doneTasks.length }}</span>
            </div>
          </div>
          <div class="p-3 space-y-2">
            <div v-for="task in doneTasks" :key="task.id" class="p-3 rounded-lg bg-black/20 border border-green-500/10 transition-all">
              <p class="text-sm text-text mb-1 line-through opacity-60">{{ task.title }}</p>
              <p v-if="task.completedAt" class="text-[10px] text-text-muted">{{ $t('projects.completedAt') }} {{ formatDate(task.completedAt) }}</p>
            </div>
            <p v-if="doneTasks.length === 0" class="text-xs text-text-muted/50 text-center py-4">{{ $t('projects.noCompletedTasks') }}</p>
          </div>
        </div>
      </div>
      <div v-else class="p-8 text-center bg-glass/10 border border-white/5 border-dashed rounded-xl">
        <component :is="CheckSquare" class="w-12 h-12 mx-auto mb-3 text-text-muted/40" />
        <p class="text-text-muted">{{ $t('projects.noTasks') }}</p>
      </div>
    </div>

    <el-dialog v-model="showContactDialog" :title="$t('projects.contactDialogTitle')" width="500px" class="!bg-obsidian !border-white/10 !text-text rounded-xl">
       <div class="space-y-4">
         <div class="space-y-2">
           <label class="text-xs font-bold uppercase tracking-wider text-text-muted">{{ $t('projects.contactSubject') }}</label>
           <el-input v-model="contactForm.title" :placeholder="$t('projects.contactSubjectPlaceholder')" class="login-input" />
         </div>
         <div class="space-y-2">
           <label class="text-xs font-bold uppercase tracking-wider text-text-muted">{{ $t('projects.contactContent') }}</label>
           <el-input
              v-model="contactForm.content"
              type="textarea"
              :rows="4"
              :placeholder="$t('projects.contactContentPlaceholder')"
              class="login-input"
           />
         </div>
       </div>
       <template #footer>
          <div class="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button @click="showContactDialog = false" class="px-5 py-2.5 text-sm font-medium text-text bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors">{{ $t('common.cancel') }}</button>
            <button
              @click="submitContact"
              :disabled="submitting || !contactForm.title || !contactForm.content"
              class="px-6 py-2.5 bg-wealth hover:bg-[#B49248] text-obsidian rounded font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span v-if="submitting" class="animate-spin">&#x27F3;</span>
              {{ $t('projects.sendMessage') }}
            </button>
          </div>
       </template>
    </el-dialog>

    <div v-if="showMeetingDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-obsidian/80 backdrop-blur-sm" @click="showMeetingDialog = false"></div>
      <div class="relative w-full max-w-md bg-[#1c1c1c] border border-white/10 rounded-xl p-6 shadow-2xl">
        <h3 class="text-xl font-serif text-text mb-4">{{ $t('projects.bookMeeting') }}: {{ project.consultant?.name || $t('projects.leadConsultant') }}</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-xs text-text-muted mb-1">{{ $t('projects.meetingTopic') }}</label>
            <input v-model="meetingForm.title" type="text" class="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-text text-sm focus:outline-none focus:border-wealth/50" :placeholder="$t('projects.meetingTopicPlaceholder')">
          </div>
          <div>
            <label class="block text-xs text-text-muted mb-1">{{ $t('projects.estimatedStartTime') }}</label>
            <input v-model="meetingForm.date" type="datetime-local" class="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-text text-sm focus:outline-none focus:border-wealth/50">
          </div>
        </div>
        <div class="mt-6 flex gap-3 justify-end">
          <button @click="showMeetingDialog = false" class="px-4 py-2 text-sm text-text-muted hover:text-text transition-colors">{{ $t('common.cancel') }}</button>
          <button @click="submitMeeting" :disabled="isSubmittingMeeting" class="px-4 py-2 bg-wealth text-obsidian text-sm font-bold rounded hover:bg-[#B49248] transition-colors disabled:opacity-50">{{ $t('projects.submitBooking') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft, Calendar, Clock, MessageCircle, FileText, Download, Loader2,
  LayoutDashboard, FolderOpen, Activity, CheckSquare
} from 'lucide-vue-next'
import { useProjectStore } from '@/stores/projectStore'
import { portalApi, documentApi } from '@/api'
import type { PortalDocument } from '@tonghai/shared'
import CaseTracker from '@/components/ui/CaseTracker.vue'
import ConsultantCard from '@/components/ui/ConsultantCard.vue'
import { formatDate, getStatusLabel, getStatusClass } from '@/utils/formatters'
import { useI18n } from 'vue-i18n'

type TabKey = 'overview' | 'documents' | 'activity' | 'tasks'

const { t } = useI18n()

const tabs: { key: TabKey; label: string; icon: any }[] = [
  { key: 'overview', label: t('projects.tabOverview'), icon: LayoutDashboard },
  { key: 'documents', label: t('projects.tabDocuments'), icon: FolderOpen },
  { key: 'activity', label: t('projects.tabActivity'), icon: Activity },
  { key: 'tasks', label: t('projects.tabTasks'), icon: CheckSquare },
]

const route = useRoute()
const projectStore = useProjectStore()
const { currentProject: project } = storeToRefs(projectStore)

const activeTab = ref<TabKey>('overview')
const showContactDialog = ref(false)
const submitting = ref(false)
const downloadingId = ref<string | null>(null)
const contactForm = reactive({ title: '', content: '' })

const showMeetingDialog = ref(false)
const isSubmittingMeeting = ref(false)
const meetingForm = ref({ title: '', date: '' })

const projectDocuments = ref<PortalDocument[]>([])

onMounted(() => {
  projectStore.fetchProject(route.params.id as string)
  fetchProjectDocuments()
})

async function fetchProjectDocuments(): Promise<void> {
  try {
    const res = await portalApi.getMyDocuments({ page: 1, limit: 100 })
    const allDocs = res.documents || []
    const pid = route.params.id as string
    projectDocuments.value = allDocs.filter(d => d.projectId === pid)
  } catch {
    // silently fail
  }
}

const steps = computed(() => {
  if (!project.value?.tasks) return []
  return project.value.tasks.map(task => ({
    id: task.id,
    title: task.title,
    status: mapTaskStatus(task.status),
    date: task.completedAt ? formatDate(task.completedAt) : ((task as { dueDate?: string }).dueDate ? `${t('projects.deadline')} ${formatDate((task as { dueDate?: string }).dueDate || null)}` : undefined)
  }))
})

const taskStats = computed(() => {
  const tasks = project.value?.tasks || []
  return {
    pending: tasks.filter(t => t.status === 'TODO' || t.status === 'PENDING').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    done: tasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED').length,
  }
})

const progressPercent = computed(() => {
  const total = project.value?.tasks?.length || 0
  if (total === 0) return 0
  const done = taskStats.value.done
  return Math.round((done / total) * 100)
})

const todoTasks = computed(() => {
  return (project.value?.tasks || []).filter(t => t.status === 'TODO' || t.status === 'PENDING')
})

const inProgressTasks = computed(() => {
  return (project.value?.tasks || []).filter(t => t.status === 'IN_PROGRESS')
})

const doneTasks = computed(() => {
  return (project.value?.tasks || []).filter(t => t.status === 'DONE' || t.status === 'COMPLETED')
})

const activityLog = computed(() => {
  const logs: { type: string; title: string; description: string; time: string }[] = []

  if (project.value?.status) {
    logs.push({
      type: 'status',
      title: `${t('projects.statusUpdate')}${getStatusLabel(project.value.status)}`,
      description: t('projects.statusChanged'),
      time: project.value.updatedAt ? formatDate(project.value.updatedAt) : '-',
    })
  }

  if (project.value?.tasks) {
    for (const task of project.value.tasks) {
      if (task.status === 'DONE' && task.completedAt) {
        logs.push({
          type: 'task',
          title: `${t('projects.taskCompleted')}: ${task.title}`,
          description: t('projects.taskMarkedDone'),
          time: formatDate(task.completedAt),
        })
      }
    }
  }

  for (const doc of projectDocuments.value) {
    logs.push({
      type: 'document',
      title: `${t('projects.documentUploaded')}: ${doc.fileName}`,
      description: doc.project?.title || t('projects.projectDocument'),
      time: formatDate(doc.createdAt),
    })
  }

  return logs
})

function mapTaskStatus(status: string): 'completed' | 'current' | 'pending' {
  if (status === 'DONE') return 'completed'
  if (status === 'IN_PROGRESS') return 'current'
  return 'pending'
}

function getProjectTypeLabel(type: string): string {
  const map: Record<string, string> = {
    IMMIGRATION: t('projects.typeImmigration'),
    EDUCATION: t('projects.typeEducation'),
    BUSINESS: t('projects.typeBusiness'),
    REALESTATE: t('projects.typeRealestate'),
  }
  return map[type] || type || t('projects.typeDefault')
}

function getActivityDotClass(type: string): string {
  if (type === 'status') return 'border-blue-400 bg-blue-400/10'
  if (type === 'task') return 'border-green-400 bg-green-400/10'
  if (type === 'document') return 'border-wealth bg-wealth/10'
  return 'border-text-muted bg-white/5'
}

function getActivityDotInnerClass(type: string): string {
  if (type === 'status') return 'bg-blue-400'
  if (type === 'task') return 'bg-green-400'
  if (type === 'document') return 'bg-wealth'
  return 'bg-text-muted'
}

async function handleDownload(doc: PortalDocument): Promise<void> {
  downloadingId.value = doc.id
  try {
    ElMessage.info(t('projects.requestingDownload'))
    const response = await documentApi.downloadDocument(doc.id)
    const blob = new Blob([response as any], { type: doc.mimeType || 'application/octet-stream' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', doc.fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success(t('projects.downloadComplete'))
  } catch {
    ElMessage.error(t('projects.downloadFailed'))
  } finally {
    downloadingId.value = null
  }
}

function handleScheduleMeeting(): void {
  if (!project.value?.consultant) {
    ElMessage.warning(t('projects.noAssignedConsultant'))
    return
  }
  meetingForm.value.title = ''
  const tmr = new Date()
  tmr.setDate(tmr.getDate() + 1)
  tmr.setMinutes(tmr.getMinutes() - tmr.getTimezoneOffset())
  meetingForm.value.date = tmr.toISOString().slice(0, 16)
  showMeetingDialog.value = true
}

async function submitMeeting(): Promise<void> {
  if (!meetingForm.value.title.trim() || !meetingForm.value.date) {
    ElMessage.warning(t('projects.pleaseFillMeetingInfo'))
    return
  }

  const startTime = new Date(meetingForm.value.date)
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)

  isSubmittingMeeting.value = true
  try {
    if (project.value && project.value.consultant) {
      await portalApi.bookAppointment({
        title: meetingForm.value.title,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        userId: project.value.consultant.id,
        projectId: project.value.id
      })
      ElMessage.success(t('projects.bookingSubmitted'))
      showMeetingDialog.value = false
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : t('projects.bookingFailed')
    ElMessage.error(msg)
  } finally {
    isSubmittingMeeting.value = false
  }
}

async function submitContact(): Promise<void> {
  if (!contactForm.title || !contactForm.content) return

  submitting.value = true
  try {
    if (project.value && project.value.consultant) {
      await portalApi.createInquiry({
        serviceType: 'PROJECT_INQUIRY',
        message: contactForm.title + '\n' + contactForm.content,
      })
      ElMessage.success(t('projects.messageSent'))
      showContactDialog.value = false
      contactForm.title = ''
      contactForm.content = ''
    }
  } catch (err: unknown) {
    ElMessage.error(t('projects.sendFailed'))
  } finally {
    submitting.value = false
  }
}
</script>
