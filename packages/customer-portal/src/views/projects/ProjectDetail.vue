<template>
  <div class="project-detail" v-loading="isLoading">
    <el-button :icon="ArrowLeft" text @click="$router.push('/projects')">返回项目列表</el-button>
    
    <div v-if="project">
      <!-- 项目头部 -->
      <div class="project-header">
        <div class="header-info">
          <h1>{{ project.title || '无标题项目' }}</h1>
          <el-tag :type="getStatusType(project.status)" size="large">
            {{ getStatusLabel(project.status) }}
          </el-tag>
        </div>
        <div class="header-meta">
          <span><el-icon><Calendar /></el-icon> 开始: {{ formatDate(project.startDate) }}</span>
          <span><el-icon><Timer /></el-icon> 预计完成: {{ formatDate(project.estimatedEndDate) }}</span>
        </div>
      </div>

      <el-row :gutter="24">
        <!-- 左侧：进度时间线 -->
        <el-col :span="16" :xs="24">
          <el-card class="timeline-card">
            <template #header>
              <div class="timeline-header">
                <span>项目进度</span>
                <span class="overall-progress">{{ project.completionPercentage || 0 }}% 已完成</span>
              </div>
            </template>
            <el-timeline v-if="steps && steps.length > 0">
              <el-timeline-item
                v-for="step in steps"
                :key="step.id"
                :type="getStepType(step.status)"
                :hollow="step.status === 'pending'"
                :timestamp="step.completedAt || step.estimatedDate"
                placement="top"
              >
                <div class="step-content">
                  <div class="step-title">{{ step.title }}</div>
                  <div class="step-desc">{{ step.description || '无具体说明' }}</div>
                </div>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="暂无进度详情" />
          </el-card>
        </el-col>

        <!-- 右侧：信息栏 -->
        <el-col :span="8" :xs="24">
          <el-card class="info-card">
            <template #header>
              <span>负责团队</span>
            </template>
            <div class="consultant-info">
              <el-avatar :size="48">{{ project.consultant?.name?.[0] || '管' }}</el-avatar>
              <div class="consultant-detail">
                <div class="name">{{ project.consultant?.name || '项目经理' }}</div>
                <div class="title">通海高级顾问</div>
              </div>
            </div>
            <el-button type="primary" style="width: 100%; margin-top: 16px;" @click="handleContactConsultant">
              <el-icon><ChatDotRound /></el-icon> 联系顾问
            </el-button>
          </el-card>

          <el-card class="info-card" style="margin-top: 16px;">
            <template #header>
              <span>相关文档</span>
            </template>
            <div class="doc-list" v-if="project.documents && project.documents.length > 0">
              <div v-for="doc in project.documents" :key="doc.id" class="doc-item">
                <el-icon><Document /></el-icon>
                <span class="doc-name">{{ doc.fileName }}</span>
                <el-button link type="primary" size="small">预览</el-button>
              </div>
            </div>
            <el-empty v-else description="暂无相关文档" :image-size="40" />
            <el-button style="width: 100%; margin-top: 16px;" @click="$router.push('/documents')">
              查看全部文档
            </el-button>
          </el-card>
        </el-col>
      </el-row>
    </div>
    <el-empty v-else-if="!isLoading" description="未找到项目详情" />
    <el-dialog v-model="showContactDialog" title="联系顾问" width="500px">
      <el-form :model="contactForm" label-position="top">
        <el-form-item label="标题">
          <el-input v-model="contactForm.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input
            v-model="contactForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入您想咨询的内容..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showContactDialog = false">取消</el-button>
          <el-button type="primary" :loading="sending" @click="submitContact">
            发送
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Calendar, Timer, ChatDotRound, Document } from '@element-plus/icons-vue'
import { useProjectStore } from '@/stores/projectStore'
import { messageApi } from '@/api'

const route = useRoute()
const projectStore = useProjectStore()
const { currentProject: project, isLoading } = storeToRefs(projectStore)

const projectId = route.params.id as string
const showContactDialog = ref(false)
const sending = ref(false)
const contactForm = reactive({
  title: '',
  content: ''
})

onMounted(() => {
  projectStore.fetchProject(projectId)
})

function handleContactConsultant() {
  contactForm.title = `关于项目：${project.value?.title || ''}`
  contactForm.content = ''
  showContactDialog.value = true
}

async function submitContact() {
  if (!contactForm.title || !contactForm.content) {
    ElMessage.warning('请填写标题和内容')
    return
  }
  
  sending.value = true
  try {
    await messageApi.sendMessage({
      projectId: project.value.id,
      recipientId: project.value.consultant?.id, // 后端会校验或回退
      title: contactForm.title,
      content: contactForm.content
    })
    ElMessage.success('消息发送成功')
    showContactDialog.value = false
  } catch (error) {
    ElMessage.error('发送失败，请稍后重试')
  } finally {
    sending.value = false
  }
}

// ... existing helpers ...
const steps = computed(() => {
  if (!project.value?.tasks) return []
  return project.value.tasks.map((task: any) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: mapTaskStatus(task.status),
    completedAt: task.completedAt ? formatDate(task.completedAt) : null,
    estimatedDate: task.dueDate ? formatDate(task.dueDate) : null
  }))
})

function mapTaskStatus(status: string) {
  if (status === 'DONE') return 'completed'
  if (status === 'IN_PROGRESS') return 'current'
  return 'pending'
}

function getStatusLabel(status: string): string {
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
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    PLANNING: 'info',
    ACTIVE: 'success',
    ON_HOLD: 'warning',
    COMPLETED: 'success',
    ARCHIVED: 'info'
  }
  return map[status] || 'info'
}

function getStepType(status: string): 'primary' | 'success' | 'info' {
  const map: Record<string, 'primary' | 'success' | 'info'> = {
    completed: 'success',
    current: 'primary',
    pending: 'info',
  }
  return map[status] || 'info'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.project-detail {
  max-width: 1200px;
}

.project-header {
  background: linear-gradient(135deg, #1a365d 0%, #2d5a87 100%);
  border-radius: 16px;
  padding: 32px;
  color: #fff;
  margin: 16px 0 32px;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.header-info h1 {
  margin: 0;
  font-size: 28px;
}

.header-meta {
  display: flex;
  gap: 24px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.header-meta span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.timeline-card, .info-card {
  border-radius: 12px;
}

.step-content {
  padding: 8px 0;
}

.step-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.step-desc {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.consultant-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.consultant-detail .name {
  font-weight: 600;
  color: #333;
}

.consultant-detail .title {
  font-size: 13px;
  color: #666;
}

.doc-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.doc-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
}
</style>
