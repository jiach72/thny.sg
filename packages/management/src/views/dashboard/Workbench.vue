<template>
  <div class="workbench">
    <h2 class="page-title">工作台</h2>
    
    <!-- 统计卡片 -->
    <el-row :gutter="24" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card stat-card--primary" shadow="hover">
          <div class="stat-icon">
            <el-icon :size="32"><User /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ followUps.filter(f => f.type === 'LEAD').length }}</div>
            <div class="stat-label">待跟进线索</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card--warning" shadow="hover">
          <div class="stat-icon">
            <el-icon :size="32"><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ followUps.filter(f => f.type === 'TASK').length }}</div>
            <div class="stat-label">待完成任务</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card--success" shadow="hover">
          <div class="stat-icon">
            <el-icon :size="32"><Calendar /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ followUps.filter(f => f.type === 'APPOINTMENT').length }}</div>
            <div class="stat-label">待进行预约</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-card--danger" shadow="hover">
          <div class="stat-icon">
            <el-icon :size="32"><Warning /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ overdueStats?.overdueTasks || 0 }}</div>
            <div class="stat-label">逾期项目</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="24">
      <!-- 待办列表 -->
      <el-col :span="12">
        <el-card class="follow-up-card">
          <template #header>
            <div class="card-header">
              <span>今日待办</span>
              <el-radio-group v-model="followUpFilter" size="small">
                <el-radio-button value="">全部</el-radio-button>
                <el-radio-button value="LEAD">线索</el-radio-button>
                <el-radio-button value="TASK">任务</el-radio-button>
                <el-radio-button value="APPOINTMENT">预约</el-radio-button>
                <el-radio-button value="EVENT">重大事件</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          
          <div v-loading="loading">
            <div 
              v-for="item in filteredFollowUps" 
              :key="`${item.type}-${item.id}`"
              class="follow-up-item"
              :class="{ 'is-overdue': item.isOverdue }"
            >
              <div class="item-icon">
                <el-icon :size="20">
                  <User v-if="item.type === 'LEAD'" />
                  <Document v-else-if="item.type === 'TASK'" />
                  <Calendar v-else-if="item.type === 'APPOINTMENT'" />
                  <Bell v-else />
                </el-icon>
              </div>
              <div class="item-content">
                <div class="item-title">
                  {{ item.title }}
                  <el-tag 
                    :type="getPriorityType(item.priority)" 
                    size="small" 
                    style="margin-left: 8px;"
                  >
                    {{ getPriorityLabel(item.priority) }}
                  </el-tag>
                  <el-tag 
                    v-if="item.isOverdue" 
                    type="danger" 
                    size="small"
                    style="margin-left: 4px;"
                  >
                    逾期
                  </el-tag>
                </div>
                <div class="item-meta">
                  <span v-if="item.relatedEntity">{{ item.relatedEntity.name }} {{ item.description ? '- ' + item.description : '' }}</span>
                  <span v-else-if="item.lead">{{ item.lead.contactName }} - {{ item.lead.companyName }}</span>
                  <span v-if="item.dueDate" style="margin-left: 12px;">
                    <el-icon><Clock /></el-icon>
                    {{ formatDate(item.dueDate) }}
                  </span>
                </div>
              </div>
              <div class="item-actions">
                <el-button 
                  v-if="item.type === 'LEAD'" 
                  type="primary" 
                  size="small"
                  @click="goToLead(item.id)"
                >
                  跟进
                </el-button>
                <el-button 
                  v-else-if="item.type === 'TASK'"
                  type="success"
                  size="small"
                >
                  完成
                </el-button>
                <el-button 
                  v-else-if="item.type === 'EVENT' && item.relatedEntity?.type === 'CUSTOMER'"
                  type="warning"
                  plain
                  size="small"
                  @click="$router.push(`/customers/${item.relatedEntity.id}`)"
                >
                  去关怀
                </el-button>
              </div>
            </div>
            
            <el-empty v-if="filteredFollowUps.length === 0" description="暂无待办事项" />
          </div>
        </el-card>
      </el-col>

      <!-- 日历视图面板 -->
      <el-col :span="12">
        <el-card class="calendar-card">
          <template #header>
            <div class="card-header">
              <span>日程日历</span>
              <el-tag type="info" size="small">月视图</el-tag>
            </div>
          </template>
          <!-- 引入 v-calendar 日历 -->
          <VCalendar
            transparent
            borderless
            expanded
            :attributes="calendarAttributes"
            @dayclick="onDayClick"
          />
          <div style="margin-top: 16px;">
            <div v-if="selectedDate">
              <h4>{{ selectedDate ? formatDate(selectedDate.toISOString()) : '' }} 的日程</h4>
              <div v-for="item in selectedDayEvents" :key="item.id" class="calendar-event-item">
                <el-tag :type="getCalendarTagType(item.type)" size="small">
                  {{ getCalendarTagLabel(item.type) }}
                </el-tag>
                <span style="margin-left: 8px; font-size: 13px;">{{ item.title }}</span>
                <el-button 
                  v-if="item.type === 'LEAD'" 
                  type="primary" link size="small" 
                  @click="goToLead(item.id)" 
                  style="float: right;"
                >
                  处理
                </el-button>
              </div>
              <el-empty v-if="selectedDayEvents.length === 0" description="今日无日程" :image-size="60" />
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="24" :lg="12" style="margin-top: 24px;">
        <!-- 团队工作负载 -->
        <el-card class="workload-card">
          <template #header>
            <div class="card-header">
              <span>团队工作负载</span>
              <el-button link type="primary" @click="batchAssign" :loading="assignLoading">
                智能分配
              </el-button>
            </div>
          </template>
          
          <div v-loading="workloadLoading">
            <div 
              v-for="member in workload" 
              :key="member.userId" 
              class="workload-item"
            >
              <div class="member-info">
                <el-avatar :size="32">{{ member.userName.charAt(0) }}</el-avatar>
                <span class="member-name">{{ member.userName }}</span>
              </div>
              <div class="workload-stats">
                <el-tooltip content="活跃线索">
                  <span class="workload-stat">
                    <el-icon><User /></el-icon>
                    {{ member.activeLeads }}
                  </span>
                </el-tooltip>
                <el-tooltip content="进行中任务">
                  <span class="workload-stat">
                    <el-icon><Document /></el-icon>
                    {{ member.activeTasks }}
                  </span>
                </el-tooltip>
                <el-progress 
                  :percentage="Math.min(member.workload * 10, 100)"
                  :color="getWorkloadColor(member.workload)"
                  :stroke-width="6"
                  style="width: 60px;"
                />
              </div>
            </div>
            
            <el-empty v-if="workload.length === 0" description="暂无团队成员" />
          </div>
        </el-card>

        <!-- 快捷操作 -->
        <el-card class="quick-actions" style="margin-top: 24px;">
          <template #header>
            <span>快捷操作</span>
          </template>
          
          <el-space direction="vertical" fill style="width: 100%;">
            <el-button style="width: 100%;" @click="$router.push('/leads')">
              <el-icon><Plus /></el-icon>
              新建线索
            </el-button>
            <el-button style="width: 100%;" @click="$router.push('/tasks')">
              <el-icon><Edit /></el-icon>
              创建任务
            </el-button>
            <el-button style="width: 100%;" @click="openSopDialog">
              <el-icon><List /></el-icon>
              生成 SOP 任务
            </el-button>
          </el-space>
        </el-card>
      </el-col>
    </el-row>

    <!-- SOP 对话框 -->
    <el-dialog v-model="sopDialogVisible" title="生成 SOP 任务序列" width="500px">
      <el-form label-width="100px">
        <el-form-item label="选择线索">
          <el-select v-model="sopForm.leadId" placeholder="选择线索" filterable style="width: 100%;">
            <el-option 
              v-for="lead in leadOptions" 
              :key="lead.id" 
              :value="lead.id"
              :label="`${lead.contactName} - ${lead.companyName || '未知公司'}`"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="服务类型">
          <el-select v-model="sopForm.serviceType" placeholder="选择服务类型" style="width: 100%;">
            <el-option value="company_registration" label="公司注册" />
            <el-option value="secretary_service" label="公司秘书" />
            <el-option value="accounting" label="会计服务" />
            <el-option value="work_permit" label="工作准证" />
            <el-option value="family_office" label="家族办公室" />
            <el-option value="vcc_fund" label="VCC 基金" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sopDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createSopTasks" :loading="sopLoading">生成任务</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Document, Calendar, Warning, Clock, Plus, Edit, List, Bell } from '@element-plus/icons-vue'
