<template>
  <div class="calendar-view">
    <div class="header-actions">
      <h2>工作日历</h2>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">新建日程</el-button>
    </div>

    <el-card shadow="never" class="calendar-container" v-loading="loading">
      <el-calendar ref="calendarRef" v-model="currentDate">
        <template #date-cell="{ data }">
          <div 
            class="date-cell" 
            :class="{ 'is-selected': data.isSelected, 'is-today': data.type === 'today' }"
            @dragover.prevent
            @drop="onDrop($event, data.day)"
            @click.stop="openCreateDialogForDate(data.day)"
          >
            <div class="date-number">{{ data.day.split('-').slice(2).join('') }}</div>
            
            <div class="event-list">
              <vue-draggable
                :list="getEventsForDate(data.day)"
                :group="{ name: 'events', pull: true, put: true }"
                item-key="id"
                class="drag-area"
                @change="onDragChange($event, data.day)"
                :component-data="{ name: 'fade' }"
                ghost-class="ghost-event"
              >
                <template #item="{ element }">
                  <div 
                    class="event-tag" 
                    :class="[`event-type-${element.type.toLowerCase()}`, { 'is-overdue': element.isOverdue }]"
                    @click.stop="onEventClick(element)"
                  >
                    <span class="event-time" v-if="element.type === 'APPOINTMENT'">
                      {{ formatTime(element.dueDate) }}
                    </span>
                    <span class="event-title">{{ element.title }}</span>
                  </div>
                </template>
              </vue-draggable>
            </div>
          </div>
        </template>
      </el-calendar>
    </el-card>

    <!-- 新建/编辑日程弹窗 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="editingEvent ? '编辑日程' : '新建日程'" 
      width="500px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="form.type" :disabled="!!editingEvent">
            <el-radio-button value="TASK">任务</el-radio-button>
            <el-radio-button value="APPOINTMENT">预约</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="输入日程标题" />
        </el-form-item>
        <el-form-item label="日期时间" prop="dueDate">
          <el-date-picker
            v-model="form.dueDate"
            type="datetime"
            placeholder="选择日期和时间"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="备注说明" prop="description">
          <el-input 
            v-model="form.description" 
            type="textarea" 
            :rows="3" 
            placeholder="输入详细说明..." 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEvent" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import VueDraggable from 'vuedraggable'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import type { FollowUpItem } from '@/api/workflowApi'
import { taskApi, appointmentApi } from '@/api'
import { useAuthStore } from '@/stores/authStore'
import { logger } from '@/utils/logger'

// 状态
const authStore = useAuthStore()
const loading = ref(false)
const currentDate = ref(new Date())
const events = ref<FollowUpItem[]>([])

// 弹窗状态
const dialogVisible = ref(false)
const editingEvent = ref<FollowUpItem | null>(null)
const saving = ref(false)
const formRef = ref<FormInstance>()

