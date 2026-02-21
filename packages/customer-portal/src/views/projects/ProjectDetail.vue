<template>
  <div class="max-w-5xl mx-auto space-y-8 animate-fade-in-up" v-if="project">
    <!-- 返回导航 -->
    <button @click="$router.push('/projects')" class="flex items-center gap-2 text-text-muted hover:text-wealth transition-colors text-sm bg-transparent outline-none">
      <component :is="ArrowLeft" class="w-4 h-4" /> 返回项目列表
    </button>

    <!-- 头部 -->
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a2333] to-[#0f1621] border border-white/5 p-8">
      <!-- 背景装饰 -->
      <div class="absolute top-0 right-0 w-64 h-64 bg-wealth/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
      
      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <span class="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] uppercase tracking-wider text-text-muted">
              {{ getProjectTypeLabel(project.projectType) }}
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
            <span class="flex items-center gap-1.5">
              <component :is="Calendar" class="w-3.5 h-3.5" /> 开始于 {{ formatDate(project.startDate) }}
            </span>
            <span class="flex items-center gap-1.5" v-if="project.estimatedEndDate">
              <component :is="Clock" class="w-3.5 h-3.5" /> 预计 {{ formatDate(project.estimatedEndDate) }}
            </span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <button @click="showContactDialog = true" class="flex items-center gap-2 px-6 py-3 bg-wealth hover:bg-[#B49248] rounded text-obsidian font-bold transition-all shadow-lg shadow-wealth/20 active:scale-95">
          <component :is="MessageCircle" class="w-4 h-4" />
          联系团队
        </button>
      </div>
    </div>

    <!-- 案例进度 -->
    <div class="p-8 rounded-2xl bg-glass/20 border border-white/5">
       <h3 class="font-serif text-lg text-text mb-8">案例时间线</h3>
       <CaseTracker :steps="steps" />
    </div>

    <!-- 详情网格 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- 左侧: 文档 -->
      <div class="md:col-span-2 space-y-6">
        <h3 class="font-serif text-lg text-text">项目文档</h3>
        <div class="rounded-xl bg-glass/10 border border-white/5 overflow-hidden">
          <div v-if="project.documents && project.documents.length > 0" class="divide-y divide-white/5">
             <div 
                v-for="doc in project.documents" 
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
                 {{ downloadingId === doc.id ? '下载中...' : '下载' }}
               </button>
             </div>
          </div>
          <div v-else class="p-8 text-center text-text-muted text-sm">
             暂无文档
          </div>
          <!-- 底部操作 -->
          <div class="p-3 bg-white/5 border-t border-white/5 text-center">
            <button @click="$router.push('/documents')" class="bg-transparent text-xs text-wealth hover:text-white transition-colors border-b border-wealth/30 hover:border-wealth pb-0.5">前往安全保险库 &rarr;</button>
          </div>
        </div>
      </div>

      <!-- 右侧: 顾问 -->
      <div>
         <h3 class="font-serif text-lg text-text mb-6">首席顾问</h3>
         <ConsultantCard 
           :consultant="project.consultant"
           role-label="项目负责人"
           @schedule-meeting="handleScheduleMeeting"
         />
      </div>
    </div>

    <!-- 联系对话框 -->
    <el-dialog v-model="showContactDialog" title="联系服务团队" width="500px" class="!bg-obsidian !border-white/10 !text-text rounded-xl">
       <div class="space-y-4">
         <div class="space-y-2">
           <label class="text-xs font-bold uppercase tracking-wider text-text-muted">主题</label>
           <el-input v-model="contactForm.title" placeholder="请输入主题" class="login-input" />
         </div>
         <div class="space-y-2">
           <label class="text-xs font-bold uppercase tracking-wider text-text-muted">内容</label>
           <el-input 
              v-model="contactForm.content" 
              type="textarea" 
              :rows="4" 
              placeholder="请描述您的问题..." 
              class="login-input" 
           />
         </div>
       </div>
       <template #footer>
          <div class="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button @click="showContactDialog = false" class="px-5 py-2.5 text-sm font-medium text-text bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors">取消</button>
            <button 
              @click="submitContact" 
              :disabled="submitting || !contactForm.title || !contactForm.content"
              class="px-6 py-2.5 bg-wealth hover:bg-[#B49248] text-obsidian rounded font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span v-if="submitting" class="animate-spin">⟳</span>
              发送消息
            </button>
          </div>
       </template>
    </el-dialog>

    <!-- 预约顾问对话框 -->
    <div v-if="showMeetingDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-obsidian/80 backdrop-blur-sm" @click="showMeetingDialog = false"></div>
      <div class="relative w-full max-w-md bg-[#1c1c1c] border border-white/10 rounded-xl p-6 shadow-2xl">
        <h3 class="text-xl font-serif text-text mb-4">预约会议: {{ project.consultant?.name }}</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-xs text-text-muted mb-1">会议主题</label>
            <input v-model="meetingForm.title" type="text" class="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-text text-sm focus:outline-none focus:border-wealth/50" placeholder="例如：讨论业务细节">
          </div>
          <div>
            <label class="block text-xs text-text-muted mb-1">预计开始时间</label>
            <input v-model="meetingForm.date" type="datetime-local" class="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-text text-sm focus:outline-none focus:border-wealth/50">
          </div>
        </div>

        <div class="mt-6 flex gap-3 justify-end">
          <button @click="showMeetingDialog = false" class="px-4 py-2 text-sm text-text-muted hover:text-text transition-colors">取消</button>
          <button @click="submitMeeting" :disabled="isSubmittingMeeting" class="px-4 py-2 bg-wealth text-obsidian text-sm font-bold rounded hover:bg-[#B49248] transition-colors disabled:opacity-50">提交预约</button>
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
  ArrowLeft, Calendar, Clock, MessageCircle, FileText, Download, Loader2
} from 'lucide-vue-next'
import { useProjectStore } from '@/stores/projectStore'
import { messageApi, documentApi, portalApi } from '@/api'
import CaseTracker from '@/components/ui/CaseTracker.vue'
import ConsultantCard from '@/components/ui/ConsultantCard.vue'

