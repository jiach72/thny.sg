<template>
  <div class="vendor-list">
    <!-- 统计卡片 -->
    <div class="stats-row">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
                <el-icon :size="24"><OfficeBuilding /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.total }}</div>
                <div class="stat-label">供应商总数</div>
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
                <div class="stat-value">{{ stats.active }}</div>
                <div class="stat-label">活跃供应商</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
                <el-icon :size="24"><Warning /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.expiringContracts }}</div>
                <div class="stat-label">合同即将到期</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
                <el-icon :size="24"><Tickets /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.inactive }}</div>
                <div class="stat-label">非活跃</div>
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
          <el-input v-model="searchQuery" placeholder="搜索供应商..." :prefix-icon="Search" clearable style="width: 280px" @input="handleSearch" />
          <el-select v-model="filterType" placeholder="类型筛选" clearable style="width: 180px" @change="loadData">
            <el-option v-for="t in vendorTypes" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
          <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 140px" @change="loadData">
            <el-option label="活跃" value="ACTIVE" />
            <el-option label="非活跃" value="INACTIVE" />
            <el-option label="黑名单" value="BLACKLISTED" />
          </el-select>
        </div>
        <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">新增供应商</el-button>
      </div>
    </el-card>

    <!-- 供应商表格 -->
    <el-card shadow="never">
      <el-table :data="vendors" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="name" label="供应商名称" min-width="180">
          <template #default="{ row }">
            <router-link :to="`/vendors/${row.id}`" class="vendor-name-link">{{ row.name }}</router-link>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="140">
          <template #default="{ row }">
            <el-tag :type="getTypeTagColor(row.type)" size="small">{{ getTypeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="contactName" label="联系人" width="120" />
        <el-table-column prop="contactEmail" label="邮箱" width="200" />
        <el-table-column prop="contactPhone" label="电话" width="140" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : row.status === 'BLACKLISTED' ? 'danger' : 'info'" size="small">
              {{ row.status === 'ACTIVE' ? '活跃' : row.status === 'BLACKLISTED' ? '黑名单' : '非活跃' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rating" label="评分" width="120">
          <template #default="{ row }">
            <el-rate v-model="row.rating" disabled :max="5" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="项目数" width="80" align="center">
          <template #default="{ row }">
            <el-badge :value="row.assignments?.length || 0" :max="99" type="primary" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/vendors/${row.id}`)">详情</el-button>
            <el-button link type="danger" v-permission="['vendors:delete']" @click="handleDelete(row)">删除</el-button>
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

    <!-- 新增供应商弹窗 -->
    <el-dialog v-model="showCreateDialog" title="新增供应商" width="600px" destroy-on-close>
      <el-form :model="createForm" label-width="100px" :rules="createRules" ref="createFormRef">
        <el-form-item label="名称" prop="name">
          <el-input v-model="createForm.name" placeholder="供应商公司名称" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="createForm.type" placeholder="选择类型" style="width: 100%">
            <el-option v-for="t in vendorTypes" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="联系人">
              <el-input v-model="createForm.contactName" placeholder="联系人姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="contactEmail">
              <el-input v-model="createForm.contactEmail" placeholder="电子邮箱" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="电话">
              <el-input v-model="createForm.contactPhone" placeholder="联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="网站">
              <el-input v-model="createForm.website" placeholder="公司网站" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="地址">
          <el-input v-model="createForm.address" placeholder="地址" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="createForm.notes" type="textarea" :rows="3" placeholder="备注信息" />
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { OfficeBuilding, CircleCheck, Warning, Tickets, Search, Plus } from '@element-plus/icons-vue'
import { apiClient } from '@/api'

// 供应商类型映射
const vendorTypes = [
  { value: 'CORPORATE_SECRETARY', label: '秘书公司' },
  { value: 'LAW_FIRM', label: '律师事务所' },
  { value: 'ACCOUNTING_FIRM', label: '会计事务所' },
  { value: 'BANK', label: '银行' },
  { value: 'INSURANCE', label: '保险公司' },
  { value: 'TRANSLATION', label: '翻译公司' },
  { value: 'LOGISTICS', label: '物流公司' },
  { value: 'IT_SERVICE', label: 'IT 服务' },
  { value: 'OTHER', label: '其他' },
]

const getTypeLabel = (type: string) => vendorTypes.find(t => t.value === type)?.label || type
const getTypeTagColor = (type: string) => {
  const colors: Record<string, string> = {
    CORPORATE_SECRETARY: 'primary', LAW_FIRM: 'warning', ACCOUNTING_FIRM: 'success',
    BANK: '', INSURANCE: 'info', OTHER: 'info',
  }
  return colors[type] || 'info'
}

// 状态
const vendors = ref<any[]>([])
const loading = ref(false)
const submitting = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const searchQuery = ref('')
const filterType = ref('')
const filterStatus = ref('')
const showCreateDialog = ref(false)
const createFormRef = ref()

const stats = ref({ total: 0, active: 0, inactive: 0, expiringContracts: 0, byType: [] })

const createForm = reactive({
  name: '', type: 'OTHER', contactName: '', contactEmail: '',
  contactPhone: '', website: '', address: '', notes: '',
})

const createRules = {
  name: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
  contactEmail: [{ type: 'email' as const, message: '请输入有效邮箱', trigger: 'blur' }],
}

// 搜索节流
let searchTimer: ReturnType<typeof setTimeout>
const handleSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    loadData()
  }, 300)
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.append('page', String(page.value))
    params.append('limit', String(pageSize.value))
    if (searchQuery.value) params.append('search', searchQuery.value)
    if (filterType.value) params.append('type', filterType.value)
    if (filterStatus.value) params.append('status', filterStatus.value)

    const res = await apiClient.get(`/vendors?${params}`) as any
    vendors.value = res?.data || []
    total.value = res?.pagination?.total || 0
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const res = await apiClient.get('/vendors/stats') as any
    stats.value = res || { total: 0, active: 0, inactive: 0, expiringContracts: 0, byType: [] }
  } catch { /* 忽略统计加载失败 */ }
}

const handleCreate = async () => {
  try {
    await createFormRef.value?.validate()
  } catch { return }

  submitting.value = true
  try {
    await apiClient.post('/vendors', createForm)
    ElMessage.success('供应商创建成功')
    showCreateDialog.value = false
    Object.assign(createForm, { name: '', type: 'OTHER', contactName: '', contactEmail: '', contactPhone: '', website: '', address: '', notes: '' })
    loadData()
    loadStats()
  } catch (e: any) {
    ElMessage.error(e?.message || '创建失败')
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除供应商「${row.name}」吗？此操作不可撤销。`, '确认删除', { type: 'warning' })
    await apiClient.delete(`/vendors/${row.id}`)
    ElMessage.success('删除成功')
    loadData()
    loadStats()
  } catch { /* 取消操作 */ }
}

onMounted(() => {
  loadData()
  loadStats()
})
</script>

<style scoped>
.vendor-list {
  padding: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 12px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.toolbar-card {
  margin-bottom: 16px;
  border-radius: 12px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar-left {
  display: flex;
  gap: 12px;
}

.vendor-name-link {
  color: var(--el-color-primary);
  text-decoration: none;
  font-weight: 500;
}

.vendor-name-link:hover {
  text-decoration: underline;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
