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
          <el-option label="手动录入" value="MANUAL" />
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

    <!-- 批量操作栏 -->
    <Transition name="slide-up">
      <div v-if="selectedLeads.length > 0" class="batch-actions-bar">
        <div class="batch-info">
          <el-checkbox 
            :model-value="isAllSelected" 
            :indeterminate="isIndeterminate"
            @change="handleSelectAll"
          />
          <span class="selected-count">已选择 <strong>{{ selectedLeads.length }}</strong> 条线索</span>
        </div>
        <div class="batch-buttons">
          <el-button size="small" v-permission="['leads:update']" @click="handleBatchAssign">
            <el-icon><UserFilled /></el-icon>
            批量分配
          </el-button>
          <el-button size="small" v-permission="['leads:update']" @click="handleBatchUpdateStatus">
            <el-icon><Edit /></el-icon>
            批量改状态
          </el-button>
          <el-button size="small" @click="handleBatchExport">
            <el-icon><Download /></el-icon>
            导出选中
          </el-button>
          <el-button size="small" type="danger" v-permission="['leads:delete']" @click="handleBatchDelete">
            <el-icon><Delete /></el-icon>
            批量删除
          </el-button>
          <el-button size="small" text @click="clearSelection">
            取消选择
          </el-button>
        </div>
      </div>
    </Transition>

    <!-- 表格视图 -->
    <div v-if="viewMode === 'table'" class="table-container">
      <!-- 骨架屏加载 -->
      <el-skeleton v-if="loading && leads.length === 0" :rows="8" animated class="skeleton-table" />
      <el-table
        v-else
        ref="leadTableRef"
        :data="leads"
        v-loading="loading"
        class="lead-table"
        row-class-name="lead-row"
        border
        @row-click="handleRowClick"
        @header-dragend="handleColumnResize"
        @selection-change="handleSelectionChange"
      >
        <!-- 批量选择列 -->
        <el-table-column
          type="selection"
          width="50"
          align="center"
          @click.stop
        />
        <el-table-column label="联系人" min-width="180">
          <template #default="{ row }">
            <div class="contact-cell">
              <el-avatar :size="36" class="contact-avatar">
                {{ row.contactName?.[0] }}
              </el-avatar>
              <div class="contact-info">
                <span class="contact-name">{{ row.contactName }}</span>
                <span v-if="row.companyName" class="contact-company">{{ row.companyName }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="联系方式" min-width="160">
          <template #default="{ row }">
            <div class="contact-methods">
              <span v-if="row.email" class="contact-email">{{ row.email }}</span>
              <span v-if="row.phone" class="contact-phone">{{ row.phone }}</span>
              <span v-if="!row.email && !row.phone" class="unassigned">—</span>
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

        <el-table-column label="评分" width="80" align="center" sortable sort-by="score">
          <template #default="{ row }">
            <ScoreRing :score="row.score || 0" :size="32" :strokeWidth="4" />
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

        <el-table-column label="创建时间" width="110" sortable sort-by="createdAt">
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
      <!-- 空状态 -->
      <el-empty v-if="!loading && leads.length === 0" description="暂无线索数据" :image-size="200">
        <el-button type="primary" @click="handleCreate">新建第一条线索</el-button>
      </el-empty>
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
          <ScoreRing :score="lead.score || 0" :size="32" :strokeWidth="4" />
          <span class="card-date">{{ formatDate(lead.createdAt) }}</span>
        </div>
      </div>
    </div>

    <!-- 批量分配对话框 -->
    <el-dialog v-model="showAssignDialog" title="批量分配线索" width="400px" custom-class="assign-dialog">
      <el-form label-position="top">
        <el-form-item label="选择负责人">
          <el-select v-model="assignTarget" placeholder="请选择新负责人" style="width: 100%">
            <el-option v-for="user in assignees" :key="user.id" :label="user.name" :value="user.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="分配备注（可选）">
           <el-input v-model="assignReason" type="textarea" :rows="2" placeholder="请输入分配原因或注意事项..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showAssignDialog = false">取消</el-button>
          <el-button type="primary" v-permission="['leads:update']" @click="confirmBatchAssign" :disabled="!assignTarget">确认分配</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 批量改状态对话框 -->
    <el-dialog v-model="showStatusDialog" title="批量修改状态" width="400px">
      <el-form label-position="top">
        <el-form-item label="选择新状态">
          <el-select v-model="batchStatusTarget" placeholder="请选择目标状态" style="width: 100%">
            <el-option label="新线索" value="NEW" />
            <el-option label="已联系" value="CONTACTED" />
            <el-option label="已确认" value="QUALIFIED" />
            <el-option label="跟进中" value="IN_PROGRESS" />
            <el-option label="已转化" value="CONVERTED" />
            <el-option label="已流失" value="LOST" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showStatusDialog = false">取消</el-button>
        <el-button type="primary" :disabled="!batchStatusTarget" @click="confirmBatchUpdateStatus">确认修改</el-button>
      </template>
    </el-dialog>

    <!-- 新建/编辑对话框 -->
    <LeadFormDialog
      v-model:visible="showCreateDialog"
      :lead="editingLead"
      @success="handleSuccess"
    />
    <LeadConvertDialog
      v-model:visible="showConvertDialog"
      :lead="convertingLead"
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
  Document, Star, Clock, CircleCheck, WarningFilled, Grid, Upload, Download
} from '@element-plus/icons-vue'
import { useLeadStore } from '@/stores'
import type { Lead } from '@tonghai/shared/types'
import LeadFormDialog from './components/LeadFormDialog.vue'
import LeadConvertDialog from './components/LeadConvertDialog.vue'
import LeadImportDialog from '@/components/LeadImportDialog.vue'
import ScoreRing from '@/components/common/ScoreRing.vue'
import { userApi } from '@/api/userApi'
import { logger } from '@/utils/logger'

