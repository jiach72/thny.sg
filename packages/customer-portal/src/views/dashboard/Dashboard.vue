<template>
  <div class="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
    <!-- 欢迎头部 -->
    <div class="flex items-end justify-between">
      <div>
        <h1 class="font-serif text-3xl text-text mb-2">
          <span class="text-wealth">{{ timeGreeting }}</span>，{{ userName }}
        </h1>
        <p class="text-sm text-text-muted">这是您的资产管理概览</p>
      </div>
      
      <!-- 统计卡片 (桌面端) -->
      <div class="hidden md:flex gap-4">
        <div class="px-6 py-3 rounded-lg bg-glass/20 border border-white/5 text-center min-w-[120px]">
          <div v-if="!statsLoading" class="text-2xl font-serif text-text">{{ stats.activeProjects }}</div>
          <div v-else class="h-8 w-12 mx-auto bg-white/10 rounded animate-pulse"></div>
          <div class="text-[10px] uppercase tracking-wider text-text-muted">进行中项目</div>
        </div>
        <div class="px-6 py-3 rounded-lg bg-glass/20 border border-white/5 text-center min-w-[120px]">
          <div v-if="!statsLoading" class="text-2xl font-serif text-text">{{ stats.pendingDocuments }}</div>
          <div v-else class="h-8 w-12 mx-auto bg-white/10 rounded animate-pulse"></div>
          <div class="text-[10px] uppercase tracking-wider text-text-muted">待处理文档</div>
        </div>
      </div>
    </div>

    <!-- 主内容网格 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- 左侧 (主内容) -->
      <div class="lg:col-span-2 space-y-8">
        
        <!-- 行动中心 (移动端优先) -->
        <div class="block lg:hidden">
          <ActionCenter :items="todos" @action="handleActionClick" />
        </div>

        <!-- 项目区域 -->
        <div>
           <div class="flex items-center justify-between mb-4">
             <h3 class="text-sm uppercase tracking-wider text-text-muted font-bold">进行中的项目</h3>
             <button @click="$router.push('/projects')" class="bg-transparent text-xs font-medium text-wealth hover:text-white transition-colors border-b border-wealth/30 hover:border-wealth pb-0.5">
               查看全部
             </button>
           </div>
           
           <div v-if="projects && projects.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div 
               v-for="project in (projects as any[])" 
               :key="project.id"
               class="group relative p-6 rounded-xl bg-glass/20 border border-white/5 hover:bg-glass/30 hover:border-wealth/30 transition-all duration-300 cursor-pointer overflow-hidden"
               @click="$router.push(`/projects/${project.id}`)"
             >
                <!-- 悬停光效 -->
                <div class="absolute inset-0 bg-gradient-to-br from-wealth/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div class="relative z-10">
                  <div class="flex justify-between items-start mb-4">
                    <div class="p-2 rounded bg-white/5 text-wealth">
                      <component :is="Folder" class="w-5 h-5" />
                    </div>
                    <span class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider" 
                      :class="project.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-text-muted'">
                      {{ getStatusLabel(project.status) }}
                    </span>
                  </div>
                  
                  <h4 class="font-serif text-lg text-text mb-1 truncate">{{ project.title }}</h4>
                  <p class="text-xs text-text-muted mb-4">开始于 {{ formatDate(project.createdAt) }}</p>

                  <!-- 进度条 -->
                  <div class="space-y-1">
                    <div class="flex justify-between text-[10px] text-text-muted">
                      <span>进度</span>
                      <span>{{ project.completionPercentage || 0 }}%</span>
                    </div>
                    <div class="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div 
                        class="h-full bg-wealth transition-all duration-1000 ease-out"
                        :style="{ width: `${project.completionPercentage || 0}%` }"
                      ></div>
                    </div>
                  </div>
                </div>
             </div>
           </div>
           
           <!-- 空状态 -->
           <div v-else class="p-8 rounded-xl bg-glass/10 border border-white/5 text-center border-dashed border-white/10 hover:border-wealth/30 transition-colors">
             <p class="text-text-muted mb-4">暂无进行中的项目</p>
             <button 
               @click="openServiceInquiry('business')"
               class="px-6 py-2 bg-gradient-to-r from-wealth to-[#B49248] hover:from-[#B49248] hover:to-wealth text-obsidian font-bold rounded shadow-lg shadow-wealth/20 transition-all active:scale-95"
             >
               开始新咨询
             </button>
           </div>
        </div>

        <!-- 服务目录 -->
        <div>
          <h3 class="text-sm uppercase tracking-wider text-text-muted font-bold mb-4 ml-1">专业服务</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <!-- 移民服务 -->
            <div 
              @click="openServiceInquiry('immigration')"
              class="p-4 rounded-xl bg-glass/20 border border-white/5 flex flex-col items-center justify-center gap-3 hover:bg-glass/30 transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10 active:scale-95 duration-300"
            >
               <div class="p-3 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                 <component :is="Globe" class="w-6 h-6 text-white" />
               </div>
               <span class="text-xs font-bold text-text tracking-wide group-hover:text-emerald-400 transition-colors">移民服务</span>
            </div>

            <!-- 教育咨询 -->
            <div 
              @click="openServiceInquiry('education')"
              class="p-4 rounded-xl bg-glass/20 border border-white/5 flex flex-col items-center justify-center gap-3 hover:bg-glass/30 transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10 active:scale-95 duration-300"
            >
               <div class="p-3 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                 <component :is="GraduationCap" class="w-6 h-6 text-white" />
               </div>
               <span class="text-xs font-bold text-text tracking-wide group-hover:text-blue-400 transition-colors">教育咨询</span>
            </div>

            <!-- 商业服务 -->
            <div 
              @click="openServiceInquiry('business')"
              class="p-4 rounded-xl bg-glass/20 border border-white/5 flex flex-col items-center justify-center gap-3 hover:bg-glass/30 transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/10 active:scale-95 duration-300"
            >
               <div class="p-3 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform duration-300">
                 <component :is="Briefcase" class="w-6 h-6 text-white" />
               </div>
               <span class="text-xs font-bold text-text tracking-wide group-hover:text-amber-400 transition-colors">商业服务</span>
            </div>

            <!-- 房产投资 -->
            <div 
              @click="openServiceInquiry('realestate')"
              class="p-4 rounded-xl bg-glass/20 border border-white/5 flex flex-col items-center justify-center gap-3 hover:bg-glass/30 transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-lg hover:shadow-rose-500/10 active:scale-95 duration-300"
            >
               <div class="p-3 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 shadow-lg shadow-rose-500/30 group-hover:scale-110 transition-transform duration-300">
                 <component :is="Landmark" class="w-6 h-6 text-white" />
               </div>
               <span class="text-xs font-bold text-text tracking-wide group-hover:text-rose-400 transition-colors">房产投资</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧 (侧边栏) -->
      <div class="space-y-8">
        <!-- 行动中心 -->
        <div class="hidden lg:block">
           <ActionCenter :items="todos" @action="handleActionClick" />
        </div>

        <!-- 顾问卡片 -->
        <ConsultantCard 
          :consultant="consultant"
          role-label="您的专属顾问"
          @schedule-meeting="handleScheduleMeeting"
        />
      </div>

    </div>

    <!-- 服务咨询对话框 -->
    <ServiceInquiryDialog
      v-model="showServiceDialog"
      :service-type="selectedServiceType"
      :user-name="user?.name || ''"
      :user-phone="user?.phone || ''"
      :user-email="user?.email || ''"
      @success="handleInquirySuccess"
    />

    <!-- 预约顾问对话框 -->
    <div v-if="showMeetingDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-obsidian/80 backdrop-blur-sm" @click="showMeetingDialog = false"></div>
      <div class="relative w-full max-w-md bg-[#1c1c1c] border border-white/10 rounded-xl p-6 shadow-2xl">
        <h3 class="text-xl font-serif text-text mb-4">预约会议: {{ consultant?.name }}</h3>
        
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
import { ref, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores'
import { useProjectStore } from '@/stores/projectStore'
import { portalApi } from '@/api'
import { Folder, Globe, GraduationCap, Briefcase, Landmark } from 'lucide-vue-next'
import ActionCenter from '@/components/ui/ActionCenter.vue'
import ConsultantCard from '@/components/ui/ConsultantCard.vue'
import ServiceInquiryDialog from '@/components/ui/ServiceInquiryDialog.vue'

type ServiceType = 'immigration' | 'education' | 'business' | 'realestate'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const projectStore = useProjectStore()
const { projects } = storeToRefs(projectStore)

const todos = ref<any[]>([])
const stats = ref({
  activeProjects: 0,
  pendingDocuments: 0
})
const statsLoading = ref(true)
// 顾问卡片与预约
const consultant = ref<any | null>(null)
const showMeetingDialog = ref(false)
const isSubmittingMeeting = ref(false)
const meetingForm = ref({
  title: '',
  date: ''
})

// 服务咨询对话框
const showServiceDialog = ref(false)
const selectedServiceType = ref<ServiceType>('immigration')

// 计算属性
const userName = computed(() => {
  const name = user.value?.name || '用户'
  return name.split(' ')[0]
})

const timeGreeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

// 生命周期
onMounted(async () => {
  projectStore.fetchMyProjects()
  loadDashboardData()
})

// 方法
async function loadDashboardData() {
  try {
    const [notifications, dashboardStats] = await Promise.all([
      portalApi.getNotifications(),
      portalApi.getDashboardStats()
    ]) as any[]
    
    todos.value = Array.isArray(notifications) ? notifications : []
    stats.value = dashboardStats || { activeProjects: 0, pendingDocuments: 0 }
    
    // 从第一个项目获取顾问信息（如果有）
    if (projects.value?.length > 0 && (projects.value[0] as any).consultant) {
      consultant.value = (projects.value[0] as any).consultant
    }
  } catch (err) {
    console.error('加载数据失败', err)
  } finally {
    statsLoading.value = false
  }
}

function openServiceInquiry(type: ServiceType) {
  selectedServiceType.value = type
  showServiceDialog.value = true
}

function handleActionClick(_item: any) {
  // ActionCenter 组件已处理跳转逻辑
}

function handleInquirySuccess() {
  ElMessage.success('咨询已提交')
}

function handleScheduleMeeting() {
  if (!consultant.value) {
    ElMessage.warning('尚未指定专属顾问')
    return
  }
  meetingForm.value.title = ''
  // 默认填充明天同时刻
  const tmr = new Date()
  tmr.setDate(tmr.getDate() + 1)
  tmr.setMinutes(tmr.getMinutes() - tmr.getTimezoneOffset())
  meetingForm.value.date = tmr.toISOString().slice(0, 16)
  showMeetingDialog.value = true
}

async function submitMeeting() {
  if (!meetingForm.value.title.trim()) {
    ElMessage.warning('请填写会议主题')
    return
  }
  if (!meetingForm.value.date) {
    ElMessage.warning('请选择预计时间')
    return
  }
  
  const startTime = new Date(meetingForm.value.date)
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 默认1小时
  
  isSubmittingMeeting.value = true
  try {
    await portalApi.bookAppointment({
      title: meetingForm.value.title,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      userId: consultant.value?.id || ''
    })
    ElMessage.success('会议预约请求已发送')
    showMeetingDialog.value = false
  } catch (error: any) {
    ElMessage.error(error.message || '预约失败，请稍后重试')
  } finally {
    isSubmittingMeeting.value = false
  }
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PLANNING: '规划中',
    ACTIVE: '进行中',
    ON_HOLD: '暂停',
    COMPLETED: '已完成'
  }
  return map[status] || status
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', year: 'numeric' })
}
</script>
