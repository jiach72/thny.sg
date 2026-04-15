<template>
  <div class="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
    <!-- 欢迎头部 -->
    <div class="flex items-end justify-between">
      <div>
        <h1 class="font-serif text-3xl text-text mb-2">
          <span class="text-wealth">{{ timeGreeting }}</span>，{{ userName }}
        </h1>
        <p class="text-sm text-text-muted">{{ $t('dashboard.overview') }}</p>
      </div>
      
      <!-- 统计卡片 (桌面端) -->
      <div class="hidden md:flex gap-4">
        <div class="px-6 py-3 rounded-lg bg-glass/20 border border-white/5 text-center min-w-[120px]">
          <div v-if="!statsLoading" class="text-2xl font-serif text-text">{{ stats.activeProjects }}</div>
          <div v-else class="h-8 w-12 mx-auto bg-white/10 rounded animate-pulse"></div>
          <div class="text-[10px] uppercase tracking-wider text-text-muted">{{ $t('dashboard.activeProjects') }}</div>
        </div>
        <div class="px-6 py-3 rounded-lg bg-glass/20 border border-white/5 text-center min-w-[120px]">
          <div v-if="!statsLoading" class="text-2xl font-serif text-text">{{ stats.pendingDocuments }}</div>
          <div v-else class="h-8 w-12 mx-auto bg-white/10 rounded animate-pulse"></div>
          <div class="text-[10px] uppercase tracking-wider text-text-muted">{{ $t('dashboard.pendingDocuments') }}</div>
        </div>
        <div class="px-6 py-3 rounded-lg bg-glass/20 border border-white/5 text-center min-w-[120px]">
          <div v-if="!statsLoading" class="text-2xl font-serif text-text">{{ stats.pendingTodos }}</div>
          <div v-else class="h-8 w-12 mx-auto bg-white/10 rounded animate-pulse"></div>
          <div class="text-[10px] uppercase tracking-wider text-text-muted">{{ t('dashboard.pendingTodos') }}</div>
        </div>
        <div class="px-6 py-3 rounded-lg bg-glass/20 border border-white/5 text-center min-w-[120px]">
          <div v-if="!statsLoading" class="text-2xl font-serif" :class="(stats.overdueInvoices ?? 0) > 0 ? 'text-red-400' : 'text-text'">{{ stats.overdueInvoices ?? 0 }}</div>
          <div v-else class="h-8 w-12 mx-auto bg-white/10 rounded animate-pulse"></div>
          <div class="text-[10px] uppercase tracking-wider text-text-muted">{{ t('dashboard.overdueInvoices') }}</div>
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
             <h3 class="text-sm uppercase tracking-wider text-text-muted font-bold">{{ $t('dashboard.activeProjects') }}</h3>
             <button @click="$router.push('/projects')" class="bg-transparent text-xs font-medium text-wealth hover:text-white transition-colors border-b border-wealth/30 hover:border-wealth pb-0.5">
               {{ t('dashboard.viewAll') }}
             </button>
           </div>
           
           <div v-if="typedProjects && typedProjects.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div 
               v-for="project in typedProjects" 
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
                  <p class="text-xs text-text-muted mb-4">{{ t('dashboard.startedAt') }} {{ formatDate(project.createdAt) }}</p>

                  <!-- 进度条 -->
                  <div class="space-y-1">
                    <div class="flex justify-between text-[10px] text-text-muted">
                      <span>{{ t('dashboard.progress') }}</span>
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
             <p class="text-text-muted mb-4">{{ t('dashboard.noActiveProjects') }}</p>
             <button 
               @click="openServiceInquiry('business')"
               class="px-6 py-2 bg-gradient-to-r from-wealth to-[#B49248] hover:from-[#B49248] hover:to-wealth text-obsidian font-bold rounded shadow-lg shadow-wealth/20 transition-all active:scale-95"
             >
               {{ t('dashboard.startInquiry') }}
             </button>
           </div>
        </div>

        <!-- 服务目录 -->
        <div>
          <h3 class="text-sm uppercase tracking-wider text-text-muted font-bold mb-4 ml-1">{{ t('dashboard.professionalServices') }}</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <!-- 移民服务 -->
            <div 
              @click="openServiceInquiry('immigration')"
              class="p-4 rounded-xl bg-glass/20 border border-white/5 flex flex-col items-center justify-center gap-3 hover:bg-glass/30 transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10 active:scale-95 duration-300"
            >
               <div class="p-3 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                 <component :is="Globe" class="w-6 h-6 text-white" />
               </div>
               <span class="text-xs font-bold text-text tracking-wide group-hover:text-emerald-400 transition-colors">{{ t('dashboard.serviceImmigration') }}</span>
            </div>

            <!-- 教育咨询 -->
            <div 
              @click="openServiceInquiry('education')"
              class="p-4 rounded-xl bg-glass/20 border border-white/5 flex flex-col items-center justify-center gap-3 hover:bg-glass/30 transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10 active:scale-95 duration-300"
            >
               <div class="p-3 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                 <component :is="GraduationCap" class="w-6 h-6 text-white" />
               </div>
               <span class="text-xs font-bold text-text tracking-wide group-hover:text-blue-400 transition-colors">{{ t('dashboard.serviceEducation') }}</span>
            </div>

            <!-- 商业服务 -->
            <div 
              @click="openServiceInquiry('business')"
              class="p-4 rounded-xl bg-glass/20 border border-white/5 flex flex-col items-center justify-center gap-3 hover:bg-glass/30 transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/10 active:scale-95 duration-300"
            >
               <div class="p-3 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform duration-300">
                 <component :is="Briefcase" class="w-6 h-6 text-white" />
               </div>
               <span class="text-xs font-bold text-text tracking-wide group-hover:text-amber-400 transition-colors">{{ t('dashboard.serviceBusiness') }}</span>
            </div>

            <!-- 房产投资 -->
            <div 
              @click="openServiceInquiry('realestate')"
              class="p-4 rounded-xl bg-glass/20 border border-white/5 flex flex-col items-center justify-center gap-3 hover:bg-glass/30 transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-lg hover:shadow-rose-500/10 active:scale-95 duration-300"
            >
               <div class="p-3 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 shadow-lg shadow-rose-500/30 group-hover:scale-110 transition-transform duration-300">
                 <component :is="Landmark" class="w-6 h-6 text-white" />
               </div>
               <span class="text-xs font-bold text-text tracking-wide group-hover:text-rose-400 transition-colors">{{ t('dashboard.serviceRealEstate') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧 (侧边栏) -->
      <div class="space-y-8">
        <!-- 行动中心 -->
        <div class="hidden lg:block relative z-20">
           <ActionCenter :items="todos" @action="handleActionClick" />
        </div>

        <!-- 当前进度时间线 (里程碑) -->
        <div class="rounded-xl bg-glass/20 border border-white/5 p-6 relative z-10">
           <h3 class="font-serif text-lg text-text mb-4 flex items-center gap-2">
             <component :is="Clock" class="w-5 h-5 text-wealth" />
             {{ t('dashboard.upcomingMilestones') }}
           </h3>
           
           <div v-if="loadingMilestones" class="space-y-4">
             <div v-for="i in 3" :key="i" class="h-12 bg-white/5 rounded animate-pulse"></div>
           </div>
           
           <div v-else-if="milestones && milestones.length > 0" class="relative border-l border-white/10 ml-3 space-y-6">
             <div v-for="ms in milestones" :key="ms.id" class="relative pl-6">
               <div class="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-obsidian border-2 border-wealth shadow-[0_0_10px_rgba(214,181,110,0.5)]"></div>
               <p class="text-[10px] text-wealth font-bold tracking-wider mb-1">{{ formatDate(ms.dueDate) }}</p>
               <h4 class="text-sm font-medium text-text mt-0.5 leading-snug">{{ ms.title }}</h4>
               <p class="text-xs text-text-muted mt-1 truncate">{{ ms.project?.title }}</p>
             </div>
           </div>
           
           <div v-else class="text-center py-6 border border-dashed border-white/10 rounded-lg">
             <p class="text-xs text-text-muted">{{ t('dashboard.noMilestones') }}</p>
           </div>
        </div>

        <!-- 顾问卡片 -->
        <div class="relative z-10">
          <ConsultantCard 
            :consultant="consultant"
            :role-label="t('dashboard.yourConsultant')"
            @schedule-meeting="handleScheduleMeeting"
          />
        </div>

        <!-- 快捷操作面板 -->
        <div class="rounded-xl bg-glass/20 border border-white/5 p-6 relative z-10">
          <h3 class="font-serif text-lg text-text mb-4 flex items-center gap-2">
            <component :is="Zap" class="w-5 h-5 text-wealth" />
            {{ t('dashboard.quickActions') }}
          </h3>
          <div class="grid grid-cols-3 gap-3">
            <button @click="$router.push('/documents')" class="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-wealth/30 transition-all flex flex-col items-center gap-2 group">
              <div class="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <component :is="Upload" class="w-5 h-5" />
              </div>
              <span class="text-[10px] text-text-muted group-hover:text-text transition-colors">{{ t('dashboard.uploadDocument') }}</span>
            </button>
            <button @click="handleScheduleMeeting" class="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-wealth/30 transition-all flex flex-col items-center gap-2 group">
              <div class="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <component :is="Calendar" class="w-5 h-5" />
              </div>
              <span class="text-[10px] text-text-muted group-hover:text-text transition-colors">{{ t('dashboard.bookConsultation') }}</span>
            </button>
            <button @click="$router.push('/invoices')" class="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-wealth/30 transition-all flex flex-col items-center gap-2 group">
              <div class="w-10 h-10 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <component :is="Receipt" class="w-5 h-5" />
              </div>
              <span class="text-[10px] text-text-muted group-hover:text-text transition-colors">{{ t('dashboard.viewInvoices') }}</span>
            </button>
            <button @click="$router.push('/support')" class="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-wealth/30 transition-all flex flex-col items-center gap-2 group">
              <div class="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <component :is="Ticket" class="w-5 h-5" />
              </div>
              <span class="text-[10px] text-text-muted group-hover:text-text transition-colors">{{ t('dashboard.ticketSupport') }}</span>
            </button>
            <button @click="$router.push('/analytics')" class="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-wealth/30 transition-all flex flex-col items-center gap-2 group">
              <div class="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <component :is="BarChart3" class="w-5 h-5" />
              </div>
              <span class="text-[10px] text-text-muted group-hover:text-text transition-colors">{{ t('dashboard.dataDashboard') }}</span>
            </button>
          </div>
        </div>

        <!-- 最近活动流 -->
        <div class="rounded-xl bg-glass/20 border border-white/5 p-6 relative z-10">
          <h3 class="font-serif text-lg text-text mb-4 flex items-center gap-2">
            <component :is="Activity" class="w-5 h-5 text-wealth" />
            {{ t('dashboard.recentActivity') }}
          </h3>
          <div v-if="recentActivities.length === 0" class="text-center py-4">
            <p class="text-xs text-text-muted">{{ t('dashboard.noRecentActivity') }}</p>
          </div>
          <div v-else class="space-y-3">
            <div v-for="activity in recentActivities" :key="activity.id" class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5" :class="getActivityColor(activity.type)">
                <component :is="getActivityIcon(activity.type)" class="w-4 h-4" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-text truncate">{{ activity.title }}</p>
                <p class="text-[10px] text-text-muted">{{ formatActivityTime(activity.createdAt) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- 服务咨询对话框 -->
    <ServiceInquiryDialog
      v-model="showServiceDialog"
      :service-type="selectedServiceType"
      :user-name="user?.name || ''"
      :user-phone="(user as any)?.phone || ''"
      :user-email="user?.email || ''"
      @success="handleInquirySuccess"
    />

    <!-- 预约顾问对话框 -->
    <div v-if="showMeetingDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-obsidian/80 backdrop-blur-sm" @click="showMeetingDialog = false"></div>
      <div class="relative w-full max-w-2xl flex flex-col md:flex-row bg-[#1c1c1c] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
        
        <!-- 左侧日历选择 -->
        <div class="p-6 md:w-1/2 border-b md:border-b-0 md:border-r border-white/10 bg-black/20">
           <h3 class="text-lg font-serif text-text mb-4">{{ t('dashboard.selectDate') }}</h3>
           <VDatePicker 
              v-model="meetingForm.date" 
              mode="date" 
              :min-date="new Date()"
              is-dark
              color="orange"
              class="!bg-transparent !border-0 text-text v-calendar-custom" 
           />
        </div>

        <!-- 右侧时间与主题 -->
        <div class="p-6 md:w-1/2 flex flex-col bg-glass/10">
           <h3 class="text-lg font-serif text-text mb-4 flex items-center gap-2">
             <component :is="Clock" class="w-4 h-4 text-wealth" />
             {{ t('dashboard.availableSlots') }}
           </h3>
           
           <div class="space-y-6 flex-1">
             <div>
               <label class="block text-xs text-text-muted mb-2">{{ t('dashboard.selectTimeSlot') }}</label>
               <div class="grid grid-cols-2 gap-2">
                 <button 
                    v-for="slot in ['09:00', '10:30', '14:00', '15:30', '17:00']" 
                    :key="slot"
                    class="py-2 border rounded text-sm transition-colors text-center"
                    :class="meetingForm.timeSlot === slot ? 'bg-wealth text-obsidian border-wealth font-bold' : 'bg-white/5 border-white/10 text-text hover:bg-white/10 hover:border-wealth/50'"
                    @click="meetingForm.timeSlot = slot"
                 >
                   {{ slot }}
                 </button>
               </div>
             </div>

             <div>
               <label class="block text-xs text-text-muted mb-2">{{ t('dashboard.meetingTitle') }}</label>
               <input v-model="meetingForm.title" type="text" class="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-text text-sm focus:outline-none focus:border-wealth/50 transition-colors" placeholder="例如：讨论续签业务细节">
             </div>
           </div>

           <div class="mt-8 flex gap-3 justify-end">
             <button @click="showMeetingDialog = false" class="px-4 py-2 bg-transparent rounded text-sm text-text-muted hover:text-text hover:bg-white/5 transition-colors">{{ t('common.cancel') }}</button>
             <button @click="submitMeeting" :disabled="isSubmittingMeeting || !meetingForm.date || !meetingForm.timeSlot" class="px-6 py-2 bg-gradient-to-r from-wealth to-[#B49248] text-obsidian text-sm font-bold rounded shadow-lg shadow-wealth/20 hover:shadow-wealth/40 transition-all disabled:opacity-50 disabled:grayscale">{{ t('dashboard.submitBooking') }}</button>
           </div>
        </div>
      </div>
    </div>

    <!-- 首次登录入驻向导 (Onboarding) -->
    <el-dialog v-model="showOnboarding" :title="t('dashboard.onboardingTitle')" width="600px" custom-class="bg-[#1c1c1c] border border-white/10 shadow-2xl rounded-2xl p-0" :show-close="false" :close-on-click-modal="false" :close-on-press-escape="false">
      <div class="px-6 py-4 space-y-6">
         <!-- 进度指示 -->
         <div class="flex gap-2 mb-8">
            <div class="h-1.5 flex-1 rounded-full bg-wealth shadow-[0_0_8px_rgba(214,181,110,0.4)]"></div>
            <div class="h-1.5 flex-1 rounded-full bg-white/10"></div>
            <div class="h-1.5 flex-1 rounded-full bg-white/10"></div>
         </div>

         <div class="text-center space-y-4">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-wealth to-[#B49248] text-obsidian mx-auto flex items-center justify-center shadow-lg shadow-wealth/20 mb-6">
              <component :is="Globe" class="w-8 h-8" />
            </div>
            <h2 class="text-2xl font-serif text-text">{{ t('dashboard.onboardingTitle') }}</h2>
            <p class="text-sm text-text-muted leading-relaxed max-w-sm mx-auto">
              {{ t('dashboard.onboardingDesc') }}
            </p>
         </div>
      </div>
      <template #footer>
         <div class="flex justify-center pt-2 pb-6">
            <button @click="finishOnboarding" class="px-8 py-3 bg-gradient-to-r from-wealth to-[#B49248] text-obsidian text-sm font-bold rounded shadow-lg shadow-wealth/20 hover:shadow-wealth/40 transition-all">
               {{ t('dashboard.startExploring') }}
            </button>
         </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores'
import { useProjectStore } from '@/stores/projectStore'
import { portalApi } from '@/api'
import type { Milestone } from '@tonghai/shared'
import { Folder, Globe, GraduationCap, Briefcase, Landmark, Clock, Zap, Upload, Receipt, Activity, Calendar, Ticket, BarChart3 } from 'lucide-vue-next'
import ActionCenter from '@/components/ui/ActionCenter.vue'
import ConsultantCard from '@/components/ui/ConsultantCard.vue'
import ServiceInquiryDialog from '@/components/ui/ServiceInquiryDialog.vue'
import { useI18n } from 'vue-i18n'
import { DatePicker as VDatePicker } from 'v-calendar'
import { formatDate, getStatusLabel } from '@/utils/formatters'
import { logger } from '@/utils/logger'
import 'v-calendar/dist/style.css'

export interface ActionItem {
  id: string
  type: 'document' | 'project' | 'invoice' | 'message'
  title: string
  description: string
  createdAt: string
  projectId?: string
  priority?: 'high' | 'normal' | 'low'
  isRead?: boolean
}

export interface Consultant {
  id: string
  name: string
  email?: string
  avatar?: string
  avatarUrl?: string
  phone?: string
  contactNumber?: string
  title?: string
}

export interface ProjectItem {
  id: string
  title: string
  status: string
  progress: number
  completionPercentage?: number
  createdAt: string
  consultant?: Consultant
}

export interface DashboardStats {
  activeProjects: number
  pendingDocuments: number
  upcomingMilestones?: Milestone[]
  consultant?: Consultant
}

type ServiceType = 'immigration' | 'education' | 'business' | 'realestate'

const { t } = useI18n()

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const projectStore = useProjectStore()
const { projects } = storeToRefs(projectStore)

const todos = ref<ActionItem[]>([])
const stats = ref<{
  activeProjects: number
  pendingDocuments: number
  pendingTodos: number
  overdueInvoices: number
}>({
  activeProjects: 0,
  pendingDocuments: 0,
  pendingTodos: 0,
  overdueInvoices: 0,
})
const milestones = ref<Milestone[]>([])
const statsLoading = ref(true)
const loadingMilestones = ref(true)

interface RecentActivity {
  id: string
  type: 'document' | 'project' | 'invoice' | 'message'
  title: string
  createdAt: string
}

const recentActivities = ref<RecentActivity[]>([])

// 顾问卡片与预约
const consultant = ref<Consultant | null>(null)
const showMeetingDialog = ref(false)
const isSubmittingMeeting = ref(false)
const meetingForm = ref({
  title: '',
  date: new Date() as Date | null,
  timeSlot: ''
})

const typedProjects = computed<ProjectItem[]>(() => {
  return (projects.value || []) as unknown as ProjectItem[]
})

// 服务咨询对话框
const showServiceDialog = ref(false)
const selectedServiceType = ref<ServiceType>('immigration')
const showOnboarding = ref(false)

// 计算属性
const userName = computed(() => {
  const name = user.value?.name || '用户'
  return name.split(' ')[0]
})

const timeGreeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return t('dashboard.goodMorning')
  if (hour < 18) return t('dashboard.goodAfternoon')
  return t('dashboard.goodEvening')
})

// 生命周期
onMounted(async () => {
  projectStore.fetchMyProjects()
  loadDashboardData()
})

// 方法
async function loadDashboardData(): Promise<void> {
  try {
    const responses = await Promise.all([
      portalApi.getNotifications(),
      portalApi.getDashboardStats()
    ])
    
    const notifications = responses[0] as unknown as ActionItem[]
    const dashboardStats = responses[1] as unknown as DashboardStats

    todos.value = Array.isArray(notifications) ? notifications : []
    const ds = dashboardStats as any
    stats.value = {
      activeProjects: ds?.activeProjects ?? 0,
      pendingDocuments: ds?.pendingDocuments ?? 0,
      pendingTodos: 0,
      overdueInvoices: ds?.overdueInvoices ?? 0,
    }
    
    stats.value.pendingTodos = todos.value.filter(t => !t.isRead).length
    
    // 从 Stats 提取时间线
    if (dashboardStats && dashboardStats.upcomingMilestones) {
      milestones.value = dashboardStats.upcomingMilestones
    }
    
    // 从 Stats 提取顾问（全局），如果不存在，则降级为从第一个项目获取顾问信息
    let consultantData: any = null
    if (dashboardStats && dashboardStats.consultant) {
      consultantData = dashboardStats.consultant
    } else if (typedProjects.value.length > 0 && typedProjects.value[0].consultant) {
      consultantData = typedProjects.value[0].consultant
    }
    
    if (consultantData && typeof consultantData === 'object' && consultantData.name) {
      consultant.value = {
        id: consultantData.id || `temp_${Date.now()}`,
        name: consultantData.name,
        email: consultantData.email,
        phone: consultantData.contactNumber || consultantData.phone,
        avatarUrl: consultantData.avatarUrl || consultantData.avatar,
        title: consultantData.title || '高级顾问'
      };
    }
    
    // 触发 Onboarding 检查
    checkOnboarding()

    // 构建最近活动流
    buildRecentActivities(notifications)
  } catch (err) {
    logger.error('Dashboard', '加载数据失败', err)
  } finally {
    statsLoading.value = false
    loadingMilestones.value = false
  }
}

function checkOnboarding(): void {
  const hasSeen = localStorage.getItem('thny_onboarding_seen')
  if (!hasSeen && typedProjects.value.length === 0) {
    showOnboarding.value = true
  }
}

function finishOnboarding(): void {
  localStorage.setItem('thny_onboarding_seen', 'true')
  showOnboarding.value = false
}

function openServiceInquiry(type: ServiceType): void {
  selectedServiceType.value = type
  showServiceDialog.value = true
}

function handleActionClick(_item: unknown): void {
  // ActionCenter 组件已处理跳转逻辑
}

function handleInquirySuccess(): void {
  ElMessage.success(t('dashboard.inquirySubmitted'))
}

function handleScheduleMeeting(): void {
  if (!consultant.value) {
    ElMessage.warning(t('dashboard.noAssignedConsultant'))
    return
  }
  
  // 初始化预订表单
  meetingForm.value.title = ''
  
  const tmr = new Date()
  tmr.setDate(tmr.getDate() + 1)
  tmr.setHours(0, 0, 0, 0)
  
  meetingForm.value.date = tmr
  meetingForm.value.timeSlot = '10:30'
  showMeetingDialog.value = true
}

async function submitMeeting(): Promise<void> {
  if (!meetingForm.value.title.trim()) {
    ElMessage.warning(t('dashboard.pleaseFillTitle'))
    return
  }
  if (!meetingForm.value.date || !meetingForm.value.timeSlot) {
    ElMessage.warning(t('dashboard.pleaseSelectSlot'))
    return
  }
  
  const [hours, minutes] = meetingForm.value.timeSlot.split(':').map(Number)
  const startTime = new Date(meetingForm.value.date)
  startTime.setHours(hours, minutes, 0, 0)
  
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 默认1小时
  
  isSubmittingMeeting.value = true
  try {
    await portalApi.bookAppointment({
      title: meetingForm.value.title,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      userId: consultant.value?.id || ''
    })
    ElMessage.success(t('dashboard.bookingSubmitted'))
    showMeetingDialog.value = false
  } catch (error: unknown) {
    ElMessage.error((error as Error).message || '预约失败，请稍后重试')
  } finally {
    isSubmittingMeeting.value = false
  }
}

function buildRecentActivities(notifications: unknown[]): void {
  const items = (Array.isArray(notifications) ? notifications : []) as ActionItem[]
  recentActivities.value = items
    .slice(0, 5)
    .map(item => ({
      id: item.id,
      type: item.type,
      title: item.title,
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date(item.createdAt).toISOString(),
    }))
}

function getActivityIcon(type: string) {
  const map: Record<string, typeof Folder> = {
    document: Upload,
    project: Folder,
    invoice: Receipt,
    message: Activity,
  }
  return map[type] || Activity
}

function getActivityColor(type: string): string {
  const map: Record<string, string> = {
    document: 'bg-orange-500/10 text-orange-400',
    project: 'bg-green-500/10 text-green-400',
    invoice: 'bg-red-500/10 text-red-400',
    message: 'bg-blue-500/10 text-blue-400',
  }
  return map[type] || 'bg-white/5 text-text-muted'
}

function formatActivityTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 60000) return t('common.justNow')
  if (diff < 3600000) return `${Math.floor(diff / 60000)} ${t('common.minutesAgo')}`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} ${t('common.hoursAgo')}`
  return `${Math.floor(diff / 86400000)} ${t('common.daysAgo')}`
}
</script>

<style scoped>
.v-calendar-custom {
  --vc-font-family: inherit;
  --vc-bg: transparent;
  --vc-border: transparent;
}
:deep(.vc-header) {
  margin-bottom: 1rem;
}
:deep(.vc-title),
:deep(.vc-arrow) {
  background: transparent !important;
}
:deep(.vc-title:hover),
:deep(.vc-arrow:hover) {
  background: rgba(255, 255, 255, 0.1) !important;
}
:deep(.vc-nav-popover-container) {
  background: #1c1c1c;
  border: 1px solid rgba(255,255,255,0.1);
}
</style>