const form = ref({
  type: 'TASK',
  title: '',
  description: '',
  dueDate: new Date()
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  dueDate: [{ required: true, message: '请选择日期', trigger: 'change' }]
}

// 加载数据
async function loadEvents() {
  loading.value = true
  try {
    const userId = authStore.user?.id
    if (!userId) return

    // 获取当前时间的前后范围，简单粗暴：获取所有不分页的数据（通常日历会带按月查询，这里目前没有分页时展示全部）
    // 后端 tasks 接口的 limit 最大限制为 100，所以这里用 100
    const [tasksRes, apptsRes] = await Promise.all([
      taskApi.getList({ assignedToId: userId }, { page: 1, limit: 100 }),
      appointmentApi.getAppointments({ userId, page: 1, limit: 100 })
    ])

    const formattedEvents: FollowUpItem[] = []

    // 转换 Tasks
    if (tasksRes.data) {
      tasksRes.data.forEach((task: any) => {
        formattedEvents.push({
          id: task.id,
          type: 'TASK',
          title: task.title,
          description: task.description,
          priority: task.priority,
          dueDate: task.dueDate,
          status: task.status,
          isOverdue: new Date(task.dueDate) < new Date() && !['DONE', 'CANCELLED'].includes(task.status)
        })
      })
    }

    // 转换 Appointments
    const apptsData = (apptsRes as any).data || apptsRes // depending on how generic api returns
    if (Array.isArray(apptsData)) {
      apptsData.forEach((apt: any) => {
        formattedEvents.push({
          id: apt.id,
          type: 'APPOINTMENT',
          title: apt.title,
          description: apt.description,
          priority: 'HIGH',
          dueDate: apt.startTime,
          status: apt.status,
          isOverdue: new Date(apt.startTime) < new Date() && !['COMPLETED', 'CANCELLED'].includes(apt.status),
          relatedEntity: {
              type: 'APPOINTMENT',
              id: apt.id,
              name: 'Appointment',
              ...apt // Store raw data for endDate
          }
        })
      })
    } else if (apptsData.data) {
       apptsData.data.forEach((apt: any) => {
        formattedEvents.push({
          id: apt.id,
          type: 'APPOINTMENT',
          title: apt.title,
          description: apt.description,
          priority: 'HIGH',
          dueDate: apt.startTime,
          status: apt.status,
          isOverdue: new Date(apt.startTime) < new Date() && !['COMPLETED', 'CANCELLED'].includes(apt.status),
           relatedEntity: {
              type: 'APPOINTMENT',
              id: apt.id,
              name: 'Appointment',
              ...apt 
          }
        })
      })
    }

    // 更新到响应式变量
    events.value = formattedEvents

  } catch (error: any) {
    ElMessage.error(error.message || '加载日程失败')
  } finally {
    loading.value = false
  }
}

// 提取指定日期的事件
const eventsMap = computed(() => {
  const map = new Map<string, FollowUpItem[]>()
  events.value.forEach(event => {
    if (!event.dueDate) {
        logger.warn('CalendarView', 'Event without dueDate:', event)
        return
    }
    const dObj = new Date(event.dueDate as string)
    // 获取本地时间戳避免时区偏差导致日期差异
    const year = dObj.getFullYear()
    const month = String(dObj.getMonth() + 1).padStart(2, '0')
    const date = String(dObj.getDate()).padStart(2, '0')
    const dStr = `${year}-${month}-${date}`
    
    if (!map.has(dStr)) {
      map.set(dStr, [])
    }
    map.get(dStr)!.push(event)
  })
  
  return map
})

function getEventsForDate(dateStr: string) {
  return eventsMap.value.get(dateStr) || []
}

// 格式化时间
function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 拖拽相关
function onDrop(_event: DragEvent, _targetDate: string) {
  // 备用 HTML5 原生 Drop 占位，当前主要依赖 VueDraggable 的 change 事件
}

async function onDragChange(evt: any, targetDateStr: string) {
  if (evt.added) {
    const item = evt.added.element as FollowUpItem
    // 发现跨日期拖拽，触发 API 更新
    const oldDateObj = item.dueDate ? new Date(item.dueDate as string) : new Date()
    const newDateObj = new Date(targetDateStr)
    // 保持原来的时分秒
    newDateObj.setHours(oldDateObj.getHours(), oldDateObj.getMinutes(), oldDateObj.getSeconds())
    
    try {
      if (item.type === 'TASK') {
        // 调用修改 Task 接口
        await taskApi.update(item.id, { dueDate: newDateObj.toISOString() })
        ElMessage.success(`任务 [${item.title}] 已变更为 ${targetDateStr}`)
      } else if (item.type === 'APPOINTMENT') {
        // 预约变更时间
        const oldEndTime = (item.relatedEntity as any)?.endDate ? new Date((item.relatedEntity as any).endDate as string) : new Date(oldDateObj.getTime() + 60*60*1000)
        const duration = oldEndTime.getTime() - oldDateObj.getTime()
        const newEndTimeObj = new Date(newDateObj.getTime() + duration)
        
        await appointmentApi.update(item.id, { 
            startTime: newDateObj.toISOString(),
            endTime: newEndTimeObj.toISOString()
        })
        ElMessage.success(`预约 [${item.title}] 已变更为 ${targetDateStr}`)
      } else {
          // LEAD/EVENT 等暂不支持拖拽修改时间，通过刷新复原
          ElMessage.warning('该类型日程不支持拖拽修改时间')
          loadEvents()
          return
      }
      
      // 更新本地状态
      const index = events.value.findIndex(e => e.id === item.id)
      if (index > -1) {
        events.value[index].dueDate = newDateObj.toISOString()
        events.value = [...events.value] // 触发重新计算
      }
    } catch (e: any) {
      ElMessage.error('日程时间更新失败, 请刷新重试')
      loadEvents()
    }
  }
}

// 新建/编辑交互
function openCreateDialog() {
  editingEvent.value = null
  form.value = {
    type: 'TASK',
    title: '',
    description: '',
    dueDate: currentDate.value
  }
  dialogVisible.value = true
}

function openCreateDialogForDate(dateStr: string) {
  editingEvent.value = null
  const dateObj = new Date(dateStr)
  // 默认设置为 10:00 AM
  dateObj.setHours(10, 0, 0, 0)
  form.value = {
    type: 'TASK',
    title: '',
    description: '',
    dueDate: dateObj
  }
  dialogVisible.value = true
}

function onEventClick(event: FollowUpItem) {
  editingEvent.value = event
  form.value = {
    type: event.type,
    title: event.title,
    description: event.description || '',
    dueDate: event.dueDate ? new Date(event.dueDate as string) : new Date()
  }
  dialogVisible.value = true
}

async function saveEvent() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true
      try {
        if (editingEvent.value) {
            // Edit mode
            if (form.value.type === 'TASK') {
                await taskApi.update(editingEvent.value.id, {
                    title: form.value.title,
                    description: form.value.description,
                    dueDate: form.value.dueDate.toISOString(),
                    assignedToId: authStore.user?.id
                })
            } else if (form.value.type === 'APPOINTMENT') {
                 // Adjusting appointment times
                 const start = form.value.dueDate.toISOString()
                 // Just adding 1 hour for now on edits as fallback
                 const end = new Date(form.value.dueDate.getTime() + 60*60*1000).toISOString()
                 await appointmentApi.update(editingEvent.value.id, {
                     title: form.value.title,
                     startTime: start,
                     endTime: end,
                     userId: authStore.user?.id
                 })
            }
        } else {
            // Create mode
             if (form.value.type === 'TASK') {
                await taskApi.create({
                    title: form.value.title,
                    description: form.value.description,
                    dueDate: form.value.dueDate.toISOString(),
                    priority: 'MEDIUM',
                    assignedToId: authStore.user?.id
                })
            } else if (form.value.type === 'APPOINTMENT') {
                await appointmentApi.create({
                    title: form.value.title,
                    startTime: form.value.dueDate.toISOString(),
                    endTime: new Date(form.value.dueDate.getTime() + 60 * 60 * 1000).toISOString(),
                    userId: authStore.user?.id
                })
            }
        }
        
        ElMessage.success('保存成功')
        dialogVisible.value = false
        loadEvents()
      } catch (e: any) {
        ElMessage.error(e.message || '保存失败')
      } finally {
        saving.value = false
      }
    }
  })
}

