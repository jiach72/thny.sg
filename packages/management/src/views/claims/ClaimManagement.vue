<template>
  <div class="claim-management">
    <!-- 统计卡片 -->
    <div class="stats-row">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
                <el-icon :size="24"><Document /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.total }}</div>
                <div class="stat-label">报销总数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: linear-gradient(135deg, #f5af19 0%, #f12711 100%)">
                <el-icon :size="24"><Clock /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.pending }}</div>
                <div class="stat-label">待审批</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%)">
                <el-icon :size="24"><CircleCheck /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.approved }}</div>
                <div class="stat-label">已批准</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
                <el-icon :size="24"><Money /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ formatCurrency(stats.totalApprovedAmount) }}</div>
                <div class="stat-label">已批准总额</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 工具栏 -->
    <el-card shadow="never" class="toolbar-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-select v-model="filterStatus" placeholder="状态" clearable style="width: 160px" @change="loadData">
            <el-option label="草稿" value="DRAFT" />
            <el-option label="待审批" value="SUBMITTED" />
            <el-option label="经理已批" value="MANAGER_APPROVED" />
            <el-option label="已批准" value="APPROVED" />
            <el-option label="已驳回" value="REJECTED" />
            <el-option label="已付款" value="PAID" />
          </el-select>
          <el-date-picker v-model="dateRange" type="daterange" range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 280px" @change="loadData" />
        </div>
        <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">新建报销单</el-button>
      </div>
    </el-card>

    <!-- 报销表格 -->
    <el-card shadow="never">
      <el-table :data="claims" v-loading="loading" stripe>
        <el-table-column prop="claimNumber" label="报销单号" width="180">
          <template #default="{ row }">
            <router-link :to="`/claims/${row.id}`" class="claim-link">{{ row.claimNumber }}</router-link>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="submitter.name" label="提交人" width="120" />
        <el-table-column prop="totalAmount" label="金额" width="140" align="right">
          <template #default="{ row }">
            <span class="amount">{{ row.currency }} {{ Number(row.totalAmount).toLocaleString('en', { minimumFractionDigits: 2 }) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="130">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.status)" size="small" effect="light">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="明细数" width="80" align="center">
          <template #default="{ row }">{{ row.items?.length || 0 }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170">
          <template #default="{ row }">{{ new Date(row.createdAt).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/claims/${row.id}`)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 新建报销单弹窗 -->
    <el-dialog v-model="showCreateDialog" title="新建报销单" width="500px" destroy-on-close>
      <el-form :model="createForm" label-width="100px" :rules="createRules" ref="formRef">
        <el-form-item label="标题" prop="title">
          <el-input v-model="createForm.title" placeholder="报销标题，如：3月差旅费" />
        </el-form-item>
        <el-form-item label="币种">
          <el-select v-model="createForm.currency" style="width: 100%">
            <el-option label="SGD (新加坡元)" value="SGD" />
            <el-option label="USD (美元)" value="USD" />
            <el-option label="CNY (人民币)" value="CNY" />
            <el-option label="HKD (港币)" value="HKD" />
            <el-option label="MYR (马来西亚林吉特)" value="MYR" />
          </el-select>
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="createForm.description" type="textarea" :rows="3" placeholder="报销说明（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="submitting">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Document, Clock, CircleCheck, Money, Plus } from '@element-plus/icons-vue'
import { apiClient } from '@/api'

const router = useRouter()

const claims = ref<any[]>([])
const loading = ref(false)
const submitting = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const filterStatus = ref('')
const dateRange = ref<string[]>([])
const showCreateDialog = ref(false)
const formRef = ref()

const stats = ref({ total: 0, pending: 0, approved: 0, paid: 0, totalApprovedAmount: 0 })

const createForm = reactive({ title: '', currency: 'SGD', description: '' })
const createRules = {
  title: [{ required: true, message: '请输入报销标题', trigger: 'blur' }],
}

const getStatusLabel = (s: string) => {
  const m: Record<string, string> = {
    DRAFT: '草稿', SUBMITTED: '待审批', MANAGER_APPROVED: '经理已批',
    APPROVED: '已批准', REJECTED: '已驳回', PAID: '已付款',
  }
  return m[s] || s
}

const getStatusColor = (s: string) => {
  const m: Record<string, string> = {
    DRAFT: 'info', SUBMITTED: 'warning', MANAGER_APPROVED: '',
    APPROVED: 'success', REJECTED: 'danger', PAID: 'success',
  }
  return m[s] || 'info'
}

const formatCurrency = (v: any) => {
  const num = Number(v) || 0
  return `SGD ${num.toLocaleString('en', { minimumFractionDigits: 2 })}`
}

const loadData = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.append('page', String(page.value))
    params.append('limit', String(pageSize.value))
    if (filterStatus.value) params.append('status', filterStatus.value)
    if (dateRange.value?.length === 2) {
      params.append('startDate', dateRange.value[0])
      params.append('endDate', dateRange.value[1])
    }
    const res = await apiClient.get(`/claims?${params}`) as any
    claims.value = res?.data || []
    total.value = res?.pagination?.total || 0
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const res = await apiClient.get('/claims/stats') as any
    stats.value = res || { total: 0, pending: 0, approved: 0, paid: 0, totalApprovedAmount: 0 }
  } catch { /* 忽略 */ }
}

const handleCreate = async () => {
  try { await formRef.value?.validate() } catch { return }
  submitting.value = true
  try {
    const res = await apiClient.post('/claims', createForm) as any
    ElMessage.success('报销单创建成功，请继续添加明细')
    showCreateDialog.value = false
    Object.assign(createForm, { title: '', currency: 'SGD', description: '' })
    // 跳转到详情页添加明细
    router.push(`/claims/${res.id}`)
  } catch (e: any) {
    ElMessage.error(e?.message || '创建失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadData()
  loadStats()
})
</script>

<style scoped>
.claim-management {
  padding: 20px;
}

.stats-row { margin-bottom: 20px; }
.stat-card { border-radius: 12px; }
.stat-content { display: flex; align-items: center; gap: 16px; }
.stat-icon {
  width: 48px; height: 48px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; color: #fff;
}
.stat-value { font-size: 24px; font-weight: 700; color: var(--el-text-color-primary); }
.stat-label { font-size: 13px; color: var(--el-text-color-secondary); margin-top: 2px; }
.toolbar-card { margin-bottom: 16px; border-radius: 12px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; }
.toolbar-left { display: flex; gap: 12px; }
.claim-link { color: var(--el-color-primary); text-decoration: none; font-weight: 500; }
.claim-link:hover { text-decoration: underline; }
.amount { font-weight: 600; font-family: 'Courier New', monospace; }
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
