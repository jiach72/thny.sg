<template>
  <div class="activity-timeline">
    <!-- 头部 -->
    <div class="timeline-header">
      <h3>活动记录</h3>
      <div class="filter-tabs">
        <button 
          v-for="filter in filters" 
          :key="filter.value"
          class="filter-tab"
          :class="{ active: activeFilter === filter.value }"
          @click="activeFilter = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <!-- 添加新活动 -->
    <div class="add-activity" v-if="showAddForm">
      <el-input
        v-model="newNote"
        type="textarea"
        :rows="2"
        placeholder="添加备注或记录活动..."
        class="note-input"
      />
      <div class="add-actions">
        <el-button size="small" @click="cancelAdd">取消</el-button>
        <el-button type="primary" size="small" @click="submitNote" :loading="submitting">
          添加记录
        </el-button>
      </div>
    </div>
    <el-button 
      v-else 
      class="add-btn"
      @click="showAddForm = true"
    >
      <el-icon><Plus /></el-icon>
      添加活动记录
    </el-button>

    <!-- 时间线 -->
    <div class="timeline-container" v-if="filteredActivities.length > 0">
      <div 
        v-for="(activity, index) in filteredActivities" 
        :key="activity.id"
        class="timeline-item"
        :class="activity.type"
      >
        <!-- 时间线连接 -->
        <div class="timeline-line" v-if="index < filteredActivities.length - 1"></div>
        
        <!-- 图标 -->
        <div class="timeline-icon" :style="{ background: getTypeColor(activity.type) }">
          <el-icon :size="14"><component :is="getTypeIcon(activity.type)" /></el-icon>
        </div>

        <!-- 内容 -->
        <div class="timeline-content">
          <div class="content-header">
            <span class="actor">{{ activity.actor?.name || '系统' }}</span>
            <span class="action">{{ getActionLabel(activity.type) }}</span>
            <span class="time">{{ formatTime(activity.createdAt) }}</span>
          </div>
          
          <div class="content-body" v-if="activity.description">
            {{ activity.description }}
          </div>

          <!-- 详情（状态变更等） -->
          <div class="content-details" v-if="activity.metadata">
            <template v-if="activity.type === 'status_change'">
              <el-tag size="small" type="info">{{ activity.metadata.from }}</el-tag>
              <el-icon><Right /></el-icon>
              <el-tag size="small" type="success">{{ activity.metadata.to }}</el-tag>
            </template>
            <template v-else-if="activity.type === 'email'">
              <div class="email-preview">
                <span class="email-subject">主题: {{ activity.metadata.subject }}</span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-else>
      <el-icon :size="40"><Document /></el-icon>
      <p>暂无活动记录</p>
      <span>活动记录将在此显示</span>
    </div>

    <!-- 加载更多 -->
    <div class="load-more" v-if="hasMore && filteredActivities.length > 0">
      <el-button text @click="loadMore" :loading="loading">
        加载更多
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Plus,
  Right,
  Document,
  Edit,
  Message,
  Phone,
  ChatDotRound,
  Tickets,
  Star,
  CircleCheck,
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

// 活动类型定义
interface Activity {
  id: string
  type: 'note' | 'email' | 'call' | 'meeting' | 'status_change' | 'task' | 'system'
  description?: string
  actor?: { id: string; name: string }
  metadata?: Record<string, any>
  createdAt: string
}

const props = defineProps<{
  activities: Activity[]
  hasMore?: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'add-note', note: string): void
  (e: 'load-more'): void
}>()

// 筛选选项
const filters = [
  { label: '全部', value: 'all' },
  { label: '备注', value: 'note' },
  { label: '邮件', value: 'email' },
  { label: '通话', value: 'call' },
  { label: '状态', value: 'status_change' },
]

const activeFilter = ref('all')
const showAddForm = ref(false)
const newNote = ref('')
const submitting = ref(false)

// 过滤后的活动
const filteredActivities = computed(() => {
  if (activeFilter.value === 'all') {
    return props.activities
  }
  return props.activities.filter(a => a.type === activeFilter.value)
})

