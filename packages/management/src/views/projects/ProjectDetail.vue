<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/projectStore'
import { storeToRefs } from 'pinia'
import { Edit, Delete } from '@element-plus/icons-vue'
import ProjectForm from '@/components/projects/ProjectForm.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const { currentProject, isLoading } = storeToRefs(projectStore)

const projectId = route.params.id as string
const activeTab = ref('overview')
const showEditDialog = ref(false)

onMounted(() => {
  projectStore.fetchProjectById(projectId)
})

const handleBack = () => {
  router.push('/projects')
}

const handleEdit = () => {
  showEditDialog.value = true
}

const handleEditSuccess = () => {
  projectStore.fetchProjectById(projectId)
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('确定要删除该项目吗？此操作无法撤销。', '警告', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await projectStore.projects.splice(projectStore.projects.findIndex(p => p.id === projectId), 1) // Store local update
    // await projectApi.delete(projectId) // Real API call
    router.push('/projects')
    ElMessage.success('项目已删除')
  } catch (e) {
    // Cancelled
  }
}

const statusMap: Record<string, string> = {
  PLANNING: '规划中',
  ACTIVE: '进行中',
  ON_HOLD: '暂停',
  COMPLETED: '已完成',
  ARCHIVED: '归档'
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

function getPriorityLabel(p: string): string {
  const map: Record<string, string> = { LOW: '低', MEDIUM: '中', HIGH: '高', CRITICAL: '紧急' }
  return map[p] || p
}
</script>

<template>
  <div v-loading="isLoading">
    <!-- 顶部导航 -->
      <div class="page-header">
        <el-page-header @back="handleBack">
          <template #content>
            <span class="text-large font-600 mr-3">项目详情</span>
          </template>
          <template #extra>
            <div class="flex items-center">
              <el-button :icon="Edit" @click="handleEdit">编辑</el-button>
              <el-button type="danger" :icon="Delete" @click="handleDelete" plain>删除</el-button>
            </div>
          </template>
        </el-page-header>
      </div>

      <div v-if="currentProject" class="project-content">
        <!-- 项目概览卡片 -->
        <el-card class="overview-card">
          <div class="card-header">
            <div>
               <h1 class="project-title">{{ currentProject.title }}</h1>
               <div class="project-meta">
                 <el-tag>{{ statusMap[currentProject.status] }}</el-tag>
                 <span class="sep">|</span>
                 <span>{{ currentProject.projectType }}</span>
                 <span class="sep">|</span>
                 <span>客户: {{ currentProject.customer?.lead?.contactName }} ({{ currentProject.customer?.lead?.companyName }})</span>
               </div>
            </div>
            <div class="progress-section">
               <div class="progress-label">总体进度</div>
               <el-progress :text-inside="true" :stroke-width="18" :percentage="currentProject.completionPercentage" />
            </div>
          </div>
          
          <div class="description mt-4">
             <h3>项目描述</h3>
             <p>{{ currentProject.description || '暂无描述' }}</p>
          </div>
        </el-card>

        <!-- 标签页内容 -->
        <el-tabs v-model="activeTab" class="mt-4">
          <el-tab-pane label="总览" name="overview">
             <div class="grid-container">
               <el-card header="关键信息">
                 <el-descriptions :column="2" border>
                   <el-descriptions-item label="预算">{{ currentProject.currency }} {{ currentProject.budget?.toLocaleString() }}</el-descriptions-item>
                   <el-descriptions-item label="开始日期">{{ new Date(currentProject.id || currentProject.createdAt).toLocaleDateString() }}</el-descriptions-item>
                   <el-descriptions-item label="预计结束">{{ currentProject.estimatedEndDate ? new Date(currentProject.estimatedEndDate).toLocaleDateString() : '-' }}</el-descriptions-item>
                   <el-descriptions-item label="负责人">尚未指派</el-descriptions-item>
                 </el-descriptions>
               </el-card>

               <el-card header="最近动态">
                 <el-empty description="暂无动态" />
               </el-card>
             </div>
          </el-tab-pane>
          <el-tab-pane label="任务列表" name="tasks">
             <div v-if="currentProject.tasks?.length">
               <el-table :data="currentProject.tasks" style="width: 100%" border stripe>
                 <el-table-column prop="title" label="任务名称" min-width="200" />
                 <el-table-column prop="status" label="状态" width="120">
                   <template #default="{ row }">
                     <el-tag :type="getTaskStatusType(row.status)" size="small">
                       {{ getTaskStatusLabel(row.status) }}
                     </el-tag>
                   </template>
                 </el-table-column>
                 <el-table-column prop="priority" label="优先级" width="100">
                   <template #default="{ row }">
                     {{ getPriorityLabel(row.priority) }}
                   </template>
                 </el-table-column>
                 <el-table-column prop="assignedTo.name" label="负责人" width="120">
                   <template #default="{ row }">
                     {{ row.assignedTo?.name || '-' }}
                   </template>
                 </el-table-column>
                 <el-table-column prop="dueDate" label="截止日期" width="120">
                   <template #default="{ row }">
                     {{ row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '-' }}
                   </template>
                 </el-table-column>
               </el-table>
             </div>
             <el-empty v-else description="该项目暂无任务" />
          </el-tab-pane>
          <el-tab-pane label="文档文件" name="documents">
             <div v-if="currentProject.documents?.length">
               <el-table :data="currentProject.documents" style="width: 100%">
                 <el-table-column prop="fileName" label="文件名称" />
                 <el-table-column prop="uploadedBy.name" label="上传者" />
                 <el-table-column prop="createdAt" label="上传时间">
                   <template #default="{ row }">
                     {{ new Date(row.createdAt).toLocaleDateString() }}
                   </template>
                 </el-table-column>
               </el-table>
             </div>
             <el-empty v-else description="项目暂无文档" />
          </el-tab-pane>
        </el-tabs>

      </div>
      <el-empty v-else description="未找到项目信息" />
      
      <ProjectForm 
        v-if="currentProject"
        v-model:visible="showEditDialog" 
        :is-edit="true"
        :initial-data="currentProject"
        @success="handleEditSuccess"
      />
    </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 20px;
}
.project-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 10px 0;
}
.project-meta {
  color: var(--color-text-secondary);
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.sep {
  color: var(--color-border);
}
.progress-section {
  width: 300px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.grid-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.mt-4 { margin-top: 16px; }
</style>
