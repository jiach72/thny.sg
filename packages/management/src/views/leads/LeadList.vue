<template>
  <div class="lead-list">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">线索管理</h1>
        <p class="page-subtitle">管理销售线索的获取、跟进与转化</p>
      </div>
      <div class="page-header-right">
        <span class="page-badge">共 {{ total }} 条线索</span>
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新建线索
        </el-button>
        <el-button @click="handleImport">
          <el-icon><Upload /></el-icon>
            导入
        </el-button>
      </div>
    </div>

    <!-- 状态统计卡片 -->
    <div class="stat-cards">
      <div 
        v-for="stat in statusStats" 
        :key="stat.status" 
        class="stat-card"
        :class="{ active: filters.status === stat.status }"
        @click="filterByStatus(stat.status)"
      >
        <div class="stat-icon" :style="{ background: stat.gradient }">
          <el-icon><component :is="stat.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stat.count }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      </div>
    </div>

    <!-- 搜索和筛选栏 -->
    <div class="filter-bar">
      <div class="filter-left">
        <el-input
          v-model="filters.search"
          placeholder="搜索联系人、公司或邮箱..."
          class="search-input"
          clearable
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #prefix>
            <el-icon class="search-icon"><Search /></el-icon>
          </template>
        </el-input>

        <el-select 
          v-model="filters.sourceChannel" 
          placeholder="来源渠道" 
          clearable
          class="filter-select"
          @change="handleSearch"
        >
          <el-option label="官网表单" value="website_form" />
          <el-option label="客户推荐" value="referral" />
          <el-option label="活动获客" value="event" />
          <el-option label="其他" value="other" />
        </el-select>

        <el-select 
          v-model="filters.assignedTo" 
          placeholder="负责人" 
          clearable
          class="filter-select"
          @change="handleSearch"
        >
          <el-option v-for="user in assignees" :key="user.id" :label="user.name" :value="user.id" />
        </el-select>
      </div>

      <div class="filter-right">
        <el-button-group class="view-toggle">
          <el-button :type="viewMode === 'table' ? 'primary' : 'default'" @click="viewMode = 'table'">
            <el-icon><List /></el-icon>
          </el-button>
          <el-button :type="viewMode === 'card' ? 'primary' : 'default'" @click="viewMode = 'card'">
            <el-icon><Grid /></el-icon>
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 表格视图 -->
    <div v-if="viewMode === 'table'" class="table-container">
      <el-table
        ref="leadTableRef"
        v-loading="loading"
        :data="leads"
        class="lead-table"
        row-class-name="lead-row"
        border
        @row-click="handleRowClick"
        @header-dragend="handleColumnResize"
      >
        <el-table-column label="联系人" min-width="200">
          <template #default="{ row }">
            <div class="contact-cell">
              <el-avatar :size="40" class="contact-avatar">
                {{ row.contactName?.[0] }}
              </el-avatar>
              <div class="contact-info">
                <span class="contact-name">{{ row.contactName }}</span>
                <span class="contact-company">{{ row.companyName }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="联系方式" min-width="180">
          <template #default="{ row }">
            <div class="contact-methods">
              <span class="contact-email">{{ row.email }}</span>
              <span class="contact-phone">{{ row.phone }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="来源" width="100" align="center">
          <template #default="{ row }">
            <span class="source-badge" :class="row.sourceChannel">
              {{ getSourceLabel(row.sourceChannel) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <span class="status-badge" :class="row.status.toLowerCase()">
              {{ getStatusLabel(row.status) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="评分" width="80" align="center">
          <template #default="{ row }">
            <div class="score-ring" :class="getScoreClass(row.score)">
              {{ row.score }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="负责人" width="100">
          <template #default="{ row }">
            <el-avatar v-if="row.assignedTo" :size="28" class="assignee-avatar">
              {{ row.assignedTo.name?.[0] }}
            </el-avatar>
            <span v-else class="unassigned">未分配</span>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="120">
          <template #default="{ row }">
            <span class="date-text">{{ formatDate(row.createdAt) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-tooltip content="编辑" placement="top">
                <el-button circle size="small" @click.stop="handleEdit(row)">
                  <el-icon><Edit /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="转化为客户" placement="top">
                <el-button 
                  circle 
                  size="small" 
                  type="success"
                  :disabled="row.status === 'CONVERTED'"
                  @click.stop="handleConvert(row)"
                >
                  <el-icon><UserFilled /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button circle size="small" type="danger" @click.stop="handleDelete(row)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-bar">
        <span class="pagination-info">显示 {{ (page - 1) * limit + 1 }}-{{ Math.min(page * limit, total) }} 条</span>
        <el-pagination
          v-model:current-page="page"
          :page-size="limit"
          :total="total"
          :pager-count="5"
          layout="prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 卡片视图 -->
    <div v-else class="card-view">
      <div v-for="lead in leads" :key="lead.id" class="lead-card" @click="handleRowClick(lead)">
        <div class="card-header">
          <el-avatar :size="48">{{ lead.contactName?.[0] }}</el-avatar>
          <div class="card-title">
            <span class="card-name">{{ lead.contactName }}</span>
            <span class="card-company">{{ lead.companyName }}</span>
          </div>
          <span class="status-badge" :class="lead.status.toLowerCase()">
            {{ getStatusLabel(lead.status) }}
          </span>
        </div>
        <div class="card-body">
          <div class="card-row">
            <el-icon><Message /></el-icon>
            <span>{{ lead.email }}</span>
          </div>
          <div class="card-row">
            <el-icon><Phone /></el-icon>
            <span>{{ lead.phone }}</span>
          </div>
        </div>
        <div class="card-footer">
          <div class="score-ring small" :class="getScoreClass(lead.score)">{{ lead.score }}</div>
          <span class="card-date">{{ formatDate(lead.createdAt) }}</span>
        </div>
      </div>
    </div>

    <!-- 新建/编辑对话框 -->
    <LeadFormDialog
      v-model:visible="showCreateDialog"
      :lead="editingLead"
      @success="handleSuccess"
    />
    <LeadImportDialog ref="importDialogRef" @success="handleSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, Search, List, Edit, Delete, UserFilled, Message, Phone,
  Document, Star, Clock, CircleCheck, WarningFilled, Grid, Upload
} from '@element-plus/icons-vue'
import { useLeadStore } from '@/stores'
import type { Lead } from '@tonghai/shared/types'
import LeadFormDialog from './components/LeadFormDialog.vue'
import LeadImportDialog from '@/components/LeadImportDialog.vue'

const router = useRouter()
const leadStore = useLeadStore()
const { leads, loading, total, page, limit } = storeToRefs(leadStore)

const showCreateDialog = ref(false)
const editingLead = ref<Lead | null>(null)
const viewMode = ref<'table' | 'card'>('table')
const assignees = ref<{ id: string; name: string }[]>([])
const leadTableRef = ref()
const importDialogRef = ref()

// 列宽持久化存储键
const COLUMN_WIDTH_KEY = 'lead-table-column-widths'

const filters = reactive({
  status: '',
  sourceChannel: '',
  assignedTo: '',
  search: '',
})

// 状态统计数据
const statusStats = computed(() => [
  { status: '', label: '全部', count: total.value, icon: markRaw(Document), gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { status: 'NEW', label: '新线索', count: leads.value.filter(l => l.status === 'NEW').length, icon: markRaw(Star), gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { status: 'IN_PROGRESS', label: '跟进中', count: leads.value.filter(l => l.status === 'IN_PROGRESS').length, icon: markRaw(Clock), gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { status: 'CONVERTED', label: '已转化', count: leads.value.filter(l => l.status === 'CONVERTED').length, icon: markRaw(CircleCheck), gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { status: 'LOST', label: '已流失', count: leads.value.filter(l => l.status === 'LOST').length, icon: markRaw(WarningFilled), gradient: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)' },
])

onMounted(() => {
  leadStore.fetchLeads()
  // 恢复保存的列宽
  restoreColumnWidths()
})

// 恢复列宽
function restoreColumnWidths() {
  const saved = localStorage.getItem(COLUMN_WIDTH_KEY)
  if (!saved) return
  
  try {
    const widths = JSON.parse(saved) as Record<string, number>
    // 延迟执行以确保表格已渲染
    setTimeout(() => {
      if (!leadTableRef.value) return
      const columns = leadTableRef.value.columns as any[]
      columns.forEach((col: any) => {
        const label = col.label
        if (label && widths[label]) {
          col.width = widths[label]
          col.realWidth = widths[label]
        }
      })
    }, 100)
  } catch (e) {
    console.warn('恢复列宽失败:', e)
  }
}

// 保存列宽
function handleColumnResize(newWidth: number, _oldWidth: number, column: any) {
  const saved = localStorage.getItem(COLUMN_WIDTH_KEY)
  const widths = saved ? JSON.parse(saved) : {}
  widths[column.label] = newWidth
  localStorage.setItem(COLUMN_WIDTH_KEY, JSON.stringify(widths))
}

function filterByStatus(status: string) {
  filters.status = filters.status === status ? '' : status
  handleSearch()
}

function handleSearch() {
  leadStore.setFilters({
    status: filters.status as any || undefined,
    sourceChannel: filters.sourceChannel || undefined,
    search: filters.search || undefined,
  })
  leadStore.fetchLeads()
}

function handleCreate() {
  editingLead.value = null
  showCreateDialog.value = true
}

function handleImport() {
  importDialogRef.value?.show()
}

function handlePageChange(newPage: number) {
  leadStore.setPage(newPage)
  leadStore.fetchLeads()
}

function handleRowClick(row: Lead) {
  router.push(`/leads/${row.id}`)
}

function handleEdit(lead: Lead) {
  editingLead.value = lead
  showCreateDialog.value = true
}

async function handleConvert(lead: Lead) {
  try {
    await ElMessageBox.confirm(
      `确定要将线索 "${lead.contactName}" 转化为客户吗？`,
      '转化确认',
      { type: 'success', confirmButtonText: '确认转化' }
    )
    // TODO: 调用转化 API
    ElMessage.success('转化成功')
  } catch {
    // 用户取消
  }
}

async function handleDelete(lead: Lead) {
  try {
    await ElMessageBox.confirm(
      `确定要删除线索 "${lead.contactName}" 吗？此操作不可恢复。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '确认删除', confirmButtonClass: 'el-button--danger' }
    )
    await leadStore.deleteLead(lead.id)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

function handleSuccess() {
  editingLead.value = null
  leadStore.fetchLeads()
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
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

function getSourceLabel(source: string): string {
  const map: Record<string, string> = {
    website_form: '官网',
    referral: '推荐',
    event: '活动',
    other: '其他',
  }
  return map[source] || source
}

function getScoreClass(score: number): string {
  if (score >= 80) return 'high'
  if (score >= 50) return 'medium'
  return 'low'
}
</script>

<style scoped>
.lead-list {
  max-width: 1600px;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  color: var(--color-text);
  margin: 0;
  letter-spacing: -0.02em;
}

.lead-count {
  font-size: 14px;
  color: var(--color-text-muted);
  font-weight: 500;
}

/* 统计卡片 */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.stat-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.stat-card.active {
  border-color: var(--color-primary);
  background: rgba(8, 145, 178, 0.05);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-text);
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-top: 4px;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
}

.filter-left {
  display: flex;
  gap: 12px;
  flex: 1;
}

.search-input {
  width: 320px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 10px;
  padding: 4px 12px;
}

.search-icon {
  color: var(--color-text-muted);
}

.filter-select {
  width: 140px;
}

.view-toggle :deep(.el-button) {
  padding: 8px 16px;
}

/* 表格容器 */
.table-container {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
}

.lead-table {
  --el-table-border-color: var(--color-border);
  --el-table-header-bg-color: var(--color-background);
  --el-table-row-hover-bg-color: rgba(8, 145, 178, 0.03);
}

:deep(.lead-table th.el-table__cell) {
  background: var(--color-background) !important;
  color: var(--color-text-muted);
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 16px 12px;
  border-bottom: 1px solid var(--color-border) !important;
}

:deep(.lead-table td.el-table__cell) {
  padding: 16px 12px;
  border-bottom: 1px solid var(--color-border) !important;
}

:deep(.lead-row) {
  cursor: pointer;
  transition: background 0.15s ease;
}

/* 联系人单元格 */
.contact-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.contact-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.contact-name {
  font-weight: 600;
  color: var(--color-text);
}

.contact-company {
  font-size: 12px;
  color: var(--color-text-muted);
}

/* 联系方式 */
.contact-methods {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.contact-email {
  font-size: 13px;
  color: var(--color-text);
}

.contact-phone {
  font-size: 12px;
  color: var(--color-text-muted);
}

/* 来源徽章 */
.source-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: var(--color-surface-hover);
  color: var(--color-text-muted);
}

.source-badge.website_form { background: rgba(8, 145, 178, 0.1); color: #0891b2; }
.source-badge.referral { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
.source-badge.event { background: rgba(249, 115, 22, 0.1); color: #f97316; }

/* 状态徽章 */
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.new { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
.status-badge.contacted { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.status-badge.qualified { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
.status-badge.in_progress { background: rgba(249, 115, 22, 0.1); color: #f97316; }
.status-badge.lost { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
.status-badge.converted { background: rgba(6, 182, 212, 0.1); color: #06b6d4; }

/* 评分环 */
.score-ring {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
}

.score-ring.high { background: rgba(34, 197, 94, 0.1); color: #22c55e; border: 2px solid #22c55e; }
.score-ring.medium { background: rgba(249, 115, 22, 0.1); color: #f97316; border: 2px solid #f97316; }
.score-ring.low { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 2px solid #ef4444; }

.score-ring.small {
  width: 28px;
  height: 28px;
  font-size: 11px;
}

/* 负责人头像 */
.assignee-avatar {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
  font-size: 12px;
}

.unassigned {
  font-size: 12px;
  color: var(--color-text-muted);
}

.date-text {
  font-size: 13px;
  color: var(--color-text-muted);
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 8px;
}

/* 分页栏 */
.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid var(--color-border);
}

.pagination-info {
  font-size: 13px;
  color: var(--color-text-muted);
}

/* 卡片视图 */
.card-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.lead-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.lead-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.card-title {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-name {
  font-weight: 600;
  color: var(--color-text);
}

.card-company {
  font-size: 13px;
  color: var(--color-text-muted);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.card-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-muted);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}

.card-date {
  font-size: 12px;
  color: var(--color-text-muted);
}
</style>
