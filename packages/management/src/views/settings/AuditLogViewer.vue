<template>
  <div class="audit-log-viewer">
    <div class="page-header">
      <h2>审计日志</h2>
      <el-button icon="Refresh" circle @click="fetchLogs" :loading="loading" />
    </div>

    <el-card shadow="never">
      <!-- 列表筛选 -->
      <div class="filter-panel">
        <el-form :inline="true" :model="filters">
          <el-form-item label="操作类型">
            <el-select v-model="filters.action" placeholder="全部类型" clearable @change="handleSearch">
              <el-option label="系统登录 (LOGIN)" value="LOGIN" />
              <el-option label="系统登出 (LOGOUT)" value="LOGOUT" />
              <el-option label="数据访问 (DATA_ACCESS)" value="DATA_ACCESS" />
              <el-option label="数据导出 (DATA_EXPORT)" value="DATA_EXPORT" />
              <el-option label="权限变更 (PERMISSION_CHANGE)" value="PERMISSION_CHANGE" />
              <el-option label="系统配置变更 (CONFIG_CHANGE)" value="CONFIG_CHANGE" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="资源分类">
            <el-input v-model="filters.resource" placeholder="如: User, Customer" clearable @keyup.enter="handleSearch" style="width: 200px">
              <template #append>
                <el-button icon="Search" @click="handleSearch" />
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="员工ID">
            <el-input v-model="filters.userId" placeholder="输入员工 UUID" clearable @keyup.enter="handleSearch" style="width: 200px" />
          </el-form-item>
          
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="handleDateChange"
            />
          </el-form-item>
          
          <el-form-item>
            <el-button text @click="resetFilters">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 日志表格 -->
      <el-table
        v-loading="loading"
        :data="logs"
        style="width: 100%"
        border
        size="small"
      >
        <el-table-column prop="createdAt" label="时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作人" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="user-info" v-if="row.user">
              <span class="user-name">{{ row.user.name }}</span>
              <span class="user-email">{{ row.user.email }}</span>
            </div>
            <span v-else>{{ row.userId }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="action" label="操作类型" width="160">
          <template #default="{ row }">
            <el-tag size="small" :type="getActionType(row.action)">
              {{ row.action }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作对象 (资源)" width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.resource">{{ row.resource }} <template v-if="row.resourceId">({{ row.resourceId }})</template></span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        
        <el-table-column label="IP / 环境" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="env-info">
              <div>IP: {{ row.ipAddress || '-' }}</div>
              <div class="user-agent" :title="row.userAgent">{{ row.userAgent || '-' }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作明细" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetails(row)" :disabled="!row.details">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="fetchLogs"
          @current-change="fetchLogs"
        />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="操作明细负载 (Details JSON)" width="600px">
      <div v-if="currentDetails" class="json-viewer">
        <pre>{{ JSON.stringify(currentDetails, null, 2) }}</pre>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import auditApi from '@/api/auditApi'

const loading = ref(false)
const logs = ref<any[]>([])

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const filters = reactive({
  action: '',
  resource: '',
  userId: '',
  startDate: '',
  endDate: ''
})

const dateRange = ref<[string, string] | null>(null)

const detailVisible = ref(false)
const currentDetails = ref<any>(null)

onMounted(() => {
  fetchLogs()
})

const fetchLogs = async () => {
  loading.value = true
  try {
    const res: any = await auditApi.getAuditLogs({
      page: pagination.page,
      limit: pagination.limit,
      ...filters
    })
    logs.value = res?.data || []
    if (res?.pagination) {
       pagination.total = res.pagination.total || 0
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '获取审计日志失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchLogs()
}

const handleDateChange = (val: [string, string] | null) => {
  if (val) {
    filters.startDate = val[0]
    filters.endDate = val[1]
  } else {
    filters.startDate = ''
    filters.endDate = ''
  }
  handleSearch()
}

const resetFilters = () => {
  filters.action = ''
  filters.resource = ''
  filters.userId = ''
  filters.startDate = ''
  filters.endDate = ''
  dateRange.value = null
  handleSearch()
}

const viewDetails = (row: any) => {
  currentDetails.value = row.details
  detailVisible.value = true
}

// Utils
const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-'
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss')
}

const getActionType = (action: string) => {
  if (action.includes('LOGIN') || action.includes('LOGOUT')) return 'info'
  if (action.includes('EXPORT') || action.includes('CHANGE')) return 'danger'
  if (action.includes('ACCESS')) return 'success'
  return 'primary'
}
</script>

<style scoped>
.audit-log-viewer {
  padding: 24px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}
.filter-panel {
  margin-bottom: 16px;
}
.user-info {
  display: flex;
  flex-direction: column;
}
.user-name {
  font-weight: 500;
  font-size: 13px;
}
.user-email {
  font-size: 12px;
  color: #909399;
}
.env-info {
  font-size: 12px;
  color: #606266;
}
.user-agent {
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}
.json-viewer pre {
  background-color: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  font-size: 13px;
  overflow-x: auto;
}
</style>