const route = useRoute()
const projectStore = useProjectStore()
const { currentProject: project } = storeToRefs(projectStore)

const showContactDialog = ref(false)
const submitting = ref(false)
const downloadingId = ref<string | null>(null)
const contactForm = reactive({ title: '', content: '' })

// 预约功能
const showMeetingDialog = ref(false)
const isSubmittingMeeting = ref(false)
const meetingForm = ref({ title: '', date: '' })

onMounted(() => {
  projectStore.fetchProject(route.params.id as string)
})

const steps = computed(() => {
  if (!project.value?.tasks) return []
  return project.value.tasks.map((task: any) => ({
    id: task.id,
    title: task.title,
    status: mapTaskStatus(task.status),
    date: task.completedAt ? formatDate(task.completedAt) : (task.dueDate ? `截止 ${formatDate(task.dueDate)}` : null)
  }))
})

function mapTaskStatus(status: string) {
  if (status === 'DONE') return 'completed'
  if (status === 'IN_PROGRESS') return 'current'
  return 'pending'
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PLANNING: '规划中',
    ACTIVE: '进行中',
    ON_HOLD: '暂停',
    COMPLETED: '已完成',
    ARCHIVED: '已归档'
  }
  return map[status] || status
}

function getStatusClass(status: string): string {
  if (status === 'ACTIVE') return 'bg-green-500/10 text-green-400'
  if (status === 'COMPLETED') return 'bg-blue-500/10 text-blue-400'
  if (status === 'ON_HOLD') return 'bg-amber-500/10 text-amber-400'
  return 'bg-white/5 text-text-muted'
}

function getProjectTypeLabel(type: string): string {
  const map: Record<string, string> = {
    IMMIGRATION: '移民项目',
    EDUCATION: '教育项目',
    BUSINESS: '商业项目',
    REALESTATE: '房产项目',
  }
  return map[type] || type || '服务项目'
}

async function handleDownload(doc: any) {
  downloadingId.value = doc.id
  try {
    ElMessage.info('正在解密并下载...')
    const response = await documentApi.downloadDocument(doc.id)
    const url = window.URL.createObjectURL(new Blob([response as any]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', doc.fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    ElMessage.success('下载完成')
  } catch {
    ElMessage.error('下载失败')
  } finally {
    downloadingId.value = null
  }
}

function handleScheduleMeeting() {
  if (!project.value?.consultant) {
    ElMessage.warning('尚未指定项目顾问')
    return
  }
  meetingForm.value.title = ''
  // 默认填充明天同时间
  const tmr = new Date()
  tmr.setDate(tmr.getDate() + 1)
  tmr.setMinutes(tmr.getMinutes() - tmr.getTimezoneOffset())
  meetingForm.value.date = tmr.toISOString().slice(0, 16)
  showMeetingDialog.value = true
}

async function submitMeeting() {
  if (!meetingForm.value.title.trim() || !meetingForm.value.date) {
    ElMessage.warning('请填写会议主题及预估时间')
    return
  }
  
  const startTime = new Date(meetingForm.value.date)
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)
  
  isSubmittingMeeting.value = true
  try {
    await portalApi.bookAppointment({
      title: meetingForm.value.title,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      userId: project.value.consultant.id,
      projectId: project.value.id
    })
    ElMessage.success('会议预约请求已发送')
    showMeetingDialog.value = false
  } catch (error: unknown) {
    ElMessage.error((error as Error).message || '预约失败')
  } finally {
    isSubmittingMeeting.value = false
  }
}

async function submitContact() {
  if (!contactForm.title || !contactForm.content) return
  
  submitting.value = true
  try {
     await messageApi.sendMessage({
      projectId: project.value.id,
      recipientId: project.value.consultant?.id,
      title: contactForm.title,
      content: contactForm.content
    })
    ElMessage.success('消息已发送')
    showContactDialog.value = false
    contactForm.title = ''
    contactForm.content = ''
  } catch {
    ElMessage.error('发送失败')
  } finally {
    submitting.value = false
  }
}
</script>
