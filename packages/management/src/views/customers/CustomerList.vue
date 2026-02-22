<template>
  <div class="customer-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div>
        <h1 class="page-title">客户管理</h1>
        <p class="page-subtitle">管理所有客户信息、画像与合规状态</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="fetchAll">刷新</el-button>
        <el-button :icon="Download" @click="handleExport">导出 Excel</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #6366f1, #818cf8)">
          <el-icon :size="24"><User /></el-icon>
        </div>
        <div class="stat-body">
          <div class="stat-value">{{ stats.totalCustomers || 0 }}</div>
          <div class="stat-label">客户总数</div>
        </div>
        <div class="stat-badge">+{{ stats.newThisMonth || 0 }} 本月</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #10b981, #34d399)">
          <el-icon :size="24"><CircleCheck /></el-icon>
        </div>
        <div class="stat-body">
          <div class="stat-value">{{ stats.kycApproved || 0 }}</div>
          <div class="stat-label">KYC 已通过</div>
        </div>
        <div class="stat-badge warn">{{ stats.kycPending || 0 }} 待审</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #ef4444, #f87171)">
          <el-icon :size="24"><Warning /></el-icon>
        </div>
        <div class="stat-body">
          <div class="stat-value">{{ stats.highRisk || 0 }}</div>
          <div class="stat-label">高风险客户</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f59e0b, #fbbf24)">
          <el-icon :size="24"><Briefcase /></el-icon>
        </div>
        <div class="stat-body">
          <div class="stat-value">{{ stats.activeProjectCustomers || 0 }}</div>
          <div class="stat-label">活跃项目客户</div>
        </div>
      </div>
    </div>

    <!-- 搜索与筛选 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item>
          <el-input
            v-model="filters.search"
            placeholder="搜索姓名/公司/邮箱/电话"
            :prefix-icon="Search"
            clearable
            style="width: 280px"
            @change="handleSearch"
          />
        </el-form-item>
        <el-form-item label="KYC">
          <el-select v-model="filters.kycStatus" placeholder="全部" clearable @change="handleSearch">
            <el-option label="待审核" value="PENDING" />
            <el-option label="已通过" value="APPROVED" />
            <el-option label="已拒绝" value="REJECTED" />
            <el-option label="复审中" value="REVIEW" />
          </el-select>
        </el-form-item>
        <el-form-item label="风险">
          <el-select v-model="filters.riskGrade" placeholder="全部" clearable @change="handleSearch">
            <el-option label="低风险" value="LOW" />
            <el-option label="中风险" value="MEDIUM" />
            <el-option label="高风险" value="HIGH" />
            <el-option label="极高" value="CRITICAL" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源">
          <el-select v-model="filters.sourceChannel" placeholder="全部" clearable @change="handleSearch">
            <el-option label="官网表单" value="website_form" />
            <el-option label="客户推荐" value="referral" />
            <el-option label="电话营销" value="cold_call" />
            <el-option label="社交媒体" value="social_media" />
            <el-option label="线下活动" value="event" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button text @click="resetFilters">重置筛选</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 客户表格 -->
    <el-card shadow="never">
      <el-table
        v-loading="loading"
        :data="customers"
        stripe
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="50" />

        <el-table-column label="客户" min-width="220" sortable="custom" prop="contactName">
          <template #default="{ row }">
            <div class="customer-cell" @click="goDetail(row.id)">
              <el-avatar :size="40" class="customer-avatar">
                {{ getDisplayName(row)?.[0] || 'C' }}
              </el-avatar>
              <div class="customer-info">
                <span class="customer-name">{{ getDisplayName(row) }}</span>
                <span class="customer-company">{{ row.companyName || row.lead?.companyName || '—' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="联系方式" width="200">
          <template #default="{ row }">
            <div class="contact-cell">
              <span v-if="row.phone || row.lead?.phone">📞 {{ row.phone || row.lead?.phone }}</span>
              <span v-if="row.email || row.lead?.email">✉️ {{ row.email || row.lead?.email }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="KYC 状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="kycTagType(row.kycStatus)" size="small" effect="dark">
              {{ kycLabel(row.kycStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="风险等级" width="110" align="center" sortable="custom" prop="riskGrade">
          <template #default="{ row }">
            <el-tag :type="riskTagType(row.riskGrade)" size="small">
              {{ riskLabel(row.riskGrade) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="活跃项目" width="100" align="center">
          <template #default="{ row }">
            <el-badge :value="row.projects?.filter((p: any) => p.status === 'ACTIVE').length || 0" type="primary" />
          </template>
        </el-table-column>

        <el-table-column label="来源" width="110">
          <template #default="{ row }">
            <span class="source-tag">{{ sourceLabel(row.lead?.sourceChannel) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="专属顾问" width="120">
          <template #default="{ row }">
            <div v-if="row.lead?.assignedTo" class="advisor-cell">
              <el-avatar :size="24">{{ row.lead.assignedTo.name?.[0] }}</el-avatar>
              <span>{{ row.lead.assignedTo.name }}</span>
            </div>
            <span v-else class="text-muted">未分配</span>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="120" sortable="custom" prop="createdAt">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="goDetail(row.id)">详情</el-button>
            <el-button type="success" text size="small" @click="handleMessage(row)">消息</el-button>
            <el-dropdown trigger="click">
              <el-button text size="small">更多</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleCreateProject(row)">创建项目</el-dropdown-item>
                  <el-dropdown-item @click="handleBookAppointment(row)">预约会议</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 批量操作 + 分页 -->
      <div class="table-footer">
        <div class="batch-actions" v-if="selectedRows.length > 0">
          <span>已选 {{ selectedRows.length }} 项</span>
          <el-button size="small" @click="batchUpdateKyc">批量更新 KYC</el-button>
        </div>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="fetchCustomers"
          @size-change="fetchCustomers"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { apiClient } from '@/api'
import {
  User, Search, Refresh, Download, CircleCheck, Warning, Briefcase,
} from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const customers = ref<any[]>([])
const selectedRows = ref<any[]>([])
const stats = ref<any>({})

const filters = reactive({
  search: '',
  kycStatus: '',
  riskGrade: '',
  sourceChannel: '',
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
})

onMounted(() => fetchAll())

async function fetchAll() {
  await Promise.all([fetchCustomers(), fetchStats()])
}

async function fetchStats() {
  try {
    const res = await apiClient.get('/customers/stats') as any
    stats.value = res || {}
  } catch (e) {
    console.error('加载统计失败', e)
  }
}

async function fetchCustomers() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.append('page', String(pagination.page))
    params.append('limit', String(pagination.limit))
    if (filters.search) params.append('search', filters.search)
    if (filters.kycStatus) params.append('kycStatus', filters.kycStatus)
    if (filters.riskGrade) params.append('riskGrade', filters.riskGrade)
    if (filters.sourceChannel) params.append('sourceChannel', filters.sourceChannel)

    const res = await apiClient.get(`/customers?${params}`) as any
    customers.value = res?.data || []
    if (res?.pagination) {
      pagination.total = res.pagination.total
    }
  } catch (e) {
    console.error('加载客户列表失败', e)
    customers.value = []
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchCustomers()
}

function resetFilters() {
  filters.search = ''
  filters.kycStatus = ''
  filters.riskGrade = ''
  filters.sourceChannel = ''
  handleSearch()
}

function handleSortChange({ prop, order }: { prop: string; order: string }) {
  const params = new URLSearchParams()
  if (prop) params.append('sortBy', prop)
  if (order) params.append('sortOrder', order === 'ascending' ? 'asc' : 'desc')
  fetchCustomers()
}

function handleSelectionChange(rows: any[]) {
  selectedRows.value = rows
}

function goDetail(id: string) {
  router.push(`/customers/${id}`)
}

function handleMessage(row: any) {
  router.push(`/messages?recipientId=${row.user?.id || ''}`)
}

function handleCreateProject(row: any) {
  router.push(`/projects?action=create&customerId=${row.id}`)
}

function handleBookAppointment(row: any) {
  ElMessage.info(`预约功能：客户 ${getDisplayName(row)}`)
}

function handleExport() {
  ElMessage.success('导出功能开发中')
}

function batchUpdateKyc() {
  ElMessage.info(`批量更新 ${selectedRows.value.length} 名客户的 KYC 状态`)
}

// 辅助函数
function getDisplayName(row: any): string {
  return row.contactName || row.lead?.contactName || '未命名'
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function kycTagType(status: string) {
  const map: Record<string, string> = { APPROVED: 'success', PENDING: 'warning', REJECTED: 'danger', REVIEW: 'info' }
  return map[status] || 'info'
}

function kycLabel(status: string) {
  const map: Record<string, string> = { APPROVED: '已通过', PENDING: '待审核', REJECTED: '已拒绝', REVIEW: '复审中' }
  return map[status] || status
}

function riskTagType(grade: string) {
  const map: Record<string, string> = { LOW: 'success', MEDIUM: 'warning', HIGH: 'danger', CRITICAL: 'danger' }
  return map[grade] || 'info'
}

function riskLabel(grade: string) {
  const map: Record<string, string> = { LOW: '低', MEDIUM: '中', HIGH: '高', CRITICAL: '极高' }
  return map[grade] || grade
}

function sourceLabel(channel: string) {
  const map: Record<string, string> = { website_form: '官网', referral: '推荐', cold_call: '电话', social_media: '社媒', event: '活动' }
  return map[channel] || channel || '—'
}
</script>

<style scoped>
.customer-management { max-width: 1600px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 700; color: var(--color-text); margin: 0; }
.page-subtitle { color: var(--color-text-muted); margin: 4px 0 0 0; font-size: 14px; }
.header-actions { display: flex; gap: 8px; }

/* 统计卡片 */
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
.stat-card {
  display: flex; align-items: center; gap: 16px; padding: 20px 24px;
  background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 16px;
  position: relative; transition: transform 0.2s, box-shadow 0.2s;
}
.stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
.stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
.stat-body { flex: 1; }
.stat-value { font-size: 28px; font-weight: 700; color: var(--color-text); line-height: 1.2; }
.stat-label { font-size: 13px; color: var(--color-text-muted); margin-top: 2px; }
.stat-badge { position: absolute; top: 12px; right: 16px; font-size: 11px; padding: 2px 8px; border-radius: 10px; background: #ecfdf5; color: #059669; font-weight: 600; }
.stat-badge.warn { background: #fffbeb; color: #d97706; }

/* 筛选 */
.filter-card { margin-bottom: 16px; }
.filter-form { display: flex; flex-wrap: wrap; gap: 0; }

/* 表格 */
.customer-cell { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.customer-cell:hover .customer-name { color: var(--color-primary); }
.customer-avatar { background: linear-gradient(135deg, #6366f1, #818cf8); color: #fff; font-weight: 600; }
.customer-info { display: flex; flex-direction: column; }
.customer-name { font-weight: 600; color: var(--color-text); transition: color 0.2s; }
.customer-company { font-size: 12px; color: var(--color-text-muted); }
.contact-cell { display: flex; flex-direction: column; gap: 2px; font-size: 13px; }
.advisor-cell { display: flex; align-items: center; gap: 6px; font-size: 13px; }
.source-tag { font-size: 12px; color: var(--color-text-muted); }
.text-muted { color: var(--color-text-muted); font-size: 13px; }

/* 底栏 */
.table-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; }
.batch-actions { display: flex; align-items: center; gap: 12px; font-size: 13px; color: var(--color-text-muted); }

@media (max-width: 1200px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px) { .stats-row { grid-template-columns: 1fr; } }
</style>
