<template>
  <div class="dashboard">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-content">
        <h1>欢迎回来，{{ user?.name }} 👋</h1>
        <p>这里是您的服务进度概览</p>
      </div>
      <div class="quick-actions">
        <el-button type="primary" @click="$router.push('/projects')">
          <el-icon><Folder /></el-icon> 查看项目
        </el-button>
        <el-button @click="$router.push('/documents')">
          <el-icon><Upload /></el-icon> 上传文档
        </el-button>
      </div>
    </div>

    <!-- 项目进度卡片 -->
    <div class="section-title">我的项目进度</div>
    <el-row :gutter="24">
      <el-col :span="8" v-for="project in (projects || [])" :key="project.id" :xs="24" :sm="12" :md="8">
        <el-card class="project-card" shadow="hover" @click="$router.push(`/projects/${project.id}`)">
          <div class="project-header">
            <span class="project-name">{{ project.title || '无标题' }}</span>
            <el-tag :type="getStatusType(project.status)" size="small">
              {{ getStatusLabel(project.status) }}
            </el-tag>
          </div>
          <div class="project-progress">
            <el-progress 
              :percentage="project.completionPercentage || 0" 
              :stroke-width="10"
              :color="getProgressColor(project.completionPercentage || 0)"
            />
          </div>
          <div class="project-meta">
            <span>
              <el-icon><Calendar /></el-icon>
              预计完成: {{ formatDate(project.estimatedEndDate) }}
            </span>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="24" v-if="!projects || (Array.isArray(projects) && projects.length === 0)">
        <el-empty description="暂无进行中的项目" />
      </el-col>
    </el-row>

    <!-- 待办事项 -->
    <div class="section-title">待办事项</div>
    <el-card class="todo-card">
      <div v-if="todos.length > 0" class="todo-list">
        <div v-for="todo in todos" :key="todo.id" class="todo-item">
          <div class="todo-icon" :class="todo.type">
            <el-icon v-if="todo.type === 'document'"><Upload /></el-icon>
            <el-icon v-else-if="todo.type === 'payment'"><CreditCard /></el-icon>
            <el-icon v-else><Bell /></el-icon>
          </div>
          <div class="todo-content">
            <div class="todo-title">{{ todo.title }}</div>
            <div class="todo-desc">{{ todo.description }}</div>
          </div>
          <el-button type="primary" size="small">处理</el-button>
        </div>
      </div>
      <el-empty v-else description="暂无待办事项" :image-size="80" />
    </el-card>

    <!-- 最近消息 -->
    <div class="section-title">最近消息</div>
    <el-card class="message-card">
      <div v-if="messages.length > 0" class="message-list">
        <div v-for="msg in messages" :key="msg.id" class="message-item">
          <el-avatar :size="40">{{ msg.senderName?.[0] }}</el-avatar>
          <div class="message-content">
            <div class="message-header">
              <span class="sender">{{ msg.senderName }}</span>
              <span class="time">{{ formatDate(msg.createdAt) }}</span>
            </div>
            <div class="message-text">{{ msg.content }}</div>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无消息" :image-size="80" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores'
import { useProjectStore } from '@/stores/projectStore'
import { portalApi } from '@/api'
import { Folder, Upload, Calendar, CreditCard, Bell } from '@element-plus/icons-vue'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const projectStore = useProjectStore()
const { projects } = storeToRefs(projectStore)

const todos = ref<any[]>([])
const messages = ref<any[]>([])

onMounted(async () => {
  projectStore.fetchMyProjects()
  
  // 加载待办事项/通知
  try {
    const notifications = await portalApi.getNotifications() as any
    todos.value = Array.isArray(notifications) ? notifications : []
  } catch (err) {
    console.error('Failed to fetch notifications:', err)
    todos.value = []
  }
})

function getStatusLabel(status: string): string {
  if (!status) return '未知'
  const map: Record<string, string> = {
    PLANNING: '规划中',
    ACTIVE: '进行中',
    ON_HOLD: '暂停',
    COMPLETED: '已完成',
    ARCHIVED: '归档'
  }
  return map[status] || status
}

function getStatusType(status: string): 'success' | 'warning' | 'danger' | 'info' {
  if (!status) return 'info'
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    PLANNING: 'info',
    ACTIVE: 'success',
    ON_HOLD: 'warning',
    COMPLETED: 'success',
    ARCHIVED: 'info'
  }
  return map[status] || 'info'
}

function getProgressColor(progress: number): string {
  if (progress >= 80) return '#52c41a'
  if (progress >= 50) return '#1890ff'
  return '#fa8c16'
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

.welcome-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 40px;
  margin-bottom: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-sm);
}

.welcome-content h1 {
  font-family: 'Lexend', sans-serif;
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 12px;
  color: var(--color-text);
  letter-spacing: -0.03em;
}

.welcome-content p {
  font-size: 16px;
  color: var(--color-text-muted);
  margin: 0;
  font-family: 'Source Sans 3', sans-serif;
}

.section-title {
  font-family: 'Lexend', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
  margin: 40px 0 20px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.project-card {
  background: var(--color-surface) !important;
  border: 1px solid var(--color-border) !important;
  border-radius: var(--radius-sm) !important;
  cursor: pointer;
  transition: all 0.2s;
  padding: 24px;
}

.project-card:hover {
  border-color: var(--color-primary) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.project-name {
  font-family: 'Lexend', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.project-progress {
  margin-bottom: 20px;
}

:deep(.el-progress-bar__outer) {
  border-radius: 4px;
  background-color: var(--color-surface-hover) !important;
}

:deep(.el-progress-bar__inner) {
  border-radius: 4px;
}

.project-meta {
  font-size: 13px;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: 8px;
}

.todo-card, .message-card {
  background: var(--color-surface) !important;
  border: 1px solid var(--color-border) !important;
  border-radius: var(--radius-sm) !important;
  box-shadow: var(--shadow-sm);
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  border-bottom: 1px solid var(--color-border);
  transition: background 0.2s;
}

.todo-item:last-child {
  border-bottom: none;
}

.todo-item:hover {
  background: var(--color-surface-hover);
}

.todo-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: #FFF;
  border: 1px solid var(--color-border);
}

.todo-icon.document { color: var(--color-primary); }
.todo-icon.payment { color: var(--color-secondary); }

.todo-title {
  font-family: 'Source Sans 3', sans-serif;
  font-weight: 600;
  color: var(--color-text);
  font-size: 15px;
  margin-bottom: 4px;
}

.todo-desc {
  font-size: 13px;
  color: var(--color-text-muted);
}

.message-item {
  display: flex;
  gap: 20px;
  padding: 20px;
  border-bottom: 1px solid var(--color-border);
}

.message-item:last-child {
  border-bottom: none;
}

.sender {
  font-family: 'Source Sans 3', sans-serif;
  font-weight: 600;
  color: var(--color-text);
  font-size: 14px;
}

.time {
  font-size: 12px;
  color: var(--color-text-muted);
}

.message-text {
  font-size: 14px;
  color: var(--color-text-muted);
  line-height: 1.5;
}
</style>