// 获取类型图标
function getTypeIcon(type: string) {
  const icons: Record<string, typeof Edit> = {
    note: Edit,
    email: Message,
    call: Phone,
    meeting: ChatDotRound,
    status_change: CircleCheck,
    task: Tickets,
    system: Star,
  }
  return icons[type] || Document
}

// 获取类型颜色
function getTypeColor(type: string) {
  const colors: Record<string, string> = {
    note: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
    email: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
    call: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    meeting: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
    status_change: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
    task: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)',
    system: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
  }
  return colors[type] || colors.system
}

// 获取操作标签
function getActionLabel(type: string) {
  const labels: Record<string, string> = {
    note: '添加了备注',
    email: '发送了邮件',
    call: '进行了通话',
    meeting: '安排了会议',
    status_change: '更新了状态',
    task: '创建了任务',
    system: '系统记录',
  }
  return labels[type] || '进行了操作'
}

// 格式化时间
function formatTime(dateStr: string) {
  const date = dayjs(dateStr)
  const now = dayjs()
  
  if (now.diff(date, 'day') < 1) {
    return date.fromNow()
  }
  if (now.diff(date, 'day') < 7) {
    return date.format('dddd HH:mm')
  }
  return date.format('MM月DD日 HH:mm')
}

// 添加备注
async function submitNote() {
  if (!newNote.value.trim()) return
  
  submitting.value = true
  try {
    emit('add-note', newNote.value)
    newNote.value = ''
    showAddForm.value = false
  } finally {
    submitting.value = false
  }
}

function cancelAdd() {
  newNote.value = ''
  showAddForm.value = false
}

function loadMore() {
  emit('load-more')
}
</script>

<style scoped>
.activity-timeline {
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 16px;
  padding: 20px;
}

.timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.timeline-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text, #1e293b);
}

.filter-tabs {
  display: flex;
  gap: 4px;
  background: var(--color-background, #f1f5f9);
  border-radius: 8px;
  padding: 4px;
}

.filter-tab {
  padding: 6px 12px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-muted, #64748b);
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-tab:hover {
  color: var(--color-text, #1e293b);
}

.filter-tab.active {
  background: var(--color-surface, #fff);
  color: var(--color-primary, #0891b2);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 添加活动 */
.add-btn {
  width: 100%;
  border-style: dashed;
  color: var(--color-text-muted, #64748b);
  margin-bottom: 20px;
}

.add-activity {
  background: var(--color-background, #f8fafc);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.note-input {
  margin-bottom: 12px;
}

.add-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 时间线 */
.timeline-container {
  position: relative;
  padding-left: 36px;
}

.timeline-item {
  position: relative;
  padding-bottom: 24px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-line {
  position: absolute;
  left: -24px;
  top: 32px;
  bottom: 0;
  width: 2px;
  background: var(--color-border, #e2e8f0);
}

.timeline-icon {
  position: absolute;
  left: -36px;
  top: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 1;
}

.timeline-content {
  background: var(--color-background, #f8fafc);
  border-radius: 12px;
  padding: 14px 16px;
  transition: all 0.2s ease;
}

.timeline-content:hover {
  background: var(--color-surface-hover, #f1f5f9);
}

.content-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.actor {
  font-weight: 600;
  color: var(--color-text, #1e293b);
  font-size: 14px;
}

.action {
  color: var(--color-text-muted, #64748b);
  font-size: 13px;
}

.time {
  margin-left: auto;
  font-size: 12px;
  color: var(--color-text-muted, #94a3b8);
}

.content-body {
  font-size: 14px;
  color: var(--color-text, #334155);
  line-height: 1.6;
}

.content-details {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--color-border, #e2e8f0);
}

.email-preview {
  background: var(--color-surface, #fff);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
}

.email-subject {
  color: var(--color-text, #334155);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: var(--color-text-muted, #94a3b8);
}

.empty-state p {
  margin: 12px 0 4px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text, #64748b);
}

.empty-state span {
  font-size: 13px;
}

/* 加载更多 */
.load-more {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border, #e2e8f0);
}
</style>