import workflowApi, { type FollowUpItem, type AssignmentStats, type OverdueStats } from '@/api/workflowApi'
import leadApi from '@/api/leadApi'

const router = useRouter()

// 状态
const loading = ref(false)
const workloadLoading = ref(false)
const assignLoading = ref(false)

const followUps = ref<FollowUpItem[]>([])
const workload = ref<AssignmentStats[]>([])
const overdueStats = ref<OverdueStats | null>(null)
const followUpFilter = ref('')

const sopDialogVisible = ref(false)
const sopLoading = ref(false)
const sopForm = ref({ leadId: '', serviceType: 'company_registration' })
const leadOptions = ref<any[]>([])

// 计算属性
const filteredFollowUps = computed(() => {
  if (!followUpFilter.value) return followUps.value
  return followUps.value.filter(f => f.type === followUpFilter.value)
})

// 日历属性映射
const calendarAttributes = computed(() => {
  return followUps.value.map(f => {
    let color = 'blue'
    if (f.type === 'TASK') color = 'green'
    if (f.type === 'APPOINTMENT') color = 'purple'
    if (f.type === 'EVENT') color = 'orange'
    if (f.isOverdue) color = 'red'

    const dateVal = f.dueDate ? new Date(f.dueDate) : new Date()

    return {
      key: `followup-${f.id}`,
      dot: color,
      dates: dateVal,
      customData: f
    }
  })
})

