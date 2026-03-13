<template>
  <div class="kanban-page">
    <!-- 页头 -->
    <div class="page-header">
      <div>
        <h1 class="page-title">线索管道</h1>
        <p class="page-subtitle">拖拽线索卡片以更新其状态阶段</p>
      </div>
      <div class="header-actions">
        <el-button @click="$router.push('/leads')">
          <el-icon><List /></el-icon>
          列表视图
        </el-button>
        <el-button type="primary" :icon="Plus" @click="showCreate = true">新建线索</el-button>
      </div>
    </div>

    <!-- 管道统计 -->
    <div class="pipeline-stats">
      <div v-for="col in columns" :key="col.status" class="stat-chip" :style="{ '--col-color': col.color }">
        <span class="stat-dot" :style="{ background: col.color }"></span>
        <span class="stat-label">{{ col.label }}</span>
        <span class="stat-count">{{ getColumnLeads(col.status).length }}</span>
      </div>
    </div>

    <!-- 看板列 -->
    <div class="kanban-board">
      <div
        v-for="col in columns"
        :key="col.status"
        class="kanban-column"
        @dragover.prevent
        @drop="handleDrop($event, col.status)"
      >
        <div class="column-header" :style="{ borderTopColor: col.color }">
          <div class="column-title">
            <span class="column-icon">{{ col.icon }}</span>
            <span>{{ col.label }}</span>
          </div>
          <el-tag size="small" round>{{ getColumnLeads(col.status).length }}</el-tag>
        </div>

        <div class="column-body">
          <!-- 骨架屏 -->
          <template v-if="loading">
            <el-skeleton v-for="i in 3" :key="i" animated class="card-skeleton">
              <template #template>
                <el-skeleton-item variant="text" style="width: 60%" />
                <el-skeleton-item variant="text" style="width: 40%; margin-top: 8px" />
                <el-skeleton-item variant="text" style="width: 80%; margin-top: 8px" />
              </template>
            </el-skeleton>
          </template>

          <!-- 线索卡片 -->
          <div
            v-for="lead in getColumnLeads(col.status)"
            :key="lead.id"
            class="kanban-card"
            draggable="true"
            @dragstart="handleDragStart($event, lead)"
            @click="$router.push(`/leads/${lead.id}`)"
          >
            <div class="card-top">
              <el-avatar :size="32" class="card-avatar">{{ lead.contactName?.[0] }}</el-avatar>
              <div class="card-meta">
                <span class="card-name">{{ lead.contactName }}</span>
                <span v-if="lead.companyName" class="card-company">{{ lead.companyName }}</span>
              </div>
            </div>

            <div v-if="lead.serviceTypes?.length" class="card-tags">
              <el-tag v-for="svc in lead.serviceTypes.slice(0, 2)" :key="svc" size="small" type="info">
                {{ svc }}
              </el-tag>
              <el-tag v-if="lead.serviceTypes.length > 2" size="small" type="info">
                +{{ lead.serviceTypes.length - 2 }}
              </el-tag>
            </div>

            <div class="card-bottom">
              <ScoreRing :score="lead.score || 0" :size="28" :strokeWidth="3" />
              <span class="card-date">{{ formatDate(lead.createdAt) }}</span>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="!loading && getColumnLeads(col.status).length === 0" class="column-empty">
            <span>暂无线索</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建线索弹窗 -->
    <LeadFormDialog v-model:visible="showCreate" @success="handleCreateSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useLeadStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { Plus, List } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import LeadFormDialog from './components/LeadFormDialog.vue'
import ScoreRing from '@/components/common/ScoreRing.vue'
import type { Lead } from '@tonghai/shared/types'

// 管道阶段配置
const columns = [
  { status: 'NEW', label: '新线索', icon: '🆕', color: '#6366F1' },
  { status: 'CONTACTED', label: '已联系', icon: '📞', color: '#0891B2' },
  { status: 'QUALIFIED', label: '已确认', icon: '✅', color: '#059669' },
  { status: 'IN_PROGRESS', label: '进行中', icon: '🔄', color: '#D97706' },
  { status: 'CONVERTED', label: '已转化', icon: '🎉', color: '#16A34A' },
  { status: 'LOST', label: '已流失', icon: '❌', color: '#DC2626' },
]

