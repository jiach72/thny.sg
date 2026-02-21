<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, List, Grid, Search, Filter } from '@element-plus/icons-vue'
import { useProjectStore } from '@/stores/projectStore'
import { storeToRefs } from 'pinia'
import ProjectForm from '@/components/projects/ProjectForm.vue'

const router = useRouter()
const projectStore = useProjectStore()
const { projects, projectsByStatus, isLoading } = storeToRefs(projectStore)

const viewMode = ref<'list' | 'board'>('board')
const searchQuery = ref('')
const filterStatus = ref('')

const statusOptions = [
  { label: '规划中', value: 'PLANNING', color: 'info' },
  { label: '进行中', value: 'ACTIVE', color: 'primary' },
  { label: '暂停', value: 'ON_HOLD', color: 'warning' },
  { label: '已完成', value: 'COMPLETED', color: 'success' },
  { label: '归档', value: 'ARCHIVED', color: 'info' }
]

const statusMap: Record<string, string> = {
  PLANNING: '规划中',
  ACTIVE: '进行中',
  ON_HOLD: '暂停',
  COMPLETED: '已完成',
  ARCHIVED: '归档'
}

const statusColorMap: Record<string, string> = {
  PLANNING: 'info',
  ACTIVE: 'primary',
  ON_HOLD: 'warning',
  COMPLETED: 'success',
  ARCHIVED: 'info'
}

onMounted(() => {
  projectStore.fetchProjects()
})

const handleView = (id: string) => {
  router.push(`/projects/${id}`)
}

const showCreateDialog = ref(false)
const handleCreate = () => {
  showCreateDialog.value = true
}

const handleCreateSuccess = () => {
   projectStore.fetchProjects()
}
</script>

<template>
  <div>
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">项目管理</h1>
        <p class="page-subtitle">管理所有交付项目的进度与状态</p>
      </div>
      <div class="page-header-right">
        <el-radio-group v-model="viewMode">
          <el-radio-button value="list"><el-icon><List /></el-icon> 列表</el-radio-button>
          <el-radio-button value="board"><el-icon><Grid /></el-icon> 看板</el-radio-button>
        </el-radio-group>
        <el-button type="primary" :icon="Plus" @click="handleCreate">新建项目</el-button>
      </div>
    </div>
    
    <ProjectForm v-model:visible="showCreateDialog" @success="handleCreateSuccess" />

    <!-- 过滤器 -->
    <div class="filter-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索项目名称..."
        :prefix-icon="Search"
        style="width: 300px"
      />
      <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 200px">
        <template #prefix><el-icon><Filter /></el-icon></template>
        <el-option
          v-for="opt in statusOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </div>

    <!-- 看板视图 -->
    <div v-if="viewMode === 'board'" class="board-container" v-loading="isLoading">
      <div v-for="status in statusOptions" :key="status.value" class="board-column">
        <div class="column-header">
          <span class="status-dot" :class="status.color"></span>
          <h3>{{ status.label }}</h3>
          <span class="count">{{ projectsByStatus[status.value]?.length || 0 }}</span>
        </div>
        
        <div class="column-content">
          <div 
            v-for="project in projectsByStatus[status.value]" 
            :key="project.id" 
            class="project-card"
            @click="handleView(project.id)"
          >
            <div class="card-header">
              <span class="project-type">{{ project.projectType }}</span>
              <el-tag size="small" :type="statusColorMap[project.status]">
                {{ statusMap[project.status] }}
              </el-tag>
            </div>
            <h4 class="project-title">{{ project.title }}</h4>
            <div class="client-info">
              <span class="label">客户:</span> {{ project.customer?.lead?.companyName || project.customer?.lead?.contactName || '未知' }}
            </div>
            
            <div class="progress-bar">
              <el-progress :percentage="project.completionPercentage" :status="project.status === 'COMPLETED' ? 'success' : ''" :stroke-width="6" />
            </div>

            <div class="card-footer">
              <div class="date">{{ project.estimatedEndDate ? new Date(project.estimatedEndDate).toLocaleDateString() : '未设置截止' }}</div>
              <div class="budget" v-if="project.budget">{{ project.currency }} {{ project.budget.toLocaleString() }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 列表视图 -->
    <div v-else class="list-container" v-loading="isLoading">
      <el-table :data="projects" style="width: 100%" @row-click="(row: Record<string, string>) => handleView(row.id)">
        <el-table-column prop="title" label="项目名称" min-width="200" sortable />
        <el-table-column prop="customer.lead.contactName" label="客户" width="150" />
        <el-table-column prop="projectType" label="类型" width="150" sortable />
        <el-table-column prop="status" label="状态" width="120" sortable>
          <template #default="{ row }">
            <el-tag :type="statusColorMap[row.status]">{{ statusMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" width="200" sortable sort-by="completionPercentage">
          <template #default="{ row }">
            <el-progress :percentage="row.completionPercentage" />
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="最后更新" width="180" sortable>
          <template #default="{ row }">
            {{ new Date(row.updatedAt).toLocaleString() }}
          </template>
        </el-table-column>
      </el-table>
    </div>

  </div>
</template>

<style scoped>
/* 使用全局 page-header 样式，移除重复样式 */

:deep(.el-radio-button__inner) {
  padding: 10px 20px;
  font-weight: 600;
}

:deep(.el-radio-button__orig-radio:checked + .el-radio-button__inner) {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  box-shadow: -1px 0 0 0 var(--color-primary);
}

.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

/* 看板样式 */
.board-container {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  min-height: calc(100vh - 250px);
  padding-bottom: 16px;
}

.board-column {
  flex: 0 0 300px;
  background: var(--color-bg-subtle);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  padding: 12px;
}

.column-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
}

.status-dot.info { background: #909399; }
.status-dot.primary { background: #409EFF; }
.status-dot.warning { background: #E6A23C; }
.status-dot.success { background: #67C23A; }

.column-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  flex: 1;
}

.count {
  background: rgba(0,0,0,0.05);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.column-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.project-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border-color: var(--color-primary-light);
}

.card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.project-type {
  font-size: 12px;
  color: var(--color-text-muted);
}

.project-title {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-heading);
}

.client-info {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 12px;
}

.progress-bar {
  margin-bottom: 12px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--color-text-muted);
  border-top: 1px solid var(--color-border-light);
  padding-top: 8px;
}
</style>
