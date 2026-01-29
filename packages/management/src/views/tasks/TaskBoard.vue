<template>
  <div class="task-board">
    <div class="page-header">
      <h2 class="page-title">任务看板</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon> 新建任务
      </el-button>
    </div>

    <div class="board-container" v-loading="loading">
      <div 
        v-for="status in statusOrder" 
        :key="status" 
        class="board-column"
      >
        <div class="column-header">
          <span class="column-title">{{ getStatusLabel(status) }}</span>
          <el-badge :value="getColumnCount(status)" :type="getStatusBadgeType(status)" />
        </div>
        
        <div class="column-content">
          <VueDraggable
            v-if="boardData?.[status]"
            v-model="boardData[status]"
            group="tasks"
            item-key="id"
            class="draggable-list"
            @change="(e: any) => handleDragChange(e, status)"
            :data-status="status"
          >
            <template #item="{ element: task }">
              <div
                class="task-card"
                @click="handleTaskClick(task)"
              >
                <div class="task-title">{{ task.title }}</div>
                <div class="task-meta">
                  <el-tag 
                    :type="getPriorityType(task.priority)" 
                    size="small"
                  >
                    {{ getPriorityLabel(task.priority) }}
                  </el-tag>
                  <span v-if="task.dueDate" class="due-date" :class="{ overdue: isOverdue(task.dueDate) }">
                    {{ formatDueDate(task.dueDate) }}
                  </span>
                </div>
                <div class="task-footer">
                  <span v-if="task.lead" class="related-lead">
                    <el-icon><User /></el-icon>
                    {{ task.lead.contactName }}
                  </span>
                  <el-avatar 
                    v-if="task.assignedTo" 
                    :size="24"
                    class="assignee-avatar"
                  >
                    {{ task.assignedTo.name?.[0] }}
                  </el-avatar>
                </div>
              </div>
            </template>
          </VueDraggable>
          
          <el-empty 
            v-if="!boardData?.[status]?.length" 
            description="暂无任务" 
            :image-size="60"
          />
        </div>
      </div>
    </div>

    <!-- 新建任务对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="新建任务"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入任务标题" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入任务描述"
          />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="form.priority" style="width: 100%">
            <el-option label="低" value="LOW" />
            <el-option label="中" value="MEDIUM" />
            <el-option label="高" value="HIGH" />
            <el-option label="紧急" value="CRITICAL" />
          </el-select>
        </el-form-item>
        <el-form-item label="截止日期" prop="dueDate">
          <el-date-picker
            v-model="form.dueDate"
            type="datetime"
            placeholder="选择截止日期"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCreate">
          创建
        </el-button>
      </template>
    </el-dialog>

    <!-- 任务详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="任务详情"
      width="500px"
    >
      <el-descriptions v-if="selectedTask" :column="1" border>
        <el-descriptions-item label="标题">{{ selectedTask.title }}</el-descriptions-item>
        <el-descriptions-item label="描述">{{ selectedTask.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-select 
            v-model="selectedTask.status" 
            @change="handleStatusChange"
            style="width: 120px"
          >
            <el-option 
              v-for="s in statusOrder" 
              :key="s" 
              :label="getStatusLabel(s)" 
              :value="s" 
            />
          </el-select>
        </el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag :type="getPriorityType(selectedTask.priority)">
            {{ getPriorityLabel(selectedTask.priority) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="截止日期">
          {{ selectedTask.dueDate ? formatDueDate(selectedTask.dueDate) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="负责人">
          {{ selectedTask.assignedTo?.name || '-' }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="danger" @click="handleDeleteTask">删除</el-button>
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, User } from '@element-plus/icons-vue'
import VueDraggable from 'vuedraggable'
import { useTaskStore } from '@/stores'
import type { Task, TaskStatus } from '@tonghai/shared/types'

const taskStore = useTaskStore()
const { boardData, loading } = storeToRefs(taskStore)

const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const selectedTask = ref<Task | null>(null)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const statusOrder: TaskStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELLED']

const form = reactive({
  title: '',
  description: '',
  priority: 'MEDIUM' as string,
  dueDate: null as Date | null,
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入任务标题', trigger: 'blur' }],
}

onMounted(() => {
  taskStore.fetchBoard()
})

function getColumnCount(status: TaskStatus): number {
  return boardData.value?.[status]?.length || 0
}

function handleTaskClick(task: Task) {
  selectedTask.value = { ...task }
  showDetailDialog.value = true
}

async function handleCreate() {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      await taskStore.createTask({
        title: form.title,
        description: form.description,
        priority: form.priority as any,
        dueDate: form.dueDate?.toISOString(),
      })
      ElMessage.success('创建成功')
      showCreateDialog.value = false
      resetForm()
      taskStore.fetchBoard()
    } catch (error: any) {
      ElMessage.error(error.message || '创建失败')
    } finally {
      submitting.value = false
    }
  })
}

async function handleDragChange(event: any, newStatus: TaskStatus) {
  // 只处理添加到新列的事件 (added)
  // removed 事件不需要处理，vuedraggable 会自动从原数组移除
  // moved 事件 (同一列内排序) 暂不处理持久化，只更新 UI
  if (event.added) {
    const task = event.added.element as Task
    try {
      // 调用 Store 的 moveTask 更新后端状态
      await taskStore.moveTask(task.id, newStatus)
      ElMessage.success('任务状态已更新')
    } catch (error: any) {
      ElMessage.error(error.message || '移动失败')
      // 如果失败，应该刷新看板以重置 UI (简单回滚)
      taskStore.fetchBoard()
    }
  }
}

async function handleStatusChange(newStatus: TaskStatus) {
  if (!selectedTask.value) return
  
  try {
    await taskStore.updateTask(selectedTask.value.id, { status: newStatus })
    ElMessage.success('状态已更新')
  } catch (error: any) {
    ElMessage.error(error.message || '更新失败')
  }
}

async function handleDeleteTask() {
  if (!selectedTask.value) return
  
  try {
    await ElMessageBox.confirm('确定要删除此任务吗？', '删除确认', { type: 'warning' })
    await taskStore.deleteTask(selectedTask.value.id)
    ElMessage.success('删除成功')
    showDetailDialog.value = false
    selectedTask.value = null
  } catch {
    // 用户取消
  }
}

function resetForm() {
  form.title = ''
  form.description = ''
  form.priority = 'MEDIUM'
  form.dueDate = null
}

function getStatusLabel(status: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    NOT_STARTED: '待开始',
    IN_PROGRESS: '进行中',
    BLOCKED: '已阻塞',
    DONE: '已完成',
    CANCELLED: '已取消',
  }
  return map[status]
}

function getStatusBadgeType(status: TaskStatus): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<TaskStatus, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    NOT_STARTED: 'info',
    IN_PROGRESS: 'warning',
    BLOCKED: 'danger',
    DONE: 'success',
    CANCELLED: 'info',
  }
  return map[status]
}

function getPriorityLabel(priority: string): string {
  const map: Record<string, string> = {
    LOW: '低',
    MEDIUM: '中',
    HIGH: '高',
    CRITICAL: '紧急',
  }
  return map[priority] || priority
}

function getPriorityType(priority: string): 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    LOW: 'info',
    MEDIUM: 'warning',
    HIGH: 'danger',
    CRITICAL: 'danger',
  }
  return map[priority] || 'info'
}

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  
  if (days < 0) return `逾期 ${Math.abs(days)} 天`
  if (days === 0) return '今天'
  if (days === 1) return '明天'
  return `${days} 天后`
}

function isOverdue(dateStr: string): boolean {
  return new Date(dateStr) < new Date()
}
</script>

<style scoped>
.task-board {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-shrink: 0;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.board-container {
  flex: 1;
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 16px;
}

.board-column {
  flex: 1;
  min-width: 280px;
  max-width: 320px;
  background: #f5f6f7;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.column-header {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e8e8e8;
}

.column-title {
  font-weight: 600;
  color: #333;
}

.column-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.draggable-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 100px; /* 确保空列也有放置区域 */
  height: 100%;
}

.task-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: box-shadow 0.3s;
}

.task-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.task-title {
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.4;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.due-date {
  font-size: 12px;
  color: #999;
}

.due-date.overdue {
  color: #f5222d;
}

.task-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.related-lead {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.assignee-avatar {
  flex-shrink: 0;
}
</style>