onMounted(() => {
  loadEvents()
})
</script>

<style scoped>
.calendar-view {
  padding: 24px;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-actions h2 {
  margin: 0;
  font-size: 24px;
  color: var(--color-text);
}

.date-cell {
  height: 100px;
  display: flex;
  flex-direction: column;
  padding: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.date-cell:hover {
  background-color: var(--color-surface-hover);
}

.date-number {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  text-align: right;
  padding-right: 4px;
}

.is-today .date-number {
  color: var(--color-primary);
  font-weight: bold;
}

.event-list {
  flex: 1;
  overflow-y: auto;
  min-height: 20px;
}

.drag-area {
  min-height: 100%;
}

.event-tag {
  font-size: 12px;
  padding: 4px 6px;
  margin-bottom: 4px;
  border-radius: 4px;
  cursor: grab;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  transition: transform 0.1s;
}

.event-tag:active {
  cursor: grabbing;
}

.event-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.event-type-task {
  background-color: #f0f9eb;
  color: #67c23a;
  border-left: 3px solid #67c23a;
}

.event-type-appointment {
  background-color: #fdf6ec;
  color: #e6a23c;
  border-left: 3px solid #e6a23c;
}

.event-type-lead {
  background-color: #ecf5ff;
  color: #409eff;
  border-left: 3px solid #409eff;
}

.event-type-event {
  background-color: #fef0f0;
  color: #f56c6c;
  border-left: 3px solid #f56c6c;
}

.event-tag.is-overdue {
  border: 1px dashed #f56c6c;
  opacity: 0.8;
}

.event-time {
  font-weight: 600;
  opacity: 0.8;
}

.ghost-event {
  opacity: 0.5;
  background-color: #e4e7ed;
  border: 1px dashed #909399;
}

/* 覆盖 el-calendar 默认样式 */
:deep(.el-calendar-day) {
  padding: 0 !important;
  height: auto !important;
  min-height: 110px;
}
</style>