const leadStore = useLeadStore()
const { leads, loading } = storeToRefs(leadStore)
const showCreate = ref(false)
let draggedLead: Lead | null = null

// 按状态分组
function getColumnLeads(status: string): Lead[] {
  return leads.value.filter(l => l.status === status)
}

// 拖拽事件
function handleDragStart(e: DragEvent, lead: Lead): void {
  draggedLead = lead
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', lead.id)
  }
}

async function handleDrop(_e: DragEvent, newStatus: string): Promise<void> {
  if (!draggedLead || draggedLead.status === newStatus) return

  try {
    await leadStore.updateLead(draggedLead.id, { status: newStatus as Lead['status'] })
  } catch {
    // 更新失败将自动保持原状态
  }
  draggedLead = null
}

// 辅助函数
function formatDate(date: string | Date): string {
  return dayjs(date).format('MM/DD')
}

async function handleCreateSuccess(): Promise<void> {
  await leadStore.fetchLeads({}, { page: 1, limit: 200 })
}

onMounted(async () => {
  // 加载所有线索（看板需要全量数据）
  await leadStore.fetchLeads({}, { page: 1, limit: 200 })
})
</script>

<style scoped>
.kanban-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  color: var(--color-text);
  margin: 0 0 4px 0;
}

.page-subtitle {
  color: var(--color-text-muted);
  font-size: 14px;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

/* 管道统计条 */
.pipeline-stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stat-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  font-size: 13px;
  transition: all 0.2s;
}

.stat-chip:hover {
  border-color: var(--col-color);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--col-color) 15%, transparent);
}

.stat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.stat-label {
  color: var(--color-text);
  font-weight: 500;
}

.stat-count {
  color: var(--color-text-muted);
  font-weight: 700;
  font-size: 14px;
}

/* 看板 */
.kanban-board {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  min-height: 0;
  overflow-x: auto;
  padding-bottom: 8px;
}

.kanban-column {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  min-width: 220px;
  transition: box-shadow 0.2s;
}

.kanban-column:hover {
  box-shadow: var(--shadow-sm);
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 16px 12px;
  border-top: 3px solid transparent;
  border-radius: 16px 16px 0 0;
}

.column-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 14px;
  color: var(--color-text);
}

.column-icon {
  font-size: 16px;
}

.column-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 卡片 */
.kanban-card {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 14px;
  cursor: grab;
  transition: all 0.2s ease;
  user-select: none;
}

.kanban-card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.kanban-card:active {
  cursor: grabbing;
  opacity: 0.7;
  transform: scale(0.97);
}

.card-top {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}

.card-avatar {
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  color: white;
  font-weight: 700;
  flex-shrink: 0;
}

.card-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.card-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-company {
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-date {
  font-size: 12px;
  color: var(--color-text-muted);
}

/* 评分圆环 */
.score-ring {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.score-ring.high {
  background: rgba(22, 163, 74, 0.1);
  color: #16A34A;
  border: 2px solid rgba(22, 163, 74, 0.3);
}

.score-ring.medium {
  background: rgba(217, 119, 6, 0.1);
  color: #D97706;
  border: 2px solid rgba(217, 119, 6, 0.3);
}

.score-ring.low {
  background: rgba(107, 114, 128, 0.1);
  color: #6B7280;
  border: 2px solid rgba(107, 114, 128, 0.3);
}

.column-empty {
  padding: 24px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 13px;
  border: 1px dashed var(--color-border);
  border-radius: 10px;
}

.card-skeleton {
  padding: 14px;
  background: var(--color-background);
  border-radius: 12px;
}

/* 响应式 */
@media (max-width: 1400px) {
  .kanban-board {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .kanban-board {
    grid-template-columns: 1fr;
  }
  
  .pipeline-stats {
    overflow-x: auto;
    flex-wrap: nowrap;
  }
}
</style>
