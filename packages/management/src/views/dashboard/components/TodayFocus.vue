<template>
  <div class="today-focus">
    <!-- 标题 -->
    <div class="section-header">
      <h2>今日焦点</h2>
      <span class="date">{{ currentDate }}</span>
    </div>

    <!-- 焦点卡片网格 -->
    <div class="focus-grid">
      <!-- 待跟进线索 -->
      <div 
        class="focus-card" 
        :class="{ urgent: focusData.pendingLeads > 5 }"
        @click="navigateTo('/leads?status=NEW')"
      >
        <div class="focus-icon leads">
          <el-icon :size="20"><User /></el-icon>
        </div>
        <div class="focus-content">
          <span class="focus-label">待跟进线索</span>
          <span class="focus-value">{{ focusData.pendingLeads }}</span>
        </div>
        <div class="focus-arrow">
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>

      <!-- 今日任务 -->
      <div 
        class="focus-card"
        @click="navigateTo('/tasks?filter=today')"
      >
        <div class="focus-icon tasks">
          <el-icon :size="20"><List /></el-icon>
        </div>
        <div class="focus-content">
          <span class="focus-label">今日任务</span>
          <span class="focus-value">{{ focusData.todayTasks }}</span>
        </div>
        <div class="focus-arrow">
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>

      <!-- 逾期任务 -->
      <div 
        class="focus-card" 
        :class="{ danger: focusData.overdueTasks > 0 }"
        @click="navigateTo('/tasks?filter=overdue')"
      >
        <div class="focus-icon overdue">
          <el-icon :size="20"><Warning /></el-icon>
        </div>
        <div class="focus-content">
          <span class="focus-label">逾期任务</span>
          <span class="focus-value">{{ focusData.overdueTasks }}</span>
        </div>
        <div class="focus-badge" v-if="focusData.overdueTasks > 0">
          <el-icon :size="12"><WarningFilled /></el-icon>
        </div>
        <div class="focus-arrow">
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>

      <!-- 待审批方案 -->
      <div 
        class="focus-card"
        @click="navigateTo('/projects?filter=pending-approval')"
      >
        <div class="focus-icon approval">
          <el-icon :size="20"><Document /></el-icon>
        </div>
        <div class="focus-content">
          <span class="focus-label">待审批方案</span>
          <span class="focus-value">{{ focusData.pendingApprovals }}</span>
        </div>
        <div class="focus-arrow">
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>
    </div>

    <!-- 快速行动 -->
    <div class="quick-actions">
      <el-button 
        type="primary" 
        class="action-btn"
        @click="$emit('create-lead')"
      >
        <el-icon><Plus /></el-icon>
        新建线索
      </el-button>
      <el-button 
        class="action-btn"
        @click="$emit('create-task')"
      >
        <el-icon><Tickets /></el-icon>
        新建任务
      </el-button>
      <el-button 
        class="action-btn"
        @click="navigateTo('/workbench')"
      >
        <el-icon><Monitor /></el-icon>
        工作台
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useLeadStore, useTaskStore } from '@/stores'
import dayjs from 'dayjs'
import {
  User,
  List,
  Warning,
  Document,
  ArrowRight,
  WarningFilled,
  Plus,
  Tickets,
  Monitor,
} from '@element-plus/icons-vue'

defineEmits<{
  (e: 'create-lead'): void
  (e: 'create-task'): void
}>()

const router = useRouter()
const leadStore = useLeadStore()
const taskStore = useTaskStore()

const { stats: leadStats } = storeToRefs(leadStore)
const { stats: taskStats } = storeToRefs(taskStore)

const currentDate = dayjs().format('YYYY年MM月DD日')

// 计算焦点数据
const focusData = computed(() => {
  return {
    // 待跟进线索（NEW 状态）
    pendingLeads: leadStats.value?.byStatus?.NEW || 0,
    // 今日任务（使用 IN_PROGRESS 任务数作为近似）
    todayTasks: taskStats.value?.byStatus?.IN_PROGRESS || 0,
    // 逾期任务（模拟数据，实际应从 API 获取）
    overdueTasks: taskStats.value?.overdue || 0,
    // 待审批方案（模拟数据）
    pendingApprovals: 0,
  }
})

function navigateTo(path: string) {
  router.push(path)
}

onMounted(async () => {
  // 确保数据已加载
  if (!leadStats.value) {
    await leadStore.fetchStats()
  }
  if (!taskStats.value) {
    await taskStore.fetchStats()
  }
})
</script>

<style scoped>
.today-focus {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 8px;
}

.date {
  font-size: 14px;
  color: var(--color-text-muted);
  font-weight: 500;
}

.focus-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.focus-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.focus-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.focus-card.urgent {
  border-color: #f59e0b;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(253, 230, 138, 0.05) 100%);
}

.focus-card.danger {
  border-color: #ef4444;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(254, 202, 202, 0.05) 100%);
}

.focus-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.focus-icon.leads {
  background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
  color: white;
}

.focus-icon.tasks {
  background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
  color: white;
}

.focus-icon.overdue {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
  color: white;
}

.focus-icon.approval {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
}

.focus-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.focus-label {
  font-size: 13px;
  color: var(--color-text-muted);
  font-weight: 500;
}

.focus-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text);
  font-family: 'Outfit', sans-serif;
  line-height: 1;
}

.focus-badge {
  position: absolute;
  top: 12px;
  right: 36px;
  width: 20px;
  height: 20px;
  background: #ef4444;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.focus-arrow {
  color: var(--color-text-muted);
  transition: all 0.2s ease;
}

.focus-card:hover .focus-arrow {
  color: var(--color-primary);
  transform: translateX(4px);
}

/* 快速行动按钮 */
.quick-actions {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.action-btn {
  border-radius: 10px;
  padding: 10px 20px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
}

.action-btn:not(.el-button--primary) {
  background: var(--color-primary-light);
  border-color: transparent;
  color: var(--color-primary);
}

.action-btn:not(.el-button--primary):hover {
  background: rgba(34, 211, 238, 0.2);
}

/* 响应式 */
@media (max-width: 1200px) {
  .focus-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .focus-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-actions {
    flex-wrap: wrap;
  }
  
  .action-btn {
    flex: 1;
    min-width: 120px;
  }
}
</style>
