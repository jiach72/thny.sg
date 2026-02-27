<template>
  <div class="lead-detail" v-loading="loading">
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" text @click="$router.back()">返回</el-button>
        <h2 class="page-title">{{ lead?.contactName }}</h2>
        <el-tag :type="getStatusTagType(lead?.status || '')">
          {{ getStatusLabel(lead?.status || '') }}
        </el-tag>
      </div>
      <div class="header-right">
        <el-button @click="showEditDialog = true">编辑</el-button>
        <el-dropdown trigger="click">
          <el-button>更多操作 <el-icon><ArrowDown /></el-icon></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleAssign">分配</el-dropdown-item>
              <el-dropdown-item @click="handleConvert">转为客户</el-dropdown-item>
              <el-dropdown-item divided @click="handleDelete">删除</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <el-row :gutter="24" v-if="lead">
      <!-- 左侧信息 -->
      <el-col :span="16">
        <el-card class="info-card">
          <template #header>
            <span>基本信息</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="联系人">{{ lead.contactName }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ lead.email || '-' }}</el-descriptions-item>
            <el-descriptions-item label="电话">{{ lead.phone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="公司">{{ lead.companyName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="国家/地区">{{ lead.country || '-' }}</el-descriptions-item>
            <el-descriptions-item label="预算范围">{{ lead.budgetRange || '-' }}</el-descriptions-item>
            <el-descriptions-item label="来源渠道">
              <el-tag size="small">{{ getSourceLabel(lead.sourceChannel) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="评分">
              <ScoreRing :score="lead.score || 0" :size="48" :strokeWidth="4" />
            </el-descriptions-item>
            <el-descriptions-item label="服务类型" :span="2">
              <el-tag 
                v-for="type in lead.serviceTypes" 
                :key="type" 
                size="small"
                style="margin-right: 8px;"
              >
                {{ type }}
              </el-tag>
              <span v-if="!lead.serviceTypes?.length">-</span>
            </el-descriptions-item>
            <el-descriptions-item label="咨询内容" :span="2">
              {{ lead.inquiryMessage || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 增强版活动时间线 -->
        <ActivityTimeline
          style="margin-top: 16px;"
          :activities="formattedActivities"
          :has-more="false"
          :loading="false"
          @add-note="handleAddNote"
        />
      </el-col>

      <!-- 右侧边栏 -->
      <el-col :span="8">
        <!-- 健康评分卡片 -->
        <HealthScoreCard
          :score="lead.score || 0"
          :last-contact-days="getLastContactDays()"
          :response-rate="75"
          :task-completion-rate="getTaskCompletionRate()"
        />

        <el-card class="info-card" style="margin-top: 16px;">
          <template #header>
            <span>负责人</span>
          </template>
          <div v-if="lead.assignedTo" class="assignee-info">
            <el-avatar :size="48">{{ lead.assignedTo.name?.[0] }}</el-avatar>
            <div class="assignee-detail">
              <div class="name">{{ lead.assignedTo.name }}</div>
              <div class="email">{{ lead.assignedTo.email }}</div>
            </div>
          </div>
          <div v-else class="no-assignee">
            <el-button type="primary" link v-permission="['leads:update']" @click="handleAssign">分配负责人</el-button>
          </div>
        </el-card>

        <el-card class="info-card" style="margin-top: 16px;">
          <template #header>
            <div class="card-header-with-action">
              <span>相关任务</span>
              <el-button type="primary" link @click="handleCreateTask">新建</el-button>
            </div>
          </template>
          <div v-if="lead.tasks?.length" class="task-list">
            <div 
              v-for="task in lead.tasks" 
              :key="task.id" 
              class="task-item"
            >
              <el-tag :type="getTaskStatusType(task.status)" size="small">
                {{ getTaskStatusLabel(task.status) }}
              </el-tag>
              <span class="task-title">{{ task.title }}</span>
            </div>
          </div>
          <el-empty v-else description="暂无任务" :image-size="60" />
        </el-card>

        <el-card class="info-card" style="margin-top: 16px;">
          <template #header>
            <span>标签</span>
          </template>
          <div class="tags-container">
            <el-tag 
              v-for="tag in lead.tags" 
              :key="tag"
              closable
              @close="handleRemoveTag(tag)"
            >
              {{ tag }}
            </el-tag>
            <el-button size="small" @click="handleAddTag">+ 添加</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 分配负责人弹窗 -->
    <AssigneeDialog
      v-model:visible="showAssignDialog"
      :current-assignee-id="lead?.assignedTo?.id"
      @confirm="handleAssignConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, ArrowDown } from '@element-plus/icons-vue'
import { useLeadStore } from '@/stores'
// Lead 类型在 store 中已声明，此处通过 storeToRefs 继承推断
import AssigneeDialog from '@/components/AssigneeDialog.vue'
import HealthScoreCard from '@/components/common/HealthScoreCard.vue'
import ActivityTimeline from '@/components/common/ActivityTimeline.vue'

const route = useRoute()
const router = useRouter()
const leadStore = useLeadStore()

const { currentLead: lead, loading } = storeToRefs(leadStore)
const showEditDialog = ref(false)

const showAssignDialog = ref(false)

// 格式化活动数据用于 ActivityTimeline 组件
const formattedActivities = computed(() => {
  if (!lead.value?.activities) return []
  return lead.value.activities.map((activity) => ({
    id: activity.id,
    type: (activity.actionType || 'note') as 'note' | 'call' | 'email' | 'meeting' | 'status_change' | 'task' | 'system',
    description: activity.description,
    actor: activity.actor,
    createdAt: activity.createdAt,
  }))
})

// 计算最后联系天数
function getLastContactDays(): number {
  if (!lead.value?.activities?.length) return 999
  const lastActivity = lead.value.activities[0]
  if (!lastActivity) return 999
  const lastDate = new Date(lastActivity.createdAt)
  const now = new Date()
  return Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
}

// 计算任务完成率
function getTaskCompletionRate(): number {
  if (!lead.value?.tasks?.length) return 0
  const completed = lead.value.tasks.filter((t) => t.status === 'DONE').length
  return Math.round((completed / lead.value.tasks.length) * 100)
}

// 添加备注
async function handleAddNote(note: string) {
  if (!lead.value) return
  if (!note.trim()) return
  try {
    await leadStore.addNote(lead.value.id, note)
    ElMessage.success('备注已添加')
  } catch (error: any) {
    ElMessage.error((error as Error).message || '添加备注失败')
  }
}

onMounted(() => {
  const id = route.params.id as string
  leadStore.fetchLeadById(id)
})

function handleAssign() {
  showAssignDialog.value = true
}

async function handleAssignConfirm(payload: { userId: string; reason: string }) {
  if (!lead.value) return
  
  try {
    await leadStore.assignLead(lead.value.id, payload.userId, payload.reason)
    ElMessage.success('分配成功')
    showAssignDialog.value = false
  } catch (error: any) {
    ElMessage.error((error as Error).message || '分配失败')
  }
}

async function handleConvert() {
  if (!lead.value) return
  
  if (!lead.value.email) {
    ElMessage.error('该线索缺少邮箱，无法转化为客户')
    return
  }

  if (lead.value.status === 'CONVERTED') {
    ElMessage.warning('该线索已转化为客户')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要将线索 "${lead.value.contactName}" 转化为客户吗？\n系统将自动创建客户账号并生成首次登录链接。`,
      '转化为客户',
      { type: 'info', confirmButtonText: '确认转化', cancelButtonText: '取消' }
    )

    const result = await leadStore.convertToCustomer(lead.value.id)
    
    // 显示成功信息和设置密码链接
    await ElMessageBox.alert(
      `客户账号已创建成功！\n\n请将以下链接发送给客户用于首次登录设置密码：\n\n${window.location.origin}/portal${result.setupUrl}`,
      '转化成功',
      { 
        type: 'success',
        confirmButtonText: '复制链接',
        callback: () => {
          navigator.clipboard.writeText(`${window.location.origin}/portal${result.setupUrl}`)
          ElMessage.success('链接已复制到剪贴板')
        }
      }
    )

    // 刷新当前线索状态
    await leadStore.fetchLeadById(lead.value.id)
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '转化失败')
    }
  }
}

async function handleDelete() {
  if (!lead.value) return
  try {
    await ElMessageBox.confirm('确定要删除此线索吗？', '删除确认', { type: 'warning' })
    await leadStore.deleteLead(lead.value.id)
    ElMessage.success('删除成功')
    router.push('/leads')
  } catch {
    // 用户取消
  }
}

function handleCreateTask() {
  router.push('/tasks')
}

async function handleAddTag() {
  if (!lead.value) return
  try {
    const { value: newTag } = await ElMessageBox.prompt('请输入新标签名称 (如: 高意向)', '添加标签', {
      inputPattern: /\S+/,
      inputErrorMessage: '标签不能为空'
    })
    const currentTags = lead.value.tags || []
    if (currentTags.includes(newTag)) {
      ElMessage.warning('标签已存在')
      return
    }
    const updatedTags = [...currentTags, newTag]
    await leadStore.updateLead(lead.value.id, { tags: updatedTags })
    ElMessage.success('添加标签成功')
  } catch {
    // 用户取消
  }
}

async function handleRemoveTag(tag: string) {
  if (!lead.value) return
  try {
    const currentTags = lead.value.tags || []
    const updatedTags = currentTags.filter(t => t !== tag)
    await leadStore.updateLead(lead.value.id, { tags: updatedTags })
    ElMessage.success(`已移除标签`)
  } catch (error: any) {
    ElMessage.error((error as Error).message || '移除标签失败')
  }
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    NEW: '新线索',
    CONTACTED: '已联系',
    QUALIFIED: '已确认',
    IN_PROGRESS: '跟进中',
    LOST: '已流失',
    CONVERTED: '已转化',
  }
  return map[status] || status
}

function getStatusTagType(status: string): 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    NEW: 'info',
    CONTACTED: 'success',
    QUALIFIED: 'warning',
    IN_PROGRESS: 'warning',
    LOST: 'danger',
    CONVERTED: 'success',
  }
  return map[status] || 'info'
}

function getSourceLabel(source: string): string {
  const map: Record<string, string> = {
    website_form: '官网表单',
    referral: '推荐',
    event: '活动',
    other: '其他',
  }
  return map[source] || source
}

function getTaskStatusLabel(status: string): string {
  const map: Record<string, string> = {
    NOT_STARTED: '待开始',
    IN_PROGRESS: '进行中',
    BLOCKED: '已阻塞',
    DONE: '已完成',
    CANCELLED: '已取消',
  }
  return map[status] || status
}

function getTaskStatusType(status: string): 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    NOT_STARTED: 'info',
    IN_PROGRESS: 'warning',
    BLOCKED: 'danger',
    DONE: 'success',
    CANCELLED: 'info',
  }
  return map[status] || 'info'
}
</script>

<style scoped>
.lead-detail {
  max-width: 1400px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.header-right {
  display: flex;
  gap: 12px;
}

.info-card :deep(.el-card__header) {
  padding: 16px 20px;
  font-weight: 600;
}

.score {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.score.high { background: #e6f7e9; color: #52c41a; }
.score.medium { background: #fff7e6; color: #fa8c16; }
.score.low { background: #fff1f0; color: #f5222d; }

.assignee-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.assignee-detail .name {
  font-weight: 500;
  color: #333;
}

.assignee-detail .email {
  font-size: 12px;
  color: #999;
}

.no-assignee {
  text-align: center;
  padding: 20px 0;
  color: #999;
}

.card-header-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.activity-item {
  font-size: 14px;
}

.activity-item strong {
  margin-right: 8px;
}
</style>