const selectedDate = ref<Date | null>(new Date())
const selectedDayEvents = computed(() => {
  if (!selectedDate.value) return []
  // 匹配选定日期的所有 followUps
  const targetDateStr = selectedDate.value.toISOString().split('T')[0]
  return followUps.value.filter(f => {
    if (!f.dueDate) return false
    const dStr = new Date(f.dueDate).toISOString().split('T')[0]
    return dStr === targetDateStr
  })
})

function onDayClick(day: any) {
  selectedDate.value = day.date
}

// 加载数据
async function loadData() {
  loading.value = true
  workloadLoading.value = true
  
  try {
    const [followUpsData, workloadData, overdueData] = await Promise.all([
      workflowApi.getMyFollowUps(),
      workflowApi.getTeamWorkload(),
      workflowApi.getOverdueStats()
    ])
    
    followUps.value = followUpsData
    workload.value = workloadData
    overdueStats.value = overdueData
  } catch (err: any) {
    ElMessage.error((err as Error).message || '加载失败')
  } finally {
    loading.value = false
    workloadLoading.value = false
  }
}

// 加载线索列表（用于 SOP）
async function loadLeadOptions() {
  try {
    const result = await leadApi.getList(undefined, { page: 1, limit: 100 })
    leadOptions.value = result.data || []
  } catch (err: any) {
    console.error('加载线索失败:', err)
  }
}

// 辅助函数
function getPriorityLabel(priority: string): string {
  const map: Record<string, string> = {
    LOW: '低',
    MEDIUM: '中',
    HIGH: '高',
    URGENT: '紧急'
  }
  return map[priority] || priority
}

function getCalendarTagType(type: string): string {
  const map: Record<string, string> = {
    LEAD: '',
    TASK: 'success',
    APPOINTMENT: 'warning',
    EVENT: 'danger'
  }
  return map[type] || 'info'
}

function getCalendarTagLabel(type: string): string {
  const map: Record<string, string> = {
    LEAD: '线索',
    TASK: '任务',
    APPOINTMENT: '预约',
    EVENT: '事件'
  }
  return map[type] || type
}

function getPriorityType(priority: string): string {
  const map: Record<string, string> = {
    LOW: 'info',
    MEDIUM: '',
    HIGH: 'warning',
    URGENT: 'danger'
  }
  return map[priority] || 'info'
}

function getWorkloadColor(workload: number): string {
  if (workload <= 3) return '#67c23a'
  if (workload <= 6) return '#e6a23c'
  return '#f56c6c'
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return '今天'
  if (days === 1) return '明天'
  if (days === -1) return '昨天'
  if (days < -1) return `${-days} 天前`
  return `${days} 天后`
}

function goToLead(id: string) {
  router.push(`/leads/${id}`)
}

// 批量智能分配
async function batchAssign() {
  assignLoading.value = true
  try {
    const result = await workflowApi.batchAutoAssign()
    ElMessage.success(`分配完成：成功 ${result.assigned} 条，跳过 ${result.skipped} 条`)
    loadData()
  } catch (err: any) {
    ElMessage.error((err as Error).message || '分配失败')
  } finally {
    assignLoading.value = false
  }
}

// SOP 对话框
function openSopDialog() {
  sopDialogVisible.value = true
  loadLeadOptions()
}

async function createSopTasks() {
  if (!sopForm.value.leadId) {
    ElMessage.warning('请选择线索')
    return
  }
  
  sopLoading.value = true
  try {
    const result = await workflowApi.createSopTasks(sopForm.value.leadId, sopForm.value.serviceType)
    if (result.success) {
      ElMessage.success(`已创建 ${result.tasks.length} 个任务`)
      sopDialogVisible.value = false
      loadData()
    }
  } catch (err: any) {
    ElMessage.error((err as Error).message || '创建失败')
  } finally {
    sopLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.workbench {
  max-width: 1400px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 24px;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-card--primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
.stat-card--warning { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; }
.stat-card--success { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; }
.stat-card--danger { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; }

.stat-icon {
  margin-right: 16px;
  opacity: 0.8;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.follow-up-card {
  min-height: 400px;
}

.follow-up-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.follow-up-item:hover {
  background-color: #f9f9f9;
}

.follow-up-item.is-overdue {
  background-color: #fff2f0;
}

.item-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  color: #666;
}

.item-content {
  flex: 1;
}

.item-title {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.item-meta {
  font-size: 13px;
  color: #999;
  display: flex;
  align-items: center;
}

.item-meta .el-icon {
  margin-right: 4px;
}

.workload-card {
  min-height: 300px;
}

.workload-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.member-info {
  display: flex;
  align-items: center;
}

.member-name {
  margin-left: 12px;
  font-weight: 500;
}

.workload-stats {
  display: flex;
  align-items: center;
  gap: 16px;
}

.workload-stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #666;
}

.calendar-card {
  min-height: 400px;
}

.calendar-event-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px dashed #ebeef5;
}
.calendar-event-item:last-child {
  border-bottom: none;
}
</style>