const router = useRouter()
const leadStore = useLeadStore()
const { leads, loading, total, page, limit } = storeToRefs(leadStore)

const showCreateDialog = ref(false)
const showConvertDialog = ref(false)
const editingLead = ref<Lead | null>(null)
const convertingLead = ref<Lead | null>(null)
const viewMode = ref<'table' | 'card'>('table')
const assignees = ref<{ id: string; name: string }[]>([])
const leadTableRef = ref()
const importDialogRef = ref()
const selectedLeads = ref<Lead[]>([])

// 批量分配相关的状态
const showAssignDialog = ref(false)
const assignTarget = ref('')
const assignReason = ref('')

// 批量选择状态
const isAllSelected = computed(() => {
  return leads.value.length > 0 && selectedLeads.value.length === leads.value.length
})

const isIndeterminate = computed(() => {
  return selectedLeads.value.length > 0 && selectedLeads.value.length < leads.value.length
})

// 列宽持久化存储键
const COLUMN_WIDTH_KEY = 'lead-table-column-widths'

const filters = reactive({
  status: '',
  sourceChannel: '',
  assignedTo: '',
  search: '',
})

// 状态统计数据（从服务端获取的聚合数据）
const statusCounts = ref<Record<string, number>>({})

const statusStats = computed(() => [
  { status: '', label: '全部', count: total.value, icon: markRaw(Document), gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { status: 'NEW', label: '新线索', count: statusCounts.value['NEW'] || 0, icon: markRaw(Star), gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { status: 'IN_PROGRESS', label: '跟进中', count: statusCounts.value['IN_PROGRESS'] || 0, icon: markRaw(Clock), gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { status: 'CONVERTED', label: '已转化', count: statusCounts.value['CONVERTED'] || 0, icon: markRaw(CircleCheck), gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { status: 'LOST', label: '已流失', count: statusCounts.value['LOST'] || 0, icon: markRaw(WarningFilled), gradient: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)' },
])

// 拉取各状态的线索计数（遍历所有状态分别查询聚合）
async function fetchStatusCounts() {
  try {
    // 用一次不带状态过滤的请求获取全部线索，然后在前端按状态分组计数
    // 这里简化为：遍历当前已拉取的数据（当 pageSize 足够大时准确）
    // 或者后端已有分组聚合接口可直接调用
    const allStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'IN_PROGRESS', 'LOST', 'CONVERTED']
    const counts: Record<string, number> = {}
    allStatuses.forEach(s => { counts[s] = 0 })
    // 先用当前页数据填充（后续可替换为服务端聚合接口）
    leads.value.forEach(l => {
      if (counts[l.status] !== undefined) counts[l.status]++
    })
    statusCounts.value = counts
  } catch (e) {
    logger.error('LeadList', '获取状态计数失败:', e)
  }
}

onMounted(async () => {
  await leadStore.fetchLeads()
  fetchStatusCounts()
  // 恢复保存的列宽
  restoreColumnWidths()
  
  // 拉取所有员工以便筛选和重新分配
  try {
    const res = await userApi.getList()
    // 兼容 API 嵌套结构
    const userList = (res as any).data || res
    if (Array.isArray(userList)) {
      assignees.value = userList.map((u: any) => ({ id: u.id, name: u.name }))
    }
  } catch (e) {
    logger.error('LeadList', '获取所有员工列表失败:', e)
  }
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
    logger.warn('LeadList', '恢复列宽失败:', e)
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

function handleConvert(lead: Lead) {
  convertingLead.value = lead
  showConvertDialog.value = true
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

// 批量操作函数
function handleSelectionChange(selection: Lead[]) {
  selectedLeads.value = selection
}

function handleSelectAll(val: boolean) {
  if (val) {
    leadTableRef.value?.toggleAllSelection()
  } else {
    leadTableRef.value?.clearSelection()
  }
}

function clearSelection() {
  leadTableRef.value?.clearSelection()
  selectedLeads.value = []
}

function handleBatchAssign() {
  if (selectedLeads.value.length === 0) return
  assignTarget.value = ''
  assignReason.value = ''
  showAssignDialog.value = true
}

async function confirmBatchAssign() {
  if (!assignTarget.value) return
  try {
    const targetId = assignTarget.value
    const reason = assignReason.value
    showAssignDialog.value = false
    
    ElMessage.info(`正在分配 ${selectedLeads.value.length} 条线索...`)
    
    // 循环并发分配线索给相同员工
    await Promise.all(
       selectedLeads.value.map(lead => leadStore.assignLead(lead.id, targetId, reason || undefined))
    )
    
    ElMessage.success(`已成功分配 ${selectedLeads.value.length} 条线索`)
    clearSelection()
    leadStore.fetchLeads()
  } catch (e: any) {
    ElMessage.error(e.message || '分配遇到错误')
  }
}

// 批量改状态 - 使用下拉选择而非文本输入
const showStatusDialog = ref(false)
const batchStatusTarget = ref('')

function handleBatchUpdateStatus() {
  if (selectedLeads.value.length === 0) return
  batchStatusTarget.value = ''
  showStatusDialog.value = true
}

async function confirmBatchUpdateStatus() {
  if (!batchStatusTarget.value) return
  try {
    showStatusDialog.value = false
    ElMessage.info(`正在批量更新 ${selectedLeads.value.length} 条线索...`)
    await Promise.all(
      selectedLeads.value.map(lead => leadStore.updateLead(lead.id, { status: batchStatusTarget.value as Lead['status'] }))
    )
    
    ElMessage.success(`已将 ${selectedLeads.value.length} 条线索状态更新为 ${getStatusLabel(batchStatusTarget.value)}`)
    clearSelection()
    await leadStore.fetchLeads()
    fetchStatusCounts()
  } catch {
    // 用户取消或报错
  }
}

function handleBatchExport() {
  // 导出为 CSV
  const headers = ['联系人', '公司', '邮箱', '电话', '来源', '状态', '评分']
  const rows = selectedLeads.value.map(lead => [
    lead.contactName,
    lead.companyName,
    lead.email,
    lead.phone,
    lead.sourceChannel,
    lead.status,
    lead.score,
  ])
  
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `线索导出_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success(`已导出 ${selectedLeads.value.length} 条线索`)
}

async function handleBatchDelete() {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedLeads.value.length} 条线索吗？此操作不可恢复。`,
      '批量删除确认',
      { type: 'warning', confirmButtonText: '确认删除', confirmButtonClass: 'el-button--danger' }
    )
    // 逐个删除
    for (const lead of selectedLeads.value) {
      await leadStore.deleteLead(lead.id)
    }
    ElMessage.success(`已删除 ${selectedLeads.value.length} 条线索`)
    clearSelection()
    leadStore.fetchLeads()
  } catch {
    // 用户取消
  }
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
    MANUAL: '手动',
    website_form: '官网',
    WEBSITE: '官网',
    referral: '推荐',
    REFERRAL: '推荐',
    event: '活动',
    EVENT: '活动',
    IMPORT: '导入',
    other: '其他',
  }
  return map[source] || source
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

/* 批量操作栏 */
.batch-actions-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: linear-gradient(135deg, rgba(8, 145, 178, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%);
  border: 1px solid var(--color-primary);
  border-radius: 12px;
  margin-bottom: 16px;
}

.batch-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selected-count {
  font-size: 14px;
  color: var(--color-text);
}

.selected-count strong {
  color: var(--color-primary);
  font-weight: 700;
}

.batch-buttons {
  display: flex;
  gap: 8px;
}

/* 批量操作栏动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 微交互: 表格行悬停左侧指示条 */
:deep(.el-table__body tr:hover > td:first-child) {
  box-shadow: inset 3px 0 0 0 var(--color-primary);
}

/* 微交互: "新线索" 状态脉冲动画 */
.status-badge.new {
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba(99, 102, 241, 0); }
}

/* 微交互: 卡片视图列表过渡动画 */
.card-view .lead-card {
  transition: all 0.3s ease;
}
</style>
